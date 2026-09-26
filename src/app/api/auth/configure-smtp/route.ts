import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env.local");

export async function GET() {
  const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  return NextResponse.json({
    configured: isConfigured,
    senderEmail: process.env.SMTP_USER || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, appPassword } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid sender email address." },
        { status: 400 }
      );
    }

    if (!appPassword || appPassword.trim().length < 8) {
      return NextResponse.json(
        { error: "Please enter your 16-character Google App Password." },
        { status: 400 }
      );
    }

    const cleanPass = appPassword.replace(/\s+/g, "");

    // Verify SMTP connection
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email.trim(),
        pass: cleanPass,
      },
    });

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      console.error("[SMTP Verify Failed]:", verifyErr.message);
      return NextResponse.json(
        {
          error: `Gmail Authentication Failed: ${verifyErr.message}. Make sure you generate a 16-character App Password at myaccount.google.com/apppasswords`,
        },
        { status: 401 }
      );
    }

    // Update in-memory environment variables
    process.env.SMTP_SERVICE = "gmail";
    process.env.SMTP_USER = email.trim();
    process.env.SMTP_PASS = cleanPass;
    process.env.SMTP_FROM = `"StockSense Security" <${email.trim()}>`;

    // Persist to .env.local
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";

    const updates: Record<string, string> = {
      SMTP_SERVICE: "gmail",
      SMTP_USER: email.trim(),
      SMTP_PASS: cleanPass,
      SMTP_FROM: `"StockSense Security" <${email.trim()}>`,
    };

    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(ENV_PATH, envContent.trim() + "\n", "utf8");

    return NextResponse.json({
      success: true,
      message: `Gmail SMTP connected successfully with ${email.trim()}! Real OTP emails will now be sent directly to recipient inboxes.`,
      senderEmail: email.trim(),
    });
  } catch (error: any) {
    console.error("Configure SMTP error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to configure SMTP." },
      { status: 500 }
    );
  }
}
