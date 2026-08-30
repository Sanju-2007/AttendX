"use client";
import { motion } from "framer-motion";
import { BarChart3, ScanFace, CalendarCheck, CheckCircle2, Users, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import CameraCapture from "../../components/CameraCapture";
import { getApiUrl } from "../../lib/api";
import ProfileModal from "../../components/ProfileModal";

export default function StudentDashboard() {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dynamic State
  const [enrolled, setEnrolled] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [department, setDepartment] = useState<any>(null);
  const [classmates, setClassmates] = useState<any[]>([]);
  
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [allowSectionChange, setAllowSectionChange] = useState(false);
  const [showClassChange, setShowClassChange] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [enrollRes, attRes] = await Promise.all([
        fetch(getApiUrl("/api/student/enrollment"), { credentials: "include" }),
        fetch(getApiUrl("/api/student/attendance"), { credentials: "include" })
      ]);

      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrolled(enrollData.enrolled);
        setAllowSectionChange(enrollData.allowSectionChange || false);
        if (enrollData.enrolled) {
          setSectionData(enrollData.section);
          setDepartment(enrollData.department || null);
          setClassmates(enrollData.classmates || []);
        }
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceData(attData.attendance || []);
      }
    } catch (err) {
      console.error("Failed to load student dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError("");
    
    try {
      const res = await fetch(getApiUrl("/api/student/join-section"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionCode: joinCode }),
        credentials: "include"
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join class");
      
      setShowClassChange(false);
      setJoinCode("");
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || "Invalid section code");
    } finally {
      setJoining(false);
    }
  };

  const handleCapture = async (imageSrc: string) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], "face_registration.jpg", { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(getApiUrl("/api/student/face-register"), {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!res.ok) throw new Error(await res.text());
      alert("Biometric face photo updated successfully!");
      setShowCamera(false);
      fetchDashboardData();
    } catch (err: any) {
      alert("Failed to update face: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
        Loading Student Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-7xl mx-auto text-black relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-5 border-b border-black/[0.06]">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Student Portal</h1>
          <p className="text-xs text-neutral-500 mt-0.5">View your attendance percentage and enrolled class sections</p>
        </div>
        <ProfileModal onProfileUpdate={fetchDashboardData} />
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard 
          icon={<CalendarCheck size={20} />} 
          title="Enrolled Section" 
          value={sectionData?.name ? `${sectionData.name} (Yr ${sectionData.year})` : "Unassigned"} 
          subtitle={department?.name || "Department Not Set"} 
        />
        <StatCard 
          icon={<BarChart3 size={20} />} 
          title="Tracked Subjects" 
          value={attendanceData.length} 
          subtitle="Active course modules" 
        />
        <div onClick={() => setShowCamera(true)} className="cursor-pointer">
          <StatCard 
            icon={<ScanFace size={20} />} 
            title="Biometric Face ID" 
            value="Update Photo" 
            subtitle="Click to register facial scan"
            isAction 
          />
        </div>
      </div>

      {/* Class Section Assignment / Join */}
      {(!enrolled || showClassChange) && (
        <div className="mac-window p-7 rounded-3xl mb-8">
          <h3 className="text-base font-bold text-black mb-1 flex items-center gap-2">
            <Plus size={18} /> Join Class Section
          </h3>
          <p className="text-xs text-neutral-500 mb-4">Enter the Section ID provided by your administrator.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinClass} className="flex gap-2 max-w-md">
            <input 
              type="text" 
              required 
              placeholder="Paste Section ID (e.g. 3b7...)" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value)}
              className="flex-1 glass-input py-2.5 px-3 text-xs" 
            />
            <button 
              type="submit" 
              disabled={joining} 
              className="btn-high-black py-2.5 px-5 rounded-xl text-xs font-bold shrink-0"
            >
              {joining ? "Joining..." : "Join Section"}
            </button>
          </form>
        </div>
      )}

      {/* Attendance Records */}
      <div className="mac-window p-7 rounded-3xl mb-8">
        <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
          <BarChart3 size={18} /> Subject Attendance Analytics
        </h3>

        {attendanceData.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-8 text-center bg-black/[0.02] rounded-2xl border border-black/[0.06]">
            No attendance records recorded for your enrolled subjects yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendanceData.map((att: any, idx: number) => {
              const pct = att.percentage || 0;
              const isLow = pct < 75;
              return (
                <div key={idx} className="bg-black/[0.02] p-5 rounded-2xl border border-black/[0.06] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-black">{att.subjectName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLow ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                        {pct}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">
                      Attended: <strong className="text-black">{att.presentCount}</strong> / {att.totalClasses} classes
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/[0.06] rounded-full h-2 mt-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-red-500" : "bg-black"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Classmates Card */}
      {classmates.length > 0 && (
        <div className="mac-window p-7 rounded-3xl">
          <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
            <Users size={18} /> Section Peers ({classmates.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classmates.map((c: any) => (
              <div key={c.id} className="bg-black/[0.02] p-3.5 rounded-xl border border-black/[0.06] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-black">{c.user?.firstName} {c.user?.lastName}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Roll: {c.rollNumber}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  c.faceRegistered ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                  {c.faceRegistered ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture 
          title="Update Face Biometric Photo"
          onCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, isAction }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className={`mac-card p-6 flex items-center gap-4 h-full ${isAction ? 'mac-window-hover' : ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-black/[0.04] border border-black/10 flex items-center justify-center text-black shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-xl font-black text-black">{value}</p>
        {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
