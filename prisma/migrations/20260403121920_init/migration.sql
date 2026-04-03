-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('PENDING', 'INVOICE_FETCHED', 'INVITE_SENT', 'ONBOARDING_COMPLETE', 'PAYMENT_PENDING', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'ERROR');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'COMPLETE', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "salesforceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountId" TEXT,
    "hostEmail" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stage" TEXT NOT NULL,
    "closeDate" TIMESTAMP(3),
    "status" "OpportunityStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "netsuiteId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "lineItems" JSONB NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeAccount" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboardingUrl" TEXT,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT_METHOD',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "level" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_salesforceId_key" ON "Opportunity"("salesforceId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_salesforceId_idx" ON "Opportunity"("salesforceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_netsuiteId_key" ON "Invoice"("netsuiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_opportunityId_key" ON "Invoice"("opportunityId");

-- CreateIndex
CREATE INDEX "Invoice_netsuiteId_idx" ON "Invoice"("netsuiteId");

-- CreateIndex
CREATE INDEX "Invoice_opportunityId_idx" ON "Invoice"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeAccount_opportunityId_key" ON "StripeAccount"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeAccount_stripeAccountId_key" ON "StripeAccount"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeAccount_stripeAccountId_idx" ON "StripeAccount"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeAccount_opportunityId_idx" ON "StripeAccount"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripePaymentIntentId_key" ON "PaymentRecord"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "PaymentRecord_opportunityId_idx" ON "PaymentRecord"("opportunityId");

-- CreateIndex
CREATE INDEX "PaymentRecord_stripePaymentIntentId_idx" ON "PaymentRecord"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "AuditLog_opportunityId_idx" ON "AuditLog"("opportunityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeAccount" ADD CONSTRAINT "StripeAccount_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
