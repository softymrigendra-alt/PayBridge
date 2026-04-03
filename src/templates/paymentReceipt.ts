export function paymentReceiptTemplate(data: {
  accountName: string;
  hostEmail: string;
  opportunityName: string;
  amount: number;
  paymentIntentId: string;
  paidAt: Date;
}): { subject: string; html: string; text: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.amount);

  const formattedDate = data.paidAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Payment Confirmed: ${formattedAmount} received for ${data.opportunityName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .checkmark { font-size: 48px; margin-bottom: 12px; display: block; }
    .body { padding: 32px; }
    .amount { font-size: 36px; color: #111827; font-weight: 700; text-align: center; margin: 20px 0 4px; }
    .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 13px; }
    .info-value { color: #111827; font-size: 13px; font-weight: 600; }
    .ref { color: #9ca3af; font-size: 11px; font-family: monospace; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="checkmark">✓</span>
      <h1>Payment Confirmed</h1>
    </div>
    <div class="body">
      <div style="text-align:center;margin-bottom:24px;">
        <div class="amount">${formattedAmount}</div>
        <span class="status-badge">Successfully Received</span>
      </div>

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
          <span class="info-label">Payment Date</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Reference</span>
          <span class="info-value ref">${data.paymentIntentId}</span>
        </div>
      </div>

      <p style="color:#374151;font-size:14px;text-align:center;margin-top:24px;">
        Thank you for completing your payment. Your funds will be deposited within 2–3 business days.
      </p>
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or contact your account manager.</p>
      <p>© ${new Date().getFullYear()} AR Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Confirmed: ${formattedAmount}

Account: ${data.accountName}
Opportunity: ${data.opportunityName}
Date: ${formattedDate}
Reference: ${data.paymentIntentId}

Thank you for your payment.
  `.trim();

  return { subject, html, text };
}
