import { sendEmail } from "./email";
import { DEFAULT_OPERATOR_ORDER_EMAIL, internalOrderNotificationEmails } from "./internal-order-notify";

function internalAlertRecipients(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const market of ["RO", "HU", "EU"] as const) {
    for (const email of internalOrderNotificationEmails(market)) {
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(email);
    }
  }
  if (out.length === 0) {
    out.push(DEFAULT_OPERATOR_ORDER_EMAIL);
  }
  return out;
}

export async function notifyInternalCardOrderIssue(subject: string, details: string) {
  const recipients = internalAlertRecipients();
  if (recipients.length === 0) return;
  const text = details.trim();
  const html = `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</pre>`;
  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `[Sensorsale CARD] ${subject}`,
        text,
        html,
      }).catch(() => undefined)
    )
  );
}
