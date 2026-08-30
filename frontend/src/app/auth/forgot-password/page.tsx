"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { getApiUrl } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"EMAIL" | "OTP_PASSWORD" | "SUCCESS">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Send OTP for password reset
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "PASSWORD_RESET" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset code");
      }
      setStep("OTP_PASSWORD");
      setResendCooldown(60);
    } catch (err: any) {
      if (err.message === "Load failed" || err.message?.includes("fetch")) {
        setError("Cannot reach backend server. Please verify backend deployment.");
      } else {
        setError(err.message || "Unable to find an account with this email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset password using OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-4 relative overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-sky-100/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-slate-100/60 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-8 mac-window relative z-10"
      >
        {/* Mac Window Header Dots */}
        <div className="flex items-center justify-between pb-5 border-b border-black/[0.06] mb-6">
          <div className="mac-dots">
            <span className="mac-dot mac-dot-close" onClick={() => router.push("/auth/login")} />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Account Recovery
          </div>
        </div>

        {step === "EMAIL" && (
          <>
            <div className="text-center mb-7">
              <div className="w-13 h-13 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <KeyRound size={26} className="text-black" />
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">Reset Password</h2>
              <p className="text-neutral-500 text-xs">Enter your email to receive a 6-digit recovery code</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-neutral-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-high-black disabled:opacity-50 font-bold py-3 px-4 rounded-xl mt-2 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-semibold transition">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        )}

        {step === "OTP_PASSWORD" && (
          <>
            <div className="text-center mb-6">
              <div className="w-13 h-13 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Mail size={24} className="text-black" />
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">Enter OTP Code</h2>
              <p className="text-xs text-neutral-500">
                Code sent to <span className="font-semibold text-black">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-center text-neutral-700 uppercase tracking-wider mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center text-3xl font-mono tracking-[10px] py-3 bg-black/[0.03] border border-black/10 rounded-2xl text-black focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-neutral-400" size={16} />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-neutral-400" size={16} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-high-black disabled:opacity-50 font-bold py-3 px-4 rounded-xl mt-2 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "Resetting Password..." : "Set New Password"}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-4">
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="text-neutral-500 hover:text-black transition"
              >
                Change email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleSendOtp}
                className="text-black font-semibold hover:underline disabled:text-neutral-400 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </>
        )}

        {step === "SUCCESS" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-xl font-bold text-black tracking-tight mb-2">Password Reset Complete</h3>
            <p className="text-xs text-neutral-500 mb-6">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full btn-high-black font-bold py-3 px-4 rounded-xl text-sm"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
