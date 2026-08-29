"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, LogOut, X, Edit2, ShieldAlert, CheckCircle, ScanFace } from "lucide-react";
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TEACHER": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "STUDENT": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <>
      {/* Trigger Button - Header Avatar */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center font-bold text-white shadow-md border border-white/10 hover:scale-105 transition-transform overflow-hidden"
      >
        {userData?.profilePic ? (
          <img src={userData.profilePic} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={18} />
        )}
      </button>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md glass-dark p-8 rounded-3xl border border-white/10 shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X size={18} />
              </button>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 text-sm">Loading details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header/Avatar area */}
                  <div className="flex flex-col items-center text-center">
                    {userData?.profilePic ? (
                      <img 
                        src={userData.profilePic} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border border-emerald-500/30 mb-3 shadow-inner"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl font-extrabold text-emerald-400 mb-3 shadow-inner">
                        {getInitials()}
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-white">
                      {userData?.firstName} {userData?.lastName}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{userData?.email}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${getRoleColor(userData?.role)}`}>
                      {userData?.role}
                    </span>
                    {(userData?.role === "STUDENT" || userData?.role === "TEACHER") && (
                      <button
                        onClick={() => setShowCamera(true)}
                        className="mt-3 text-xs bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 font-bold py-1.5 px-3 rounded-lg border border-white/10 hover:border-emerald-500/30 transition flex items-center gap-1.5"
                      >
                        <ScanFace size={14} />
                        Update Face Photo
                      </button>
                    )}
                  </div>

                  {/* Profile Edit or Info Screen */}
                  {!isEditing ? (
                    <div className="space-y-4">
                      {/* Role specific info */}
                      {userData?.role === "STUDENT" && userData?.studentProfile && (
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2.5 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Roll Number</span>
                            <span className="font-mono text-white">{userData.studentProfile.rollNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Year / Section</span>
                            <span className="text-white">
                              Year {userData.studentProfile.year} - {userData.studentProfile.section?.name || "Not Enrolled"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Department</span>
                            <span className="text-white">{userData.studentProfile.department?.name || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                            <span className="text-gray-400 text-xs">Class Change Status</span>
                            {userData.studentProfile.allowSectionChange ? (
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle size={10} /> Allowed by Teacher
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldAlert size={10} /> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {userData?.role === "TEACHER" && userData?.teacherProfile && (
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Department</span>
                            <span className="text-white font-bold">{userData.teacherProfile.department?.name || "N/A"}</span>
                          </div>
                        </div>
                      )}

                      {success && <p className="text-emerald-400 text-sm text-center font-medium bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">{success}</p>}

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition flex items-center justify-center gap-2"
                        >
                          <Edit2 size={16} /> Edit Profile
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl border border-red-500/20 transition flex items-center justify-center"
                          title="Logout"
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Edit Form */
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">First Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="text" required
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Last Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="text" required
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="email" required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">New Password (leave blank to keep current)</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      {error && <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">{error}</p>}

                      <div className="flex gap-3 pt-4 border-t border-white/5">
                        <button 
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/10 transition text-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" disabled={updating}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
                        >
                          {updating ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCamera && (
        <CameraCapture 
          title="Register / Update Your Face"
          onCapture={handleFaceCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
