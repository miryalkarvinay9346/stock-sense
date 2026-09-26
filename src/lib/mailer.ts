import nodemailer from "nodemailer";

export function generateOTP(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface SendOtpResult {
  success: boolean;
  messageId?: string;
  previewOtp?: string;
  mode: "smtp" | "dev_fallback";
  error?: string;
}

export async function sendOtpEmail(email: string, otp: string, recipientName?: string): Promise<SendOtpResult> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE || (user && user.includes("@gmail.com") ? "gmail" : undefined);
  const from = process.env.SMTP_FROM || (user ? `"StockSense Security" <${user}>` : `"StockSense Security" <no-reply@stocksense.com>`);
  const secure = process.env.SMTP_SECURE === "true";

  const isConfigured = Boolean(user && pass);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>StockSense - Password Reset OTP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .logo { font-size: 22px; font-weight: 800; color: #7c3aed; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
        .badge { display: inline-block; background-color: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        h1 { font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #0f172a; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
        .otp-box { background: #f5f3ff; border: 2px dashed #a78bfa; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #5b21b6; font-family: monospace; }
        .otp-expiry { font-size: 12px; color: #64748b; margin-top: 6px; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">StockSense</div>
        <div class="badge">Password Reset Request</div>
        <h1>Your One-Time Password (OTP)</h1>
        <p>Hello${recipientName ? ` <strong>${recipientName}</strong>` : ""},</p>
        <p>We received a request to reset your password for your StockSense Inventory account. Enter the 6-digit verification code below to proceed:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">Valid for the next 10 minutes</div>
        </div>

        <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} StockSense IMS &bull; Centralized Real-time Inventory Management
        </div>
      </div>
    </body>
    </html>
  `;

  if (isConfigured) {
    try {
      let transporter;

      if (service === "gmail") {
        console.log(`[SMTP] Connecting via Gmail service for user: ${user}`);
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user,
            pass,
          },
        });
      } else {
        console.log(`[SMTP] Connecting via custom host: ${host}:${port}`);
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from,
        to: email,
        subject: `[StockSense] Password Reset Verification Code: ${otp}`,
        text: `Your StockSense password reset code is: ${otp}. It expires in 10 minutes.`,
        html: htmlContent,
      });

      console.log(`\n✅ [GMAIL SMTP SUCCESS] Dispatched OTP email directly to inbox: ${email}. Message ID: ${info.messageId}\n`);
      return { success: true, messageId: info.messageId, mode: "smtp" };
    } catch (err: any) {
      console.error("\n❌ [SMTP ERROR] Failed to deliver email to Gmail:", err.message);
      console.error("Tip: For Gmail, ensure you are using a 16-character Google App Password (not your normal Gmail login password).\n");
      // Fall through to dev fallback
    }
  }

  // Development Fallback: Log directly to terminal
  console.log("\n=======================================================");
  console.log(`🔑 [AUTH NOTIFICATION] PASSWORD RESET OTP FOR: ${email}`);
  console.log(`👉 VERIFICATION OTP CODE: [ ${otp} ]`);
  console.log(`⏱️ VALIDITY: 10 minutes`);
  if (!isConfigured) {
    console.log(`ℹ️ [GMAIL DELIVERY NOTE]: To send real emails to your Gmail inbox,`);
    console.log(`   set SMTP_USER and SMTP_PASS (16-char App Password) in .env.local`);
  }
  console.log("=======================================================\n");

  return {
    success: true,
    previewOtp: otp,
    mode: "dev_fallback",
  };
}
