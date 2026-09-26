"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { sendSupabaseResetOtp, verifySupabaseOtpAndSetPassword } from "@/lib/supabaseAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: "REQUEST_OTP" | Step 2: "RESET_PASSWORD"
  const [step, setStep] = useState<"REQUEST_OTP" | "RESET_PASSWORD">("REQUEST_OTP");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSupabaseMode, setIsSupabaseMode] = useState(false);
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);

  // Supabase Configuration State
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [configuring, setConfiguring] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    fetch("/api/auth/configure-supabase")
      .then((res) => res.json())
      .then((data) => {
        setSupabaseConfigured(Boolean(data.configured));
        setSupabaseUrl(data.url || null);
        if (!data.configured) {
          setShowConfigDrawer(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfiguring(true);
    setConfigError(null);
    setConfigSuccess(null);

    try {
      const res = await fetch("/api/auth/configure-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl: inputUrl,
          supabaseAnonKey: inputKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect to Supabase");
      }

      setSupabaseConfigured(true);
      setSupabaseUrl(data.url);
      setConfigSuccess("Connected to Supabase! Real OTP emails will now be sent directly to your Gmail inbox.");
      setShowConfigDrawer(false);
      // Reload page to re-initialize client
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setConfigError(err.message || "Failed to configure Supabase.");
    } finally {
      setConfiguring(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDevOtpPreview(null);
    setLoading(true);

    try {
      const result = await sendSupabaseResetOtp(email);
      setSuccessMsg(result.message);
      setIsSupabaseMode(result.mode === "supabase");
      setStep("RESET_PASSWORD");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    try {
      const result = await sendSupabaseResetOtp(email);
      setSuccessMsg(result.message);
      setIsSupabaseMode(result.mode === "supabase");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length < 6) {
      setError("Please enter the complete 6-digit OTP verification code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-check.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = await verifySupabaseOtpAndSetPassword(email, otp.trim(), newPassword);
      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Stock<span className="text-brand-600">Sense</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Third-Party Authentication &bull; Supabase Email OTP Recovery
          </p>
        </div>

        {/* Third-Party Auth Service Integration Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Auth Service:</span>
              {supabaseConfigured ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Supabase Auth Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                  <AlertCircle className="w-3 h-3" /> Connect Supabase Project
                </span>
              )}
            </div>
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="text-brand-600 hover:text-brand-800 font-semibold cursor-pointer"
            >
              {showConfigDrawer ? "Hide" : supabaseConfigured ? "View Keys" : "Connect Now"}
            </button>
          </div>

          {/* Collapsible Supabase Setup Drawer */}
          {showConfigDrawer && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-slate-500 mb-2 leading-relaxed">
                Supabase sends real 6-digit email OTPs to your Gmail inbox out of the box with zero SMTP setup. You can get free keys in 30 seconds from your{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" />
                </a>{" "}
                (Project Settings &rarr; API):
              </p>

              {configError && (
                <div className="p-2 mb-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  {configError}
                </div>
              )}
              {configSuccess && (
                <div className="p-2 mb-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold">
                  {configSuccess}
                </div>
              )}

              <form onSubmit={handleSaveSupabase} className="space-y-2 mt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={configuring}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {configuring ? "Verifying Keys..." : "Activate Supabase Auth"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Main Form Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          {step === "REQUEST_OTP" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Password Reset via OTP</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your email address to receive your 6-digit OTP code directly in your inbox.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 font-medium">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleRequestOtp}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Your Email Address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send 6-Digit OTP to Email
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Step 2: Verify OTP & Change Password */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST_OTP");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-3 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email address
                </button>
                <h2 className="text-xl font-bold text-slate-800">Enter OTP &amp; Reset Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  6-digit verification code sent to <strong className="text-slate-800">{email}</strong>
                </p>
              </div>

              {successMsg && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 font-medium">{successMsg}</div>
                </div>
              )}

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 font-medium">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleResetPassword}>
                {/* 6-Digit OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      disabled={cooldown > 0 || resending}
                      onClick={handleResendOtp}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base tracking-[0.3em] font-mono text-center placeholder-slate-300 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Verify OTP &amp; Save Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Back to sign in */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
