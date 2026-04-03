export function paymentFailureTemplate(data: {
  accountName: string;
  hostEmail: string;
  opportunityName: string;
  amount: number;
  failureReason: string;
  retryCount: number;
  maxRetries: number;
}): { subject: string; html: string; text: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.amount);

  const willRetry = data.retryCount < data.maxRetries;
  const subject = `Payment Failed: ${formattedAmount} for ${data.opportunityName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .icon { font-size: 48px; margin-bottom: 12px; display: block; }
    .body { padding: 32px; }
    .amount { font-size: 32px; color: #111827; font-weight: 700; text-align: center; margin: 20px 0 4px; }
    .status-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .info-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 13px; }
    .info-value { color: #111827; font-size: 13px; font-weight: 600; }
    .retry-notice { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .retry-notice p { color: #92400e; font-size: 14px; margin: 0; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="icon">⚠</span>
      <h1>Payment Failed</h1>
    </div>
    <div class="body">
      <div style="text-align:center;margin-bottom:24px;">
        <div class="amount">${formattedAmount}</div>
        <span class="status-badge">Payment Unsuccessful</span>
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
          <span class="info-label">Failure Reason</span>
          <span class="info-value">${data.failureReason}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Attempt</span>
          <span class="info-value">${data.retryCount} of ${data.maxRetries}</span>
        </div>
      </div>

      ${
        willRetry
          ? `<div class="retry-notice">
              <p>⏱ We will automatically retry this payment. No action needed.</p>
             </div>`
          : `<p style="color:#374151;font-size:14px;text-align:center;">
              All retry attempts exhausted. Please contact your account manager to resolve this.
             </p>`
      }
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or contact your account manager.</p>
      <p>© ${new Date().getFullYear()} PayBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Failed: ${formattedAmount}

Account: ${data.accountName}
Opportunity: ${data.opportunityName}
Reason: ${data.failureReason}
Attempt: ${data.retryCount} of ${data.maxRetries}

${willRetry ? 'We will automatically retry this payment.' : 'All retry attempts exhausted. Please contact your account manager.'}
  `.trim();

  return { subject, html, text };
}
