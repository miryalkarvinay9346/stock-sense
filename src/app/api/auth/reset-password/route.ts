import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, updateUserPassword, verifyAndConsumeOTP } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const verification = verifyAndConsumeOTP(email, otp);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    const updated = updateUserPassword(email, newPasswordHash);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting the password." },
      { status: 500 }
    );
  }
}
