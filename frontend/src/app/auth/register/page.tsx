"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import CameraCapture from "../../../components/CameraCapture";
import { getApiUrl } from "../../../lib/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT",
    inviteToken: "",
    rollNumber: ""
  });

  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [registeredRole, setRegisteredRole] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include"
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Registration failed");
      }
      // Auto-transition to Face Scan instead of dashboard
      if (formData.role === "ADMIN") {
        router.push("/admin");
      } else {
        setRegisteredRole(formData.role);
        setShowFaceScan(true);
      }

    } catch (err: any) {
      if (err.message === "Load failed" || err.message?.includes("fetch") || err.message?.includes("NetworkError")) {
        setError("Cannot reach the backend server. Please make sure the backend API is deployed/running and NEXT_PUBLIC_API_URL is configured in your Vercel settings.");
      } else {
        setError(err.message || "Registration failed. Please check your details.");
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg p-8 sm:p-9 mac-window relative z-10"
      >
        {/* Mac Window Header Dots */}
        <div className="flex items-center justify-between pb-5 border-b border-black/[0.06] mb-6">
          <div className="mac-dots">
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Create Account
          </div>
        </div>

        <div className="text-center mb-7">
          <div className="w-13 h-13 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UserPlus size={26} className="text-black" />
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight mb-1">Create Account</h2>
          <p className="text-neutral-500 text-xs">Join the smart attendance portal</p>
        </div>

        {showFaceScan ? (
          <div className="w-full">
            <p className="text-xs text-neutral-600 text-center mb-4 bg-black/[0.03] border border-black/[0.08] p-3 rounded-xl">
              💡 <strong>No Webcam?</strong> You can switch to the <strong>Upload Photo</strong> tab inside the box to upload a picture from your device instead.
            </p>
            <CameraCapture 
              title="Register Your Face (Required)"
              onCapture={async (imageSrc) => {
                setIsLoading(true);
                setError("");
                try {
                  const response = await fetch(imageSrc);
                  const blob = await response.blob();
                  const file = new File([blob], "face_registration.jpg", { type: "image/jpeg" });
                  
                  const fd = new FormData();
                  fd.append("file", file);
              
                  const res = await fetch(getApiUrl("/api/auth/face-register"), {
                    method: "POST",
                    body: fd,
                    credentials: "include" 
                  });
                  
                  if (!res.ok) {
                    throw new Error(await res.text());
                  }
                  
                  alert("Face registered successfully!");
                  
                  // Redirect
                  if (registeredRole === "STUDENT") router.push("/student");
                  else if (registeredRole === "TEACHER") router.push("/teacher");
                  else router.push("/admin");
                  
                } catch (error: any) {
                  setError("Failed to register face: " + error.message);
                } finally {
                  setIsLoading(false);
                }
              }}
              onCancel={() => {
                // If they cancel, still let them into dashboard, but they will be prompted there
                if (registeredRole === "STUDENT") router.push("/student");
                else if (registeredRole === "TEACHER") router.push("/teacher");
                else router.push("/admin");
              }}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                    <input 
                      type="text" required
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-9 pr-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input 
                    type="text" required
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                  <input 
                    type="email" required
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-9 pr-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                  <input 
                    type="password" required
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-9 pr-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-neutral-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value, inviteToken: ""})}
                  className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all cursor-pointer"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {formData.role === "TEACHER" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">Admin Invite Token (Required for Teachers)</label>
                  <input 
                    type="text" required
                    value={formData.inviteToken}
                    onChange={e => setFormData({...formData, inviteToken: e.target.value})}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    placeholder="Enter 32-character token"
                  />
                </motion.div>
              )}

              {formData.role === "STUDENT" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">University Roll Number</label>
                  <input 
                    type="text" required
                    value={formData.rollNumber}
                    onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    placeholder="e.g. CS21B1042"
                  />
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full btn-high-black disabled:opacity-50 font-bold py-3 px-4 rounded-xl mt-4 flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : formData.role === "ADMIN" ? (
                  "Register Admin Account"
                ) : (
                  "Continue to Face Scan"
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-neutral-500 text-xs">
              Already have an account? <Link href="/auth/login" className="text-black font-bold hover:underline transition-colors">Log in here</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
