"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, LogOut, Settings, Lock, X, GraduationCap, Building } from "lucide-react";
import { getApiUrl } from "../lib/api";

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Edit form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(getApiUrl("/api/auth/me"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(getApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to logout");
      }
    } catch (err) {
      console.error("Logout error", err);
      alert("Error logging out");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setSaving(true);

    try {
      const body: any = { firstName, lastName, email };
      if (password) body.password = password;

      const res = await fetch(getApiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setEditSuccess("Profile updated successfully!");
      setPassword(""); // Clear password field
      // Re-fetch profile data to sync UI
      await fetchProfile();
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess("");
      }, 1500);
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />;
  }

  if (!userData) return null;

  const initials = `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`.toUpperCase();

  // Role badge color scheme
  const roleColors: any = {
    ADMIN: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    TEACHER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    STUDENT: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  const avatarBg: any = {
    ADMIN: "bg-gradient-to-tr from-sky-600 to-blue-500",
    TEACHER: "bg-gradient-to-tr from-blue-600 to-cyan-500",
    STUDENT: "bg-gradient-to-tr from-sky-500 to-teal-500",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-2xl ${avatarBg[userData.role] || "bg-sky-600"} flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] border border-sky-400/40 hover:scale-105 transition-transform focus:outline-none`}
      >
        {initials || <User size={18} />}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 water-pane bg-[#070B16]/95 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 text-white"
          >
            {/* User Info Header */}
            <div className="flex flex-col items-center border-b border-white/10 pb-4 mb-4 text-center">
              <div className={`w-14 h-14 rounded-2xl ${avatarBg[userData.role]} flex items-center justify-center font-bold text-xl text-white border border-sky-300/40 mb-3 shadow-[0_0_15px_rgba(56,189,248,0.25)]`}>
                {initials}
              </div>
              <h4 className="text-base font-bold text-white truncate max-w-full">
                {userData.firstName} {userData.lastName}
              </h4>
              <p className="text-xs text-slate-400 truncate max-w-full mb-3 flex items-center gap-1.5 justify-center">
                <Mail size={12} /> {userData.email}
              </p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${roleColors[userData.role]}`}>
                {userData.role}
              </span>
            </div>

            {/* Role Specific Details */}
            <div className="space-y-2 mb-5 bg-[#03060E]/80 rounded-xl p-3 border border-white/5">
              {userData.role === "STUDENT" && userData.studentProfile && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Roll Number:</span>
                    <span className="font-mono text-white font-medium">{userData.studentProfile.rollNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Class Section:</span>
                    <span className="text-white font-medium">{userData.studentProfile.section?.name || "Unassigned"}</span>
                  </div>
                  {userData.studentProfile.department && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Department:</span>
                      <span className="text-white font-medium">{userData.studentProfile.department.name}</span>
                    </div>
                  )}
                </>
              )}
              {userData.role === "TEACHER" && userData.teacherProfile && userData.teacherProfile.department && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-white font-medium">{userData.teacherProfile.department.name}</span>
                </div>
              )}
              {userData.role === "ADMIN" && (
                <div className="flex items-center gap-2 text-xs text-sky-300 justify-center">
                  <Shield size={14} className="text-sky-400" /> Full System Administrator
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowEditModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-xs text-slate-200 transition-colors"
              >
                <Settings size={14} className="text-sky-400" /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-semibold text-xs transition-colors"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md water-pane bg-[#070B16]/95 border border-white/15 p-8 rounded-3xl shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError("");
                  setEditSuccess("");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-bold mb-6 text-white tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-sky-400" /> Edit Profile Details
              </h3>

              {editError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400 text-xs">
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#03060E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#03060E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#03060E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Email Address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#03060E] border border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 btn-water disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center gap-2"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
