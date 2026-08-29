"use client";
import { motion } from "framer-motion";
import { BarChart3, ScanFace, AlertTriangle, CalendarCheck, Plus, CheckCircle2, Users, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import CameraCapture from "../../components/CameraCapture";
import { getApiUrl } from "../../lib/api";
import ProfileModal from "../../components/ProfileModal";

export default function StudentDashboard() {
  const [showCamera, setShowCamera] = useState(false);
  const [faceUpdateRequired, setFaceUpdateRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dynamic State
  const [enrolled, setEnrolled] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [department, setDepartment] = useState<any>(null);
  const [departmentSubjects, setDepartmentSubjects] = useState<any[]>([]);
  const [departmentTeachers, setDepartmentTeachers] = useState<any[]>([]);
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
      // 1. Fetch Enrollment
      const enrollRes = await fetch(getApiUrl("/api/student/enrollment"), { credentials: "include" });
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrolled(enrollData.enrolled);
        setAllowSectionChange(enrollData.allowSectionChange || false);
        if (enrollData.enrolled) {
          setSectionData(enrollData.section);
          setDepartment(enrollData.department || null);
          setDepartmentSubjects(enrollData.departmentSubjects || []);
          setDepartmentTeachers(enrollData.departmentTeachers || []);
          setClassmates(enrollData.classmates || []);
        }
      }

      // 2. Fetch Attendance (which also returns faceUpdateRequired)
      const attRes = await fetch(getApiUrl("/api/student/attendance"), { credentials: "include" });
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceData(attData.attendance || []);
        setFaceUpdateRequired(attData.faceUpdateRequired || false);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
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
      
      // Refresh Data
      setShowClassChange(false);
      setJoinCode("");
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCapture = async (imageSrc: string) => {
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const file = new File([blob], "face_registration.jpg", { type: "image/jpeg" });
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(getApiUrl("/api/student/face-register"), {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setFaceUpdateRequired(false);
      setShowCamera(false);
      alert("Face registered successfully!");
      window.location.reload();
    } catch (error) {
      alert("Failed to register face");
    }
  }; 

  if (loading) {
    return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;
  }

  // Calculate stats dynamically
  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter(a => a.status === 'PRESENT').length;
  const attendancePercentage = totalClasses === 0 ? 100 : Math.round((presentClasses / totalClasses) * 100);

  // Group attendance by subject
  const subjectAttendance: Record<string, { total: number, present: number }> = {};
  attendanceData.forEach(att => {
    const subjectName = att.timetable?.subject?.name || "Unknown Subject";
    if (!subjectAttendance[subjectName]) {
      subjectAttendance[subjectName] = { total: 0, present: 0 };
    }
    subjectAttendance[subjectName].total += 1;
    if (att.status === 'PRESENT') subjectAttendance[subjectName].present += 1;
  });

  return (
    <div className="min-h-screen bg-dark p-6 text-white">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Student Portal</h1>
          {enrolled && sectionData && (
            <p className="text-gray-400 mt-1">Enrolled in: {sectionData.name} (Year {sectionData.year})</p>
          )}
        </div>
        <ProfileModal onProfileUpdate={fetchDashboardData} />
      </header>

      {faceUpdateRequired && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-full text-orange-400">
              <ScanFace size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-400">Action Required: Face Scan Update</h3>
              <p className="text-sm text-gray-300">Your face biometric data is missing or over 30 days old. You must update it.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCamera(true)}
            className="whitespace-nowrap px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(249,115,22,0.4)]"
          >
            Update Face Now
          </button>
        </motion.div>
      )}

      {showCamera && (
        <CameraCapture 
          title="Register Your Face"
          onCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {!enrolled ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-2">Not Enrolled Yet</h2>
            <p className="text-gray-400 mb-8">You are not currently enrolled in any class section. Ask your teacher for the Class Join Code.</p>
            
            <form onSubmit={handleJoinClass} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Class Join Code</label>
                <input 
                  type="text" required
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Paste UUID code here..."
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button 
                type="submit" disabled={joining}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {joining ? "Joining..." : "Join Class"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<BarChart3 />} title="Overall Attendance" value={`${attendancePercentage}%`} color="text-emerald-400" />
            <StatCard icon={<CalendarCheck />} title="Classes Attended" value={presentClasses.toString()} color="text-blue-400" />
            <StatCard icon={<AlertTriangle />} title="Total Classes" value={totalClasses.toString()} color="text-yellow-400" />
            <div onClick={() => setShowCamera(true)} className="cursor-pointer">
              <ActionCard 
                icon={<ScanFace />} 
                title="Face Registration" 
                desc="Update biometric profile" 
                color={faceUpdateRequired ? "bg-orange-500" : "bg-teal-500"} 
                highlight={faceUpdateRequired}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" /> Subject-wise Attendance
              </h3>
              <div className="space-y-6">
                {Object.keys(subjectAttendance).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No attendance records yet.</p>
                ) : (
                  Object.entries(subjectAttendance).map(([subject, stats]) => {
                    const percentage = Math.round((stats.present / stats.total) * 100);
                    return (
                      <SubjectProgress 
                        key={subject}
                        name={subject} 
                        percentage={percentage} 
                        color={percentage > 75 ? "bg-emerald-500" : percentage > 60 ? "bg-yellow-500" : "bg-red-500"}
                        warning={percentage < 75}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">Alerts & Notifications</h3>
                <div className="space-y-4">
                  {attendancePercentage < 75 && totalClasses > 5 && (
                    <AlertCard 
                      type="danger" 
                      title="Low Attendance Alert" 
                      message={`Your overall attendance is ${attendancePercentage}%. Please attend upcoming classes to avoid penalties.`} 
                    />
                  )}
                  <AlertCard 
                    type="info" 
                    title="System Active" 
                    message="You are successfully connected to the AI attendance system." 
                  />
                </div>
              </div>

              {/* Class Transfer Card */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
                  {allowSectionChange ? <Unlock size={22} /> : <Lock size={22} />} Class Transfer
                </h3>
                
                {!showClassChange ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Want to switch to a different class group or section?
                    </p>
                    
                    {allowSectionChange ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                        <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                          <Unlock size={14} /> Class Change Unlocked
                        </p>
                        <p className="text-xs text-gray-300">
                          Your teacher has unlocked class transfer for you. You can now join a new class.
                        </p>
                        <button 
                          onClick={() => setShowClassChange(true)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                        >
                          Enter Class Code
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                        <p className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                          <Lock size={14} /> Class Change Locked
                        </p>
                        <p className="text-xs text-gray-400">
                          You cannot join another class group unless your class teacher grants you permission.
                        </p>
                        <button 
                          disabled
                          className="w-full bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed font-bold py-2 px-3 rounded-lg text-xs"
                        >
                          Locked by Teacher
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleJoinClass} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">New Class Join Code</label>
                      <input 
                        type="text" required
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                        placeholder="Paste class UUID code..."
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex gap-2.5">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowClassChange(false);
                          setError("");
                        }}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-xl text-xs transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" disabled={joining}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                      >
                        {joining ? "Joining..." : "Submit"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Department & Class Directory Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            
            {/* Column 1: Classmates Directory */}
            <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-400">
                <Users size={22} /> My Classmates ({classmates.length})
              </h3>
              <p className="text-sm text-gray-400 mb-6">Directory of student classmates enrolled in your section.</p>
              
              {classmates.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-6 text-center bg-black/20 rounded-xl border border-white/5">You are currently the only registered student in this section.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {classmates.map(mate => (
                    <div key={mate.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-3 hover:border-emerald-500/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                        {mate.user?.firstName?.[0] || "C"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{mate.user?.firstName} {mate.user?.lastName}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{mate.rollNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Department Instructors */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10 h-fit">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
                <Users size={22} /> Department Faculty ({departmentTeachers.length})
              </h3>
              <p className="text-sm text-gray-400 mb-6">Colleagues and teachers assigned to your department.</p>
              
              {departmentTeachers.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-4 text-center bg-black/20 rounded-xl border border-white/5">No department instructors registered yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {departmentTeachers.map(faculty => (
                    <div key={faculty.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center hover:border-purple-500/30 transition-all">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{faculty.user?.firstName} {faculty.user?.lastName}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{faculty.user?.email}</p>
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono shrink-0">
                        Faculty
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className="glass-dark p-6 rounded-2xl border border-white/10 flex items-center gap-4">
      <div className={`p-4 rounded-xl bg-white/5 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon, title, desc, color, highlight }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className={`glass-dark p-6 rounded-2xl border ${highlight ? 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-emerald-500/30'} cursor-pointer group h-full flex flex-col justify-center`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h4 className="text-md font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SubjectProgress({ name, percentage, color, warning }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${warning ? 'text-red-400' : 'text-gray-300'}`}>
          {name} {warning && '⚠️'}
        </span>
        <span className="text-white font-bold">{percentage}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function AlertCard({ type, title, message }: any) {
  const isDanger = type === 'danger';
  return (
    <div className={`p-4 rounded-xl border ${isDanger ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
      <h4 className={`font-semibold mb-1 ${isDanger ? 'text-red-400' : 'text-blue-400'}`}>{title}</h4>
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );
}
