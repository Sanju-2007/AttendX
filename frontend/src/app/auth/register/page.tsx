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
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-8 glass-dark rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/50">
            <UserPlus size={32} className="text-secondary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join the smart attendance system</p>
        </div>

        {showFaceScan ? (
          <div className="w-full">
            <p className="text-xs text-gray-400 text-center mb-4 bg-white/5 border border-white/5 p-3 rounded-xl">
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
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" required
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-secondary"
                  placeholder="John"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
              <input 
                  type="text" required
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:ring-2 focus:ring-secondary"
                  placeholder="Doe"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="email" required
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-secondary"
                placeholder="john@university.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="password" required
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-secondary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <select 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value, inviteToken: ""})}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:ring-2 focus:ring-secondary appearance-none"
            >
              <option value="STUDENT" className="text-black">Student</option>
              <option value="TEACHER" className="text-black">Teacher</option>
              <option value="ADMIN" className="text-black">Administrator</option>
            </select>
          </div>

          {formData.role === "TEACHER" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <label className="block text-sm font-medium text-pink-400 mb-1">Admin Invite Token (Required for Teachers)</label>
              <input 
                type="text" required
                value={formData.inviteToken}
                onChange={e => setFormData({...formData, inviteToken: e.target.value})}
                className="w-full bg-pink-500/10 border border-pink-500/30 rounded-lg py-2.5 px-4 text-white text-sm focus:ring-2 focus:ring-pink-500"
                placeholder="Enter 32-character token"
              />
            </motion.div>
          )}

          {formData.role === "STUDENT" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <label className="block text-sm font-medium text-emerald-400 mb-1">University Roll Number</label>
              <input 
                type="text" required
                value={formData.rollNumber}
                onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-2.5 px-4 text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. CS21B1042"
              />
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-secondary hover:bg-violet-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6"
          >
            {isLoading ? "Creating Account..." : formData.role === "ADMIN" ? "Register Admin Account" : "Continue to Face Scan"}
          </button>
        </form>

            <p className="mt-6 text-center text-gray-400 text-sm">
              Already have an account? <Link href="/auth/login" className="text-secondary hover:text-purple-400 font-medium">Log in here</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
