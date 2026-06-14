import { logger } from "./logger";

const RESEND_API = "https://api.resend.com/emails";

interface PaymentNotificationPayload {
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerPhone: string;
  itemName: string;
  amount: number;
  dealCode: string;
  dashboardUrl: string;
}

function paymentEmailHtml(p: PaymentNotificationPayload): string {
  const formattedAmount = `GHS ${p.amount.toFixed(2)}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:24px 32px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">🔒 SETTLE</p>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Secure Escrow Platform</p>
          </td>
        </tr>

        <!-- Alert badge -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:6px 14px;border-radius:999px;letter-spacing:0.3px;">
              ✅ PAYMENT RECEIVED
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0;font-size:16px;color:#0f172a;">Hi <strong>${p.sellerName}</strong>,</p>
            <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
              A buyer has locked funds into escrow for one of your deals. Your money is secure — you just need to fulfil the order.
            </p>
          </td>
        </tr>

        <!-- Deal details -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="6" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#64748b;width:40%;">Item</td>
                      <td style="font-size:14px;color:#0f172a;font-weight:600;">${p.itemName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#64748b;">Buyer</td>
                      <td style="font-size:14px;color:#0f172a;font-weight:600;">${p.buyerName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#64748b;">Phone</td>
                      <td style="font-size:14px;color:#0f172a;font-weight:600;">${p.buyerPhone}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#64748b;">Amount locked</td>
                      <td style="font-size:16px;color:#166534;font-weight:700;">${formattedAmount}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <p style="margin:0 0 16px;font-size:14px;color:#475569;">
              Log in to confirm fulfilment and start the delivery clock.
            </p>
            <a href="${p.dashboardUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
              View Deal &amp; Fulfil Order →
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">
              Funds are held in escrow until your buyer confirms receipt. Deal code: <strong>${p.dealCode}</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You're receiving this because you're a SETTLE seller. © SETTLE Escrow
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function notifySellerPaymentReceived(payload: PaymentNotificationPayload): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const fromEmail = process.env["NOTIFY_FROM_EMAIL"] ?? "SETTLE <notifications@settle.shop>";

  if (!apiKey) {
    logger.info({ sellerEmail: payload.sellerEmail }, "RESEND_API_KEY not set — skipping seller notification email");
    return;
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.sellerEmail],
        subject: `💰 Payment received for "${payload.itemName}" — GHS ${payload.amount.toFixed(2)}`,
        html: paymentEmailHtml(payload),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn({ status: res.status, body, sellerEmail: payload.sellerEmail }, "Resend API returned non-OK status");
    } else {
      logger.info({ sellerEmail: payload.sellerEmail, item: payload.itemName }, "Seller payment notification sent");
    }
  } catch (err) {
    logger.error({ err, sellerEmail: payload.sellerEmail }, "Failed to send seller notification email");
  }
}
