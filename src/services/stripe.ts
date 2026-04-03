import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../db/client';
import logger from '../utils/logger';
import { StripeOnboardingResult, PaymentIntentResult } from '../types';
import { OnboardingStatus, OpportunityStatus, PaymentStatus } from '@prisma/client';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

class StripeService {
  async createConnectedAccount(
    opportunityId: string,
    email: string,
    accountName: string,
  ): Promise<StripeOnboardingResult> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { stripeAccount: true },
    });

    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);

    // Idempotency: return existing if already created
    if (opportunity.stripeAccount?.stripeAccountId) {
      const url = await this.refreshOnboardingUrl(
        opportunityId,
        opportunity.stripeAccount.stripeAccountId,
      );
      return {
        accountId: opportunity.stripeAccount.stripeAccountId,
        onboardingUrl: url,
      };
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name: accountName },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { opportunityId, accountName },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${env.API_BASE_URL}/api/stripe/onboarding/refresh?opportunityId=${opportunityId}`,
      return_url: `${env.FRONTEND_URL}/opportunities/${opportunityId}?onboarding=complete`,
      type: 'account_onboarding',
    });

    await prisma.stripeAccount.create({
      data: {
        opportunityId,
        stripeAccountId: account.id,
        onboardingStatus: OnboardingStatus.PENDING,
        onboardingUrl: accountLink.url,
      },
    });

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: OpportunityStatus.INVITE_SENT },
    });

    await prisma.auditLog.create({
      data: {
        opportunityId,
        event: 'STRIPE_ACCOUNT_CREATED',
        metadata: { stripeAccountId: account.id, email },
        level: 'info',
      },
    });

    logger.info(`Stripe connected account created`, { accountId: account.id, opportunityId });
    return { accountId: account.id, onboardingUrl: accountLink.url };
  }

  async refreshOnboardingUrl(opportunityId: string, stripeAccountId: string): Promise<string> {
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${env.API_BASE_URL}/api/stripe/onboarding/refresh?opportunityId=${opportunityId}`,
      return_url: `${env.FRONTEND_URL}/opportunities/${opportunityId}?onboarding=complete`,
      type: 'account_onboarding',
    });

    await prisma.stripeAccount.update({
      where: { stripeAccountId },
      data: { onboardingUrl: link.url },
    });

    return link.url;
  }

  async pollOnboardingStatus(opportunityId: string): Promise<OnboardingStatus> {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { opportunityId },
    });

    if (!stripeAccount) throw new Error(`No Stripe account for opportunity ${opportunityId}`);

    const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);
    const isComplete = account.details_submitted && account.charges_enabled;
    const newStatus = isComplete ? OnboardingStatus.COMPLETE : OnboardingStatus.PENDING;

    if (newStatus !== stripeAccount.onboardingStatus) {
      await prisma.stripeAccount.update({
        where: { opportunityId },
        data: {
          onboardingStatus: newStatus,
          detailsSubmitted: account.details_submitted ?? false,
          chargesEnabled: account.charges_enabled ?? false,
        },
      });

      if (isComplete) {
        await prisma.opportunity.update({
          where: { id: opportunityId },
          data: { status: OpportunityStatus.ONBOARDING_COMPLETE },
        });

        await prisma.auditLog.create({
          data: {
            opportunityId,
            event: 'ONBOARDING_COMPLETE',
            metadata: { stripeAccountId: stripeAccount.stripeAccountId },
            level: 'info',
          },
        });

        logger.info(`Onboarding complete for opportunity ${opportunityId}`);
      }
    }

    return newStatus;
  }

  async createPaymentIntent(opportunityId: string): Promise<PaymentIntentResult> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { invoice: true, stripeAccount: true },
    });

    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);
    if (!opportunity.stripeAccount?.stripeAccountId) {
      throw new Error('Stripe Connected Account not set up for this opportunity');
    }
    if (opportunity.stripeAccount.onboardingStatus !== OnboardingStatus.COMPLETE) {
      throw new Error('Host has not completed Stripe onboarding');
    }

    const amount = opportunity.invoice
      ? opportunity.invoice.totalAmount
      : opportunity.amount;

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_data: { destination: opportunity.stripeAccount.stripeAccountId },
      metadata: {
        opportunityId,
        invoiceId: opportunity.invoice?.id ?? '',
        accountName: opportunity.accountName,
      },
      description: `Payment for ${opportunity.name}`,
    });

    const record = await prisma.paymentRecord.create({
      data: {
        opportunityId,
        invoiceId: opportunity.invoice?.id ?? null,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
        status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
      },
    });

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: OpportunityStatus.PAYMENT_PENDING },
    });

    await prisma.auditLog.create({
      data: {
        opportunityId,
        event: 'PAYMENT_INTENT_CREATED',
        metadata: { paymentIntentId: paymentIntent.id, amount, recordId: record.id },
        level: 'info',
      },
    });

    logger.info(`PaymentIntent created`, { paymentIntentId: paymentIntent.id, amount });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount,
      status: paymentIntent.status,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Stripe webhook signature verification failed', { error: msg });
      throw new Error(`Webhook signature verification failed: ${msg}`);
    }

    logger.info(`Stripe webhook received: ${event.type}`, { eventId: event.id });

    switch (event.type) {
      case 'account.updated':
        await this.onAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'payment_intent.succeeded':
        await this.onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async onAccountUpdated(account: Stripe.Account) {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { stripeAccountId: account.id },
    });

    if (!stripeAccount) return;

    const isComplete = account.details_submitted && account.charges_enabled;

    await prisma.stripeAccount.update({
      where: { stripeAccountId: account.id },
      data: {
        detailsSubmitted: account.details_submitted ?? false,
        chargesEnabled: account.charges_enabled ?? false,
        onboardingStatus: isComplete ? OnboardingStatus.COMPLETE : OnboardingStatus.PENDING,
      },
    });

    if (isComplete) {
      await prisma.opportunity.update({
        where: { id: stripeAccount.opportunityId },
        data: { status: OpportunityStatus.ONBOARDING_COMPLETE },
      });

      await prisma.auditLog.create({
        data: {
          opportunityId: stripeAccount.opportunityId,
          event: 'ONBOARDING_COMPLETE_WEBHOOK',
          metadata: { stripeAccountId: account.id },
          level: 'info',
        },
      });
    }
  }

  private async onPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const record = await prisma.paymentRecord.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!record) {
      logger.warn(`PaymentRecord not found for paymentIntent ${paymentIntent.id}`);
      return;
    }

    await prisma.paymentRecord.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: PaymentStatus.SUCCEEDED, paidAt: new Date() },
    });

    await prisma.opportunity.update({
      where: { id: record.opportunityId },
      data: { status: OpportunityStatus.PAYMENT_SUCCEEDED },
    });

    // Mark invoice as paid if present
    if (record.invoiceId) {
      await prisma.invoice.update({
        where: { id: record.invoiceId },
        data: { status: 'PAID' },
      });
    }

    await prisma.auditLog.create({
      data: {
        opportunityId: record.opportunityId,
        event: 'PAYMENT_SUCCEEDED',
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount: record.amount,
          paidAt: new Date().toISOString(),
        },
        level: 'info',
      },
    });

    logger.info(`Payment succeeded`, { paymentIntentId: paymentIntent.id, amount: record.amount });
  }

  private async onPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const record = await prisma.paymentRecord.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!record) return;

    const failureMessage =
      paymentIntent.last_payment_error?.message ?? 'Payment failed';

    await prisma.paymentRecord.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: PaymentStatus.FAILED,
        failureMessage,
        retryCount: { increment: 1 },
      },
    });

    await prisma.opportunity.update({
      where: { id: record.opportunityId },
      data: { status: OpportunityStatus.PAYMENT_FAILED },
    });

    await prisma.auditLog.create({
      data: {
        opportunityId: record.opportunityId,
        event: 'PAYMENT_FAILED',
        metadata: { paymentIntentId: paymentIntent.id, failureMessage },
        level: 'error',
      },
    });

    logger.warn(`Payment failed`, { paymentIntentId: paymentIntent.id, failureMessage });
  }
}

export const stripeService = new StripeService();
export { stripe };
