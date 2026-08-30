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
    ADMIN: "bg-black/[0.04] text-black border-black/10",
    TEACHER: "bg-black/[0.04] text-black border-black/10",
    STUDENT: "bg-black/[0.04] text-black border-black/10",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center font-bold text-white shadow-sm hover:scale-105 transition-transform focus:outline-none"
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
            className="absolute right-0 mt-3 w-80 mac-window bg-white/95 border border-black/10 rounded-2xl p-6 shadow-2xl z-50 text-black"
          >
            {/* User Info Header */}
            <div className="flex flex-col items-center border-b border-black/[0.06] pb-4 mb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center font-bold text-xl text-white mb-3 shadow-sm">
                {initials}
              </div>
              <h4 className="text-base font-bold text-black truncate max-w-full">
                {userData.firstName} {userData.lastName}
              </h4>
              <p className="text-xs text-neutral-500 truncate max-w-full mb-3 flex items-center gap-1.5 justify-center">
                <Mail size={12} /> {userData.email}
              </p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${roleColors[userData.role]}`}>
                {userData.role}
              </span>
            </div>

            {/* Role Specific Details */}
            <div className="space-y-2 mb-5 bg-black/[0.03] rounded-xl p-3 border border-black/[0.06]">
              {userData.role === "STUDENT" && userData.studentProfile && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Roll Number:</span>
                    <span className="font-mono text-black font-semibold">{userData.studentProfile.rollNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Class Section:</span>
                    <span className="text-black font-medium">{userData.studentProfile.section?.name || "Unassigned"}</span>
                  </div>
                  {userData.studentProfile.department && (
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Department:</span>
                      <span className="text-black font-medium">{userData.studentProfile.department.name}</span>
                    </div>
                  )}
                </>
              )}
              {userData.role === "TEACHER" && userData.teacherProfile && userData.teacherProfile.department && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Department:</span>
                  <span className="text-black font-medium">{userData.teacherProfile.department.name}</span>
                </div>
              )}
              {userData.role === "ADMIN" && (
                <div className="flex items-center gap-2 text-xs text-black font-medium justify-center">
                  <Shield size={14} className="text-[#0071E3]" /> Full System Administrator
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] rounded-xl font-bold text-xs text-black transition-colors"
              >
                <Settings size={14} /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold text-xs transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 text-black">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mac-window bg-white/95 border border-black/10 p-8 rounded-3xl shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError("");
                  setEditSuccess("");
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-black bg-black/[0.04] hover:bg-black/[0.08] w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-bold mb-6 text-black tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-black" /> Edit Profile Details
              </h3>

              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs">
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 px-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    placeholder="Email Address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">New Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-neutral-400" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-2.5 pl-10 pr-3.5 text-black text-sm focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-black/10 text-neutral-600 hover:bg-black/[0.04] text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 btn-high-black disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2"
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
