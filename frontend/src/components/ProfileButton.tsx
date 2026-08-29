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
    ADMIN: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    TEACHER: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    STUDENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const avatarBg: any = {
    ADMIN: "bg-blue-600",
    TEACHER: "bg-gradient-to-r from-pink-500 to-purple-600",
    STUDENT: "bg-emerald-500",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full ${avatarBg[userData.role] || "bg-gray-600"} flex items-center justify-center font-bold text-white shadow-lg border border-white/20 hover:scale-105 transition-transform focus:outline-none`}
      >
        {initials || <User size={20} />}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl z-50 text-white"
          >
            {/* User Info Header */}
            <div className="flex flex-col items-center border-b border-white/10 pb-4 mb-4 text-center">
              <div className={`w-16 h-16 rounded-full ${avatarBg[userData.role]} flex items-center justify-center font-bold text-2xl text-white border-2 border-white/20 mb-3 shadow-md`}>
                {initials}
              </div>
              <h4 className="text-lg font-bold truncate max-w-full">
                {userData.firstName} {userData.lastName}
              </h4>
              <p className="text-xs text-gray-400 truncate max-w-full mb-3 flex items-center gap-1.5 justify-center">
                <Mail size={12} /> {userData.email}
              </p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${roleColors[userData.role]}`}>
                {userData.role}
              </span>
            </div>

            {/* Role Specific Details */}
            <div className="space-y-2.5 mb-5 bg-white/5 rounded-xl p-3.5 border border-white/5">
              {userData.role === "STUDENT" && userData.studentProfile && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Roll Number:</span>
                    <span className="font-mono text-gray-200">{userData.studentProfile.rollNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Class Section:</span>
                    <span className="text-gray-200">{userData.studentProfile.section?.name || "Unassigned"}</span>
                  </div>
                  {userData.studentProfile.department && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Department:</span>
                      <span className="text-gray-200">{userData.studentProfile.department.name}</span>
                    </div>
                  )}
                </>
              )}
              {userData.role === "TEACHER" && userData.teacherProfile && userData.teacherProfile.department && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Department:</span>
                  <span className="text-gray-200">{userData.teacherProfile.department.name}</span>
                </div>
              )}
              {userData.role === "ADMIN" && (
                <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                  <Shield size={14} className="text-blue-400" /> Full System Permissions
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-sm transition-colors"
              >
                <Settings size={16} /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-semibold text-sm transition-colors"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-dark border border-white/15 p-8 rounded-3xl shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError("");
                  setEditSuccess("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
              >
                <X size={18} />
              </button>

              <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-2">
                <Settings size={22} className="text-blue-400" /> Edit Profile Details
              </h3>

              {editError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Email Address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Password (Leave blank to keep current)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center gap-2"
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
