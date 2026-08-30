"use client";
import { motion } from "framer-motion";
import { Calendar, Camera, BookOpen, Users, Clock, Upload, Download, CheckCircle, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import CameraCapture from "../../components/CameraCapture";
import { getApiUrl } from "../../lib/api";
import ProfileModal from "../../components/ProfileModal";

export default function TeacherDashboard() {
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dynamic State
  const [timetables, setTimetables] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [department, setDepartment] = useState<any>(null);
  const [departmentTeachers, setDepartmentTeachers] = useState<any[]>([]);
  const [departmentStudents, setDepartmentStudents] = useState<any[]>([]);
  const [departmentSubjects, setDepartmentSubjects] = useState<any[]>([]);
  const [timetableView, setTimetableView] = useState<'list' | 'grid'>('list');
  
  // Scanner State
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [activeDownloadDropdown, setActiveDownloadDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const res = await fetch(getApiUrl("/api/teacher/data"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTimetables(data.timetables || []);
        setSubjects(data.subjects || []);
        setSections(data.sections || []);
        setDepartment(data.department || null);
        setDepartmentTeachers(data.departmentTeachers || []);
        setDepartmentStudents(data.departmentStudents || []);
        setDepartmentSubjects(data.departmentSubjects || []);
        
        if (data.timetables && data.timetables.length > 0) {
          setSelectedTimetableId(data.timetables[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch teacher data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureAttendance = async (imageSrc: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], "classroom_scan.jpg", { type: "image/jpeg" });
      
      const fd = new FormData();
      fd.append("file", file);
      fd.append("timetableId", selectedTimetableId);
      fd.append("date", new Date().toISOString());

      const res = await fetch(getApiUrl("/api/teacher/attendance"), {
        method: "POST",
        body: fd,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setScanResult(data);
      setShowResultModal(true);
      setShowScanner(false);
    } catch (error: any) {
      alert("Attendance processing failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!selectedTimetableId) {
      alert("Please select or schedule a class slot first.");
      return;
    }

    setIsProcessing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("timetableId", selectedTimetableId);
      fd.append("date", new Date().toISOString());

      const res = await fetch(getApiUrl("/api/teacher/attendance"), {
        method: "POST",
        body: fd,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setScanResult(data);
      setShowResultModal(true);
    } catch (error: any) {
      alert("Failed to process uploaded photo: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReport = async (timetableId: string, format: "pdf" | "csv") => {
    try {
      const res = await fetch(getApiUrl(`/api/reports/timetable/${timetableId}/${format}`), {
        credentials: "include"
      });
      if (!res.ok) {
        alert("Failed to generate report");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_report_${timetableId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error downloading report");
    }
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
        Loading Teacher Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-7xl mx-auto text-black relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-5 border-b border-black/[0.06]">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Teacher Portal</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage schedules and process AI facial attendance recognition</p>
        </div>
        <ProfileModal onProfileUpdate={fetchTeacherData} />
      </header>

      {/* Action Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={<Calendar size={20} />} title="Assigned Slots" value={timetables.length} subtitle="Weekly assigned classes" />
        <div 
          onClick={() => {
            if (timetables.length > 0) setShowScanner(true);
            else alert("Please have the admin assign a timetable slot first.");
          }}
          className="cursor-pointer"
        >
          <StatCard icon={<Camera size={20} />} title="AI Crowd Scan" value="Start Scan" subtitle="Mark attendance via camera" isAction />
        </div>
        <StatCard icon={<BookOpen size={20} />} title="Subjects" value={subjects.length} subtitle="Active course subjects" />
        <StatCard icon={<Users size={20} />} title="Sections" value={sections.length} subtitle="Student class groups" />
      </div>

      {/* Active Session Card */}
      <div className="mac-window p-7 rounded-3xl mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
          <div className="mac-dots">
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">Live Session</span>
        </div>

        <h3 className="text-base font-bold text-black mb-1 flex items-center gap-2">
          <Clock size={18} /> Active Attendance Scanner
        </h3>
        <p className="text-xs text-neutral-500 mb-5">Select a scheduled slot to trigger facial recognition attendance.</p>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Select Class Slot</label>
            <select 
              value={selectedTimetableId}
              onChange={e => setSelectedTimetableId(e.target.value)}
              className="w-full glass-input py-2.5 px-3 text-sm cursor-pointer"
            >
              {timetables.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.subject?.name} ({slot.section?.name}) - {days[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto">
            <input 
              type="file" 
              accept="image/*" 
              id="upload-classroom" 
              onChange={handleDirectUpload}
              className="hidden" 
            />
            <label 
              htmlFor="upload-classroom"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-black/[0.04] hover:bg-black/[0.08] border border-black/10 rounded-xl text-xs font-bold text-black cursor-pointer transition"
            >
              <Upload size={15} /> Upload Photo
            </label>

            <button 
              onClick={() => {
                if (selectedTimetableId) setShowScanner(true);
                else alert("Select a timetable slot first");
              }}
              disabled={isProcessing || timetables.length === 0}
              className="flex-1 md:flex-none btn-high-black py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Camera size={15} /> Launch Camera Scan
            </button>
          </div>
        </div>
      </div>

      {/* Timetable List & Reports */}
      <div className="mac-window p-7 rounded-3xl">
        <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
          <Calendar size={18} /> Scheduled Classes & Reports
        </h3>

        {timetables.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-8 text-center bg-black/[0.02] rounded-2xl border border-black/[0.06]">
            No classes scheduled yet.
          </p>
        ) : (
          <div className="space-y-3">
            {timetables.map(t => (
              <div key={t.id} className="bg-black/[0.02] p-4 rounded-2xl border border-black/[0.06] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-black">{t.subject?.name}</h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Section {t.section?.name} &bull; {days[t.dayOfWeek]} &bull; {t.startTime} - {t.endTime}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadReport(t.id, "csv")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] border border-black/10 rounded-xl text-xs font-bold text-black transition"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <button 
                    onClick={() => handleDownloadReport(t.id, "pdf")}
                    className="flex items-center gap-1.5 px-3 py-1.5 btn-high-black rounded-xl text-xs font-bold transition"
                  >
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Scan Camera Modal */}
      {showScanner && (
        <CameraCapture 
          title="Classroom Facial Recognition Attendance"
          onCapture={handleCaptureAttendance}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {/* Scan Results Modal */}
      {showResultModal && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full max-w-lg mac-window p-8 rounded-3xl relative text-black"
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
              <div className="mac-dots">
                <span className="mac-dot mac-dot-close" onClick={() => setShowResultModal(false)} />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-neutral-400 hover:text-black">
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-black">Scan Complete</h3>
              <p className="text-xs text-neutral-500 mt-1">Attendance processed successfully</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-black/[0.03] p-4 rounded-2xl border border-black/[0.06] text-center">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Present</p>
                <p className="text-2xl font-black text-black">{scanResult.presentCount || scanResult.recognized?.length || 0}</p>
              </div>
              <div className="bg-black/[0.03] p-4 rounded-2xl border border-black/[0.06] text-center">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Enrolled</p>
                <p className="text-2xl font-black text-black">{scanResult.totalStudents || 0}</p>
              </div>
            </div>

            <button 
              onClick={() => setShowResultModal(false)} 
              className="w-full btn-high-black py-3 rounded-xl font-bold text-xs"
            >
              Done & Return to Dashboard
            </button>
          </motion.div>
        </div>
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
