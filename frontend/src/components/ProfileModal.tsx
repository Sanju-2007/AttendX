"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, X, Edit2, ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../lib/api";
import CameraCapture from "./CameraCapture";

interface ProfileModalProps {
  onProfileUpdate?: () => void;
}

export default function ProfileModal({ onProfileUpdate }: ProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const router = useRouter();

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl("/api/auth/me"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setError("");
      setSuccess("");
      setIsEditing(false);
      setPassword("");
    }
  }, [isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          ...(password ? { password } : {})
        }),
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setPassword("");
      setUserData((prev: any) => ({
        ...prev,
        firstName,
        lastName,
        email
      }));
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFaceCapture = async (imageSrc: string) => {
    setUpdating(true);
    setError("");
    setSuccess("");
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
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to register face");
      }
      
      setSuccess("Face photo updated successfully!");
      setShowCamera(false);
      await fetchProfile();
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError("Failed to update face: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(getApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setIsOpen(false);
        router.push("/auth/login");
      } else {
        alert("Failed to logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getInitials = () => {
    if (!userData) return "?";
    return `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`.toUpperCase() || userData.email?.[0]?.toUpperCase() || "?";
  };

  return (
    <>
      {/* Trigger Button - Header Avatar */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-2xl bg-black hover:bg-neutral-900 flex items-center justify-center font-bold text-white shadow-sm hover:scale-105 transition-transform overflow-hidden"
      >
        {userData?.profilePic ? (
          <img src={userData.profilePic} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs">{getInitials()}</span>
        )}
      </button>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mac-window p-7 rounded-3xl relative overflow-hidden text-black"
            >
              {/* Header with dots */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
                <div className="mac-dots">
                  <span className="mac-dot mac-dot-close" onClick={() => setIsOpen(false)} />
                  <span className="mac-dot mac-dot-min" />
                  <span className="mac-dot mac-dot-max" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">User Account</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-black transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Avatar + Name */}
              <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-black/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center font-bold text-xl text-white mb-3 shadow-sm">
                  {getInitials()}
                </div>
                <h3 className="text-lg font-bold text-black">{userData?.firstName} {userData?.lastName}</h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{userData?.email}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border mt-2.5 bg-black/[0.04] text-black border-black/10">
                  {userData?.role}
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs">
                  {success}
                </div>
              )}

              {/* Form or Info */}
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">First Name</label>
                      <input 
                        type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full glass-input py-2 px-3 text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">Last Name</label>
                      <input 
                        type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full glass-input py-2 px-3 text-sm text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">Email</label>
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">New Password (Optional)</label>
                    <input 
                      type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full glass-input py-2 px-3 text-sm text-black"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="button" onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 rounded-xl border border-black/10 text-xs font-semibold text-neutral-600 hover:bg-black/[0.04] transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" disabled={updating}
                      className="flex-1 py-2.5 btn-high-black rounded-xl text-xs font-bold transition"
                    >
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black/[0.03] hover:bg-black/[0.07] border border-black/10 rounded-xl text-xs font-bold text-black transition"
                  >
                    <Edit2 size={14} /> Edit Profile Details
                  </button>

                  {(userData?.role === "STUDENT" || userData?.role === "TEACHER") && (
                    <button 
                      onClick={() => setShowCamera(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black/[0.03] hover:bg-black/[0.07] border border-black/10 rounded-xl text-xs font-bold text-black transition"
                    >
                      <ScanFace size={14} /> Update Biometric Photo
                    </button>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition mt-2"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Face Capture Submodal */}
      {showCamera && (
        <CameraCapture 
          title="Update Face Biometric Photo"
          onCapture={handleFaceCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
