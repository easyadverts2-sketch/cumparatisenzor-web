import nodemailer from "nodemailer";

// EU (kupitsensor.eu) mail is hosted separately from the shared RO/HU SMTP
// account, so sending "From: info@kupitsensor.eu" through that account would
// fail sender-domain checks. Pick the transporter by which domain the `from`
// address belongs to instead of threading a market param through every
// sendEmail() call site.
function getTransporter(fromAddress: string) {
  const isEu = fromAddress.toLowerCase().includes("@kupitsensor.eu");

  const host = (isEu && process.env.SMTP_HOST_EU) || process.env.SMTP_HOST;
  const port = Number((isEu && process.env.SMTP_PORT_EU) || process.env.SMTP_PORT || 587);
  const user = (isEu && process.env.SMTP_USER_EU) || process.env.SMTP_USER;
  const pass = (isEu && process.env.SMTP_PASS_EU) || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  from?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  const from = params.from || process.env.SMTP_FROM || "no-reply@cumparatisenzor.ro";
  const transporter = getTransporter(from);
  if (!transporter) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    attachments: params.attachments,
  });

  return { sent: true as const };
}
