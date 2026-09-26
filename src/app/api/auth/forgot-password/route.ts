import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, createUser, saveResetOTP } from "@/lib/db";
import { generateOTP, sendOtpEmail } from "@/lib/mailer";
import { createClient } from "@supabase/supabase-js";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    let user = findUserByEmail(normalizedEmail);

    if (!user) {
      user = createUser({
        name: normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " "),
        email: normalizedEmail,
        role: "INVENTORY_MANAGER",
        passwordHash: "pending_otp_verification",
      });
    }

    // 1. If Supabase is configured in environment, dispatch email via Supabase Auth!
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (sbUrl && sbKey && sbUrl.startsWith("https://") && sbKey.length > 20) {
      try {
        const supabase = createClient(sbUrl, sbKey);
        const { error: sbError } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

        if (sbError) {
          console.warn("[Supabase Server Reset Warning]:", sbError.message);
          // If rate limit or other error, let client know
          if (sbError.status === 429) {
            return NextResponse.json({
              success: true,
              message: "An email was already dispatched recently to your Gmail! Please check your inbox (and Spam folder) or wait 1 minute before resending.",
              mode: "supabase",
            });
          }
        } else {
          console.log(`[Supabase Auth Success] Dispatched recovery email directly to ${normalizedEmail}`);
          return NextResponse.json({
            success: true,
            message: `Supabase Auth has dispatched the password recovery email directly to your Gmail inbox at ${normalizedEmail}. Please check your inbox and spam folder!`,
            mode: "supabase",
          });
        }
      } catch (sbEx: any) {
        console.error("Supabase server dispatch error:", sbEx.message);
      }
    }

    // 2. Fallback to local mailer / SMTP
    const otp = generateOTP();
    saveResetOTP(user.email, otp, 10);

    const emailResult = await sendOtpEmail(user.email, otp, user.name);

    if (emailResult.mode === "smtp") {
      return NextResponse.json({
        success: true,
        message: `An OTP verification code was sent directly to your inbox at ${user.email}. Check your email!`,
        mode: "smtp",
      });
    }

    return NextResponse.json({
      success: true,
      message: `OTP generated for ${user.email}.`,
      mode: "dev_fallback",
      previewOtp: emailResult.previewOtp,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to generate or send OTP. Please try again." },
      { status: 500 }
    );
  }
}
