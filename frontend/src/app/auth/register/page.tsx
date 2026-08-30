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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060913] p-4 relative overflow-hidden">
      {/* Water Droplet Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-water-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-water-pulse" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg p-8 sm:p-10 water-pane relative z-10"
      >
        <div className="text-center mb-8">
          {/* Water droplet icon badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-500/20 to-blue-600/10 border border-sky-400/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <UserPlus size={30} className="text-sky-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm">Join the smart attendance portal</p>
        </div>

        {showFaceScan ? (
          <div className="w-full">
            <p className="text-xs text-sky-300/80 text-center mb-4 bg-sky-950/40 border border-sky-500/20 p-3 rounded-xl">
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
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" required
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-[#070B16] border border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input 
                    type="text" required
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-[#070B16] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input 
                    type="email" required
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#070B16] border border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                    placeholder="john@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input 
                    type="password" required
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#070B16] border border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value, inviteToken: ""})}
                  className="w-full bg-[#070B16] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                >
                  <option value="STUDENT" className="bg-[#0A0F1D] text-white">Student</option>
                  <option value="TEACHER" className="bg-[#0A0F1D] text-white">Teacher</option>
                  <option value="ADMIN" className="bg-[#0A0F1D] text-white">Administrator</option>
                </select>
              </div>

              {formData.role === "TEACHER" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <label className="block text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">Admin Invite Token (Required for Teachers)</label>
                  <input 
                    type="text" required
                    value={formData.inviteToken}
                    onChange={e => setFormData({...formData, inviteToken: e.target.value})}
                    className="w-full bg-sky-950/20 border border-sky-500/30 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Enter 32-character token"
                  />
                </motion.div>
              )}

              {formData.role === "STUDENT" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <label className="block text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">University Roll Number</label>
                  <input 
                    type="text" required
                    value={formData.rollNumber}
                    onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full bg-sky-950/20 border border-sky-500/30 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="e.g. CS21B1042"
                  />
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full btn-water disabled:opacity-50 font-semibold py-3 px-4 rounded-xl mt-6 flex items-center justify-center gap-2"
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

            <p className="mt-6 text-center text-slate-400 text-sm">
              Already have an account? <Link href="/auth/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">Log in here</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
