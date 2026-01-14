import nodemailer from "nodemailer";

/**
 * Dev-friendly behavior:
 * - If SMTP env vars are not set, we DON'T fail.
 * - We print the verify URL in the server console.
 */
export async function sendVerifyEmail(email: string, verifyUrl: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || "Meta SaaS <no-reply@localhost>";
  const port = Number(process.env.SMTP_PORT || "587");

  if (!host || !user || !pass) {
    console.log("\n[DEV EMAIL MODE] SMTP not configured.");
    console.log(`[DEV EMAIL MODE] Verification link for ${email}: ${verifyUrl}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "Confirme ton email pour continuer",
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.4">
        <h2>Confirme ton email</h2>
        <p>Clique sur le bouton ci-dessous pour débloquer l'accès et continuer.</p>
        <p style="margin: 24px 0">
          <a href="${verifyUrl}" style="background:#111;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;display:inline-block">
            Confirmer mon email
          </a>
        </p>
        <p style="color:#666;font-size:12px">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
      </div>
    `,
  });
}
