export function onboardingInviteTemplate(data: {
  accountName: string;
  hostEmail: string;
  onboardingUrl: string;
  invoiceAmount: number;
  dueDate: string;
  opportunityName: string;
}): { subject: string; html: string; text: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.invoiceAmount);

  const subject = `Action Required: Complete Payment Setup for ${data.opportunityName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 13px; }
    .info-value { color: #111827; font-size: 13px; font-weight: 600; }
    .amount { font-size: 28px; color: #111827; font-weight: 700; text-align: center; margin: 24px 0 8px; }
    .due-date { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    .cta { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #635bff; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.01em; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 12px; margin-bottom: 16px; }
    .step-num { width: 28px; height: 28px; background: #635bff; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; line-height: 28px; text-align: center; }
    .step-text { color: #374151; font-size: 14px; padding-top: 4px; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
    .footer a { color: #635bff; text-decoration: none; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Setup Required</h1>
      <p>Secure payment processing via Stripe</p>
    </div>
    <div class="body">
      <p class="greeting">Hello,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        We're ready to process your payment for <strong>${data.opportunityName}</strong>.
        To receive funds, you'll need to complete a quick one-time account setup with our
        payment partner, Stripe.
      </p>

      <div class="amount">${formattedAmount}</div>
      <p class="due-date">Due by ${data.dueDate}</p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Account</span>
          <span class="info-value">${data.accountName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Opportunity</span>
          <span class="info-value">${data.opportunityName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Recipient Email</span>
          <span class="info-value">${data.hostEmail}</span>
        </div>
      </div>

      <div class="divider"></div>
      <p style="color:#374151;font-size:14px;font-weight:600;margin-bottom:12px;">Complete setup in 3 easy steps:</p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">Click the button below to open Stripe's secure onboarding portal.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">Provide your business information and bank account details.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">Once verified, your payment will be processed automatically.</div>
        </div>
      </div>

      <div class="cta">
        <a href="${data.onboardingUrl}" class="btn">Complete Payment Setup →</a>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        This link expires in 24 hours. If it has expired, contact us for a new link.
      </p>
    </div>
    <div class="footer">
      <p>This email was sent to <a href="mailto:${data.hostEmail}">${data.hostEmail}</a></p>
      <p>© ${new Date().getFullYear()} PayBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Setup Required for ${data.opportunityName}

Amount Due: ${formattedAmount}
Due Date: ${data.dueDate}
Account: ${data.accountName}

Please complete your Stripe onboarding to receive payment:
${data.onboardingUrl}

This link expires in 24 hours.
  `.trim();

  return { subject, html, text };
}
