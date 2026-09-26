import { supabase, isSupabaseConfigured } from "./supabaseClient";

export async function sendSupabaseResetOtp(email: string): Promise<{ success: boolean; message: string; mode: "supabase" | "fallback" }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      throw new Error(`Supabase Auth Error: ${error.message}`);
    }
    return {
      success: true,
      message: `Supabase has sent a 6-digit OTP verification code directly to your email (${email.trim()}). Please check your Gmail inbox and spam folder!`,
      mode: "supabase",
    };
  }

  // Fallback to local API
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to send reset OTP.");
  }

  return {
    success: true,
    message: data.message,
    mode: "fallback",
  };
}

export async function verifySupabaseOtpAndSetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    // 1. Verify 6-digit OTP with Supabase
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "recovery",
    });

    if (verifyError) {
      throw new Error(`Invalid or expired Supabase OTP code: ${verifyError.message}`);
    }

    // 2. Update password in Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(`Failed to update password in Supabase: ${updateError.message}`);
    }

    // Also sync with local API
    await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp,
        newPassword,
        confirmPassword: newPassword,
      }),
    }).catch(() => {});

    return {
      success: true,
      message: "Password successfully updated in Supabase! You can now log in.",
    };
  }

  // Fallback to local API
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      otp,
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to reset password.");
  }

  return {
    success: true,
    message: data.message || "Password updated successfully!",
  };
}
