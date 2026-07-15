import nodemailer from "nodemailer";

// EU (kupitsensor.eu) mail is hosted separately from the shared RO/HU SMTP
// account, so sending "From: info@kupitsensor.eu" through that account would
// fail sender-domain checks. Pick the transporter by which domain the `from`
// address belongs to instead of threading a market param through every
// sendEmail() call site.
function getTransporter(fromAddress: string) {
  const isEu = fromAddress.toLowerCase().includes("@kupitsensor.eu");

  const host = (isEu && process.env.SMTP_HOST_EU?.trim()) || process.env.SMTP_HOST?.trim();
  const port = Number((isEu && process.env.SMTP_PORT_EU?.trim()) || process.env.SMTP_PORT || 587);
  const user = (isEu && process.env.SMTP_USER_EU?.trim()) || process.env.SMTP_USER?.trim();
  const pass = (isEu && process.env.SMTP_PASS_EU?.trim()) || process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return { transporter: null as nodemailer.Transporter | null, isEu, host: !!host, user: !!user, pass: !!pass };
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    isEu,
    host: true,
    user: true,
    pass: true,
  };
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
  const { transporter, isEu, host, user, pass } = getTransporter(from);
  if (!transporter) {
    console.error("[sendEmail] smtp_not_configured", {
      to: params.to,
      from,
      isEu,
      hasHost: host,
      hasUser: user,
      hasPass: pass,
      subject: params.subject,
    });
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[sendEmail] send_failed", {
      to: params.to,
      from,
      isEu,
      subject: params.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false, reason: "send_failed" as const };
  }
}
