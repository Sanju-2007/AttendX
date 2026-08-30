"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { getApiUrl } from "../../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      // Success - Redirect based on User Role
      const role = data.role;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "TEACHER") {
        router.push("/teacher");
      } else if (role === "STUDENT") {
        router.push("/student");
      } else {
        throw new Error("Unauthorized user role classification");
      }
    } catch (err: any) {
      if (err.message === "Load failed" || err.message?.includes("fetch") || err.message?.includes("NetworkError")) {
        setError("Cannot reach the backend server. Please make sure the backend API is running and NEXT_PUBLIC_API_URL is configured in your Vercel settings.");
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-4 relative overflow-hidden">
      {/* Subtle macOS Liquid Ambient Light */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-sky-100/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-slate-100/60 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-8 sm:p-9 mac-window relative z-10"
      >
        {/* Mac Window Header Dots */}
        <div className="flex items-center justify-between pb-5 border-b border-black/[0.06] mb-6">
          <div className="mac-dots">
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Attendify Portal
          </div>
        </div>

        <div className="text-center mb-7">
          <div className="w-13 h-13 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <LogIn size={26} className="text-black" />
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight mb-1">Welcome Back</h2>
          <p className="text-neutral-500 text-xs">Sign in to your Attendify account</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-600 text-xs"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                placeholder="name@university.edu"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-neutral-500 hover:text-black font-semibold transition">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-high-black disabled:opacity-50 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-neutral-500 text-xs">
          Don't have an account? <Link href="/auth/register" className="text-black font-bold hover:underline transition-colors">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
