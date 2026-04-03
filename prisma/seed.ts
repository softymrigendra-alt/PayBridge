import { PrismaClient, OpportunityStatus, InvoiceStatus, OnboardingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@arservice.com' },
    update: {},
    create: {
      email: 'admin@arservice.com',
      passwordHash,
      name: 'Admin User',
      role: 'admin',
    },
  });

  // Opportunity 1: Full pipeline complete
  const opp1 = await prisma.opportunity.upsert({
    where: { salesforceId: 'sf_opp_001' },
    update: {},
    create: {
      salesforceId: 'sf_opp_001',
      name: 'TechCorp Annual License Q1',
      accountName: 'TechCorp Inc.',
      accountId: 'sf_acc_001',
      hostEmail: 'billing@techcorp.com',
      amount: 48000,
      stage: 'Closed Won',
      closeDate: new Date('2024-01-15'),
      status: OpportunityStatus.PAYMENT_SUCCEEDED,
    },
  });

  await prisma.invoice.upsert({
    where: { netsuiteId: 'ns_inv_001' },
    update: {},
    create: {
      netsuiteId: 'ns_inv_001',
      opportunityId: opp1.id,
      dueDate: new Date('2024-02-15'),
      totalAmount: 48000,
      status: InvoiceStatus.PAID,
      lineItems: [
        { description: 'Enterprise License - Annual', quantity: 1, unitPrice: 40000, amount: 40000 },
        { description: 'Priority Support Package', quantity: 1, unitPrice: 8000, amount: 8000 },
      ],
    },
  });

  await prisma.stripeAccount.upsert({
    where: { stripeAccountId: 'acct_test_techcorp_001' },
    update: {},
    create: {
      opportunityId: opp1.id,
      stripeAccountId: 'acct_test_techcorp_001',
      onboardingStatus: OnboardingStatus.COMPLETE,
      detailsSubmitted: true,
      chargesEnabled: true,
    },
  });

  await prisma.paymentRecord.upsert({
    where: { stripePaymentIntentId: 'pi_test_techcorp_001' },
    update: {},
    create: {
      opportunityId: opp1.id,
      stripePaymentIntentId: 'pi_test_techcorp_001',
      amount: 48000,
      currency: 'usd',
      status: 'SUCCEEDED',
      paidAt: new Date('2024-01-20'),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      { opportunityId: opp1.id, event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info' },
      { opportunityId: opp1.id, event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_001' }, level: 'info' },
      { opportunityId: opp1.id, event: 'HOST_INVITED', metadata: { email: 'billing@techcorp.com' }, level: 'info' },
      { opportunityId: opp1.id, event: 'ONBOARDING_COMPLETE', metadata: { stripeAccountId: 'acct_test_techcorp_001' }, level: 'info' },
      { opportunityId: opp1.id, event: 'PAYMENT_SUCCEEDED', metadata: { amount: 48000, paymentIntentId: 'pi_test_techcorp_001' }, level: 'info' },
    ],
  });

  // Opportunity 2: Onboarding in progress
  const opp2 = await prisma.opportunity.upsert({
    where: { salesforceId: 'sf_opp_002' },
    update: {},
    create: {
      salesforceId: 'sf_opp_002',
      name: 'StartupXYZ Platform Deal',
      accountName: 'StartupXYZ LLC',
      accountId: 'sf_acc_002',
      hostEmail: 'finance@startupxyz.io',
      amount: 15000,
      stage: 'Closed Won',
      closeDate: new Date('2024-01-22'),
      status: OpportunityStatus.INVITE_SENT,
    },
  });

  await prisma.invoice.upsert({
    where: { netsuiteId: 'ns_inv_002' },
    update: {},
    create: {
      netsuiteId: 'ns_inv_002',
      opportunityId: opp2.id,
      dueDate: new Date('2024-02-28'),
      totalAmount: 15000,
      status: InvoiceStatus.OPEN,
      lineItems: [
        { description: 'Platform Access - 12 months', quantity: 1, unitPrice: 12000, amount: 12000 },
        { description: 'Onboarding & Setup', quantity: 1, unitPrice: 3000, amount: 3000 },
      ],
    },
  });

  await prisma.stripeAccount.upsert({
    where: { stripeAccountId: 'acct_test_startup_002' },
    update: {},
    create: {
      opportunityId: opp2.id,
      stripeAccountId: 'acct_test_startup_002',
      onboardingStatus: OnboardingStatus.PENDING,
      onboardingUrl: 'https://connect.stripe.com/express/onboarding/test_link',
      detailsSubmitted: false,
      chargesEnabled: false,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      { opportunityId: opp2.id, event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info' },
      { opportunityId: opp2.id, event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_002' }, level: 'info' },
      { opportunityId: opp2.id, event: 'HOST_INVITED', metadata: { email: 'finance@startupxyz.io' }, level: 'info' },
    ],
  });

  // Opportunity 3: Just synced, awaiting invoice
  const opp3 = await prisma.opportunity.upsert({
    where: { salesforceId: 'sf_opp_003' },
    update: {},
    create: {
      salesforceId: 'sf_opp_003',
      name: 'MegaRetail Holiday Campaign',
      accountName: 'MegaRetail Corp',
      accountId: 'sf_acc_003',
      hostEmail: 'ar@megaretail.com',
      amount: 125000,
      stage: 'Closed Won',
      closeDate: new Date('2024-01-28'),
      status: OpportunityStatus.PENDING,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      { opportunityId: opp3.id, event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info' },
    ],
  });

  console.log('✅ Seed complete');
  console.log(`   Created opportunities: ${opp1.id}, ${opp2.id}, ${opp3.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
