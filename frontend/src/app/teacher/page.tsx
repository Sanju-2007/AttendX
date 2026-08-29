"use client";
import { motion } from "framer-motion";
import { Calendar, Camera, QrCode, Plus, Users, Clock, BookOpen, GraduationCap, Lock, Unlock, Upload, Download } from "lucide-react";
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
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRecognizedList, setShowRecognizedList] = useState(false);
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
      setShowRecognizedList(false);
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
      setShowRecognizedList(false);
    } catch (error: any) {
      alert("Attendance processing failed: " + error.message);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const handleToggleClassChange = async (studentId: string, currentAllow: boolean) => {
    setUpdatingStudentId(studentId);
    try {
      const res = await fetch(getApiUrl("/api/teacher/allow-class-change"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, allow: !currentAllow }),
        credentials: "include"
      });
      if (res.ok) {
        fetchTeacherData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update permission");
      }
    } catch (err) {
      alert("Error updating class transfer permission");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const downloadReport = async (timetableId: string, type: 'session' | 'overall') => {
    try {
      let url = getApiUrl(`/api/reports/download?timetableId=${timetableId}`);
      if (type === 'session') {
        url += `&date=${new Date().toISOString()}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          alert("No attendance records found to generate a report.");
        } else {
          alert("Failed to download report");
        }
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `attendance_${type}_report_${timetableId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Error downloading report");
    }
  };

  const handleToggleManualAttendance = async (attendanceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      const res = await fetch(getApiUrl("/api/teacher/attendance/manual"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, status: newStatus }),
        credentials: "include"
      });
      
      if (res.ok) {
        setScanResult((prev: any) => {
          if (!prev || !prev.attendanceRecords) return prev;
          const updatedRecords = prev.attendanceRecords.map((rec: any) => {
            if (rec.id === attendanceId) {
              return { ...rec, status: newStatus };
            }
            return rec;
          });
          
          const newRecognizedCount = updatedRecords.filter((rec: any) => rec.status === 'PRESENT').length;
          
          return {
            ...prev,
            attendanceRecords: updatedRecords,
            recognized_count: newRecognizedCount,
            unknown_count: Math.max(0, prev.detected_faces_count - newRecognizedCount)
          };
        });
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update attendance status");
      }
    } catch (err) {
      alert("Error updating attendance");
    }
  };

  const getSlotIndex = (startTime: string) => {
    if (!startTime) return 0;
    const [hourStr, minStr] = startTime.split(":");
    const hour = parseInt(hourStr);
    const min = parseInt(minStr);
    const timeInMinutes = hour * 60 + min;

    if (timeInMinutes < 690) { // Before 11:30 AM (covers 9:00, 10:00, etc.)
      return 0; // Slot 1: 10:00 AM - 11:30 AM
    } else if (timeInMinutes < 780) { // Before 1:00 PM (covers 11:30, 12:00, etc.)
      return 1; // Slot 2: 11:30 AM - 01:00 PM
    } else if (timeInMinutes < 840) { // Before 2:00 PM (covers 1:00 PM Lunch)
      return 2; // Slot 3: 01:00 PM - 02:00 PM (Lunch)
    } else if (timeInMinutes < 930) { // Before 3:30 PM (covers 2:00 PM, 3:00 PM)
      return 3; // Slot 4: 02:00 PM - 03:30 PM
    } else { // After 3:30 PM
      return 4; // Slot 5: 03:30 PM - 05:00 PM
    }
  };

  const renderCellSlots = (slots: any[]) => {
    if (!slots || slots.length === 0) {
      return <span className="text-gray-600 block text-center font-mono select-none">......</span>;
    }

    return (
      <div className="flex flex-col gap-2">
        {slots.map(slot => {
          const isSelected = selectedTimetableId === slot.id;
          return (
            <div 
              key={slot.id} 
              onClick={() => setSelectedTimetableId(slot.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group text-left ${
                isSelected 
                  ? 'bg-pink-500/20 border-pink-500/60 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-pink-500/30'
              }`}
            >
              <p className="font-bold text-xs truncate text-white group-hover:text-pink-400 transition-colors">
                {slot.subject?.name}
              </p>
              <div className="text-[9px] text-gray-400 font-medium mt-1 flex justify-between gap-1 items-center">
                <span className="truncate max-w-[50px]">{slot.section?.name}</span>
                <span className="font-mono text-gray-500 shrink-0">{slot.startTime}-{slot.endTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-dark p-6 text-white relative overflow-hidden">
      {/* Background gradients matching home page design */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">Teacher Portal</h1>
          <p className="text-sm text-gray-400 mt-1">Manage class timetables and process AI classroom attendance scans</p>
        </div>
        <ProfileModal onProfileUpdate={fetchTeacherData} />
      </header>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ActionCard 
          icon={<Calendar />} 
          title="Assigned Slots" 
          desc={`${timetables.length} assigned weekly classes`} 
          color="bg-pink-500/20 text-pink-400 border-pink-500/30" 
        />
        <div onClick={() => {
          if (timetables.length > 0) {
            setShowScanner(true);
          } else {
            alert("Please ask Admin to assign a class timetable slot first.");
          }
        }} className="cursor-pointer">
          <ActionCard 
            icon={<Camera />} 
            title="AI Crowd Scan" 
            desc="Mark attendance via camera" 
            color="bg-purple-500/20 text-purple-400 border-purple-500/30" 
          />
        </div>
        <ActionCard 
          icon={<BookOpen />} 
          title="Subjects Managed" 
          desc={`${subjects.length} active course subjects`} 
          color="bg-teal-500/20 text-teal-400 border-teal-500/30" 
        />
        <ActionCard 
          icon={<Users />} 
          title="Sections Registered" 
          desc={`${sections.length} student class groups`} 
          color="bg-blue-500/20 text-blue-400 border-blue-500/30" 
        />
      </div>

      {/* Active Session Dropdown Selector */}
      <div className="relative z-10 glass-dark p-6 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="text-pink-400" /> Active Session Selector
        </h3>
        <p className="text-sm text-gray-400 mb-4">Select which scheduled class you want to capture attendance for.</p>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Timetable / Slot</label>
            <select 
              value={selectedTimetableId}
              onChange={e => setSelectedTimetableId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {timetables.map(slot => (
                <option key={slot.id} value={slot.id} className="bg-dark text-white">
                  {slot.subject?.name} ({slot.section?.name}) - {days[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="file" 
              id="direct-class-photo-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleDirectUpload}
            />
            <div className="relative z-40">
              <button 
                onClick={() => {
                  if (!selectedTimetableId) {
                    alert("Please select an assigned class slot first.");
                    return;
                  }
                  setActiveDownloadDropdown(activeDownloadDropdown === `selector-${selectedTimetableId}` ? null : `selector-${selectedTimetableId}`);
                }}
                disabled={timetables.length === 0}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50 font-bold rounded-xl transition shadow-lg flex items-center gap-2 whitespace-nowrap animate-pulse hover:animate-none"
              >
                Download CSV Report
              </button>
              {activeDownloadDropdown === `selector-${selectedTimetableId}` && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                  <button 
                    onClick={() => {
                      downloadReport(selectedTimetableId, 'session');
                      setActiveDownloadDropdown(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 border-b border-white/5 transition-colors"
                  >
                    📈 Session Report (Today)
                  </button>
                  <button 
                    onClick={() => {
                      downloadReport(selectedTimetableId, 'overall');
                      setActiveDownloadDropdown(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    📊 Overall Report (All-Time)
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (!selectedTimetableId) {
                  alert("Please select an assigned class slot first.");
                  return;
                }
                document.getElementById("direct-class-photo-upload")?.click();
              }}
              disabled={timetables.length === 0}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50 font-bold rounded-xl transition shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Upload size={20} /> Upload Class Photo
            </button>
            <button 
              onClick={() => {
                if (!selectedTimetableId) {
                  alert("Please select an assigned class slot first.");
                  return;
                }
                setShowScanner(true);
              }}
              disabled={timetables.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Camera size={20} /> Start AI Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Class Schedule Grid */}
      <div className="relative z-10 glass-dark p-6 rounded-2xl border border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="text-purple-400" /> Class Schedule & Timetables
          </h3>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setTimetableView('list')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${timetableView === 'list' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              List View
            </button>
            <button 
              onClick={() => setTimetableView('grid')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${timetableView === 'grid' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Timetable Grid
            </button>
          </div>
        </div>

        {timetables.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No class slots assigned yet. Please contact the Admin to assign slots.</p>
        ) : timetableView === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timetables.map((slot) => (
              <ScheduleCard 
                key={slot.id}
                time={`${days[slot.dayOfWeek]}, ${slot.startTime} - ${slot.endTime}`}
                subject={slot.subject?.name || "Unknown Subject"}
                section={slot.section?.name || "Unknown Section"}
                room="Classroom 301"
                status={selectedTimetableId === slot.id ? 'current' : 'upcoming'}
                timetableId={slot.id}
                downloadReport={downloadReport}
                activeDownloadDropdown={activeDownloadDropdown}
                setActiveDownloadDropdown={setActiveDownloadDropdown}
                onTakeAttendance={() => {
                  setSelectedTimetableId(slot.id);
                  setShowScanner(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full">
            <div className="overflow-x-auto w-full border border-white/10 rounded-2xl bg-black/45 custom-scrollbar">
              <table className="min-w-[950px] w-full border-collapse text-left text-sm text-gray-300">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4 border-r border-white/10">Day</th>
                    <th className="p-4 border-r border-white/10">10:00 AM - 11:30 AM</th>
                    <th className="p-4 border-r border-white/10">11:30 AM - 01:00 PM</th>
                    <th className="p-4 border-r border-white/10 text-center w-14">Lunch</th>
                    <th className="p-4 border-r border-white/10">02:00 PM - 03:30 PM</th>
                    <th className="p-4">03:30 PM - 05:00 PM</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((dayName, d) => {
                    const daySlots = timetables.filter(slot => slot.dayOfWeek === d);
                    const colSlots: Record<number, any[]> = { 0: [], 1: [], 3: [], 4: [] };
                    daySlots.forEach(slot => {
                      const colIndex = getSlotIndex(slot.startTime);
                      if (colIndex !== 2) {
                        if (colSlots[colIndex]) colSlots[colIndex].push(slot);
                      }
                    });

                    return (
                      <tr key={dayName} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 border-r border-white/10 font-bold text-white text-xs bg-white/[0.02] w-28 select-none">
                          {dayName}
                        </td>
                        <td className="p-4 border-r border-white/10 w-[200px] align-middle">
                          {renderCellSlots(colSlots[0])}
                        </td>
                        <td className="p-4 border-r border-white/10 w-[200px] align-middle">
                          {renderCellSlots(colSlots[1])}
                        </td>
                        
                        {d === 0 && (
                          <td rowSpan={7} className="border-r border-white/10 bg-pink-500/5 text-center font-bold text-[10px] text-pink-400 align-middle py-6 px-1 w-14 select-none">
                            <div className="flex flex-col items-center justify-center gap-2 uppercase tracking-widest font-extrabold font-mono">
                              <span>L</span>
                              <span>U</span>
                              <span>N</span>
                              <span>C</span>
                              <span>H</span>
                              <span className="my-2 border-t border-dashed border-pink-500/30 w-5"></span>
                              <span>B</span>
                              <span>R</span>
                              <span>E</span>
                              <span>A</span>
                              <span>K</span>
                            </div>
                          </td>
                        )}

                        <td className="p-4 border-r border-white/10 w-[200px] align-middle">
                          {renderCellSlots(colSlots[3])}
                        </td>
                        <td className="p-4 w-[200px] align-middle">
                          {renderCellSlots(colSlots[4])}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Timetable Legend (Matching printed format) */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-400">
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white mb-4 border-b border-white/5 pb-2 uppercase text-xs tracking-wider flex items-center gap-1 text-pink-400">
                  Name of the Subjects
                </h4>
                {departmentSubjects.length === 0 ? (
                  <p className="text-xs italic text-gray-600">No course subjects registered in your department.</p>
                ) : (
                  <ol className="list-decimal pl-5 space-y-2 text-xs">
                    {departmentSubjects.map((sub) => (
                      <li key={sub.id} className="text-gray-300">
                        <strong className="text-pink-400/80 font-mono pr-1">{sub.code}:</strong> {sub.name}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white mb-4 border-b border-white/5 pb-2 uppercase text-xs tracking-wider flex items-center gap-1 text-purple-400">
                  Name of the Faculty members
                </h4>
                {departmentTeachers.length === 0 ? (
                  <p className="text-xs italic text-gray-600">No department faculty registered.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    {departmentTeachers.map((fac) => (
                      <li key={fac.id} className="text-gray-300">
                        {fac.user?.firstName} {fac.user?.lastName} <span className="text-purple-400 font-mono text-[10px] uppercase font-bold ml-1.5 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">{fac.department?.code || "CS"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Department Overview Section for Teachers */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Left Column: Department Details & Subjects */}
        <div className="space-y-6">
          {/* Department Information Card */}
          <div className="glass-dark p-6 rounded-2xl border border-pink-500/20 bg-pink-500/5">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pink-400">
              <GraduationCap size={22} /> My Department
            </h3>
            {department ? (
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Department</p>
                  <p className="text-lg font-bold text-white">{department.name}</p>
                </div>
                <span className="text-sm font-mono bg-pink-500/20 text-pink-300 font-bold px-3 py-1.5 rounded-lg border border-pink-500/30">
                  {department.code}
                </span>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Department not assigned yet.</p>
            )}
          </div>

          {/* Subjects in Department */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-teal-400">
              <BookOpen size={22} /> Department Courses & Subjects ({departmentSubjects.length})
            </h3>
            <p className="text-sm text-gray-400 mb-4">Course catalog active in your department.</p>
            
            {departmentSubjects.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-4 text-center bg-black/20 rounded-xl border border-white/5">No subjects configured in this department.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {departmentSubjects.map(sub => (
                  <div key={sub.id} className="text-sm bg-black/40 p-3.5 rounded-xl border border-white/5 flex justify-between items-center hover:border-teal-500/30 transition-all">
                    <div>
                      <p className="font-bold text-white">{sub.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{sub.code}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colleagues / Other Teachers */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
              <Users size={22} /> Department Instructors ({departmentTeachers.length})
            </h3>
            <p className="text-sm text-gray-400 mb-4">Colleagues active within your department.</p>
            
            {departmentTeachers.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-4 text-center bg-black/20 rounded-xl border border-white/5">No colleagues registered yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {departmentTeachers.map(colleague => (
                  <div key={colleague.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:border-purple-500/30 transition-all">
                    <div>
                      <p className="font-bold text-sm text-white">{colleague.user?.firstName} {colleague.user?.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{colleague.user?.email}</p>
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/35 font-mono">
                      Teacher
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Students Directory */}
        <div className="glass-dark p-6 rounded-2xl border border-white/10 h-fit">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <Users size={22} /> Assigned Department Students ({departmentStudents.length})
          </h3>
          <p className="text-sm text-gray-400 mb-4">Complete directory of students enrolled in your department across all class sections.</p>
          
          {departmentStudents.length === 0 ? (
            <p className="text-gray-400 text-sm italic py-8 text-center bg-black/20 rounded-xl border border-white/5">No students registered in your department.</p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {departmentStudents.map(s => (
                <div key={s.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-start hover:border-emerald-500/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{s.user?.firstName} {s.user?.lastName}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Year {s.year}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1">{s.user?.email}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-gray-500">Roll: <strong className="text-gray-300 font-mono">{s.rollNumber}</strong></span>
                      <span className="text-xs text-gray-500">Section: <strong className="text-gray-300">{s.section?.name || "Unassigned"}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      s.faceRegistered 
                        ? "bg-teal-500/10 text-teal-300 border-teal-500/20" 
                        : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    }`}>
                      {s.faceRegistered ? "Biometric OK" : "Biometric Req"}
                    </span>
                    <button 
                      onClick={() => handleToggleClassChange(s.id, s.allowSectionChange)}
                      disabled={updatingStudentId === s.id}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                        s.allowSectionChange 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {updatingStudentId === s.id ? (
                        "Updating..."
                      ) : s.allowSectionChange ? (
                        <>
                          <Unlock size={10} /> Change: Allowed
                        </>
                      ) : (
                        <>
                          <Lock size={10} /> Change: Locked
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>



      {showScanner && (
        <CameraCapture 
          title="Scan Classroom"
          onCapture={handleCaptureAttendance}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {showResultModal && scanResult && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md glass-dark p-8 rounded-3xl border border-white/15 shadow-2xl relative">
            <button 
              onClick={() => setShowResultModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
              Attendance Processed
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3.5 bg-black/30 rounded-xl border border-white/5">
                <span className="text-gray-300">Detected Faces</span>
                <span className="font-mono font-bold text-white text-lg">{scanResult.detected_faces_count}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-black/30 rounded-xl border border-white/5">
                <span className="text-gray-300">Known Faces</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400 text-lg">{scanResult.recognized_count}</span>
                  <button
                    onClick={() => setShowRecognizedList(!showRecognizedList)}
                    className="text-xs px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold rounded-lg transition"
                  >
                    {showRecognizedList ? "Hide List" : "Verify & Edit"}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-black/30 rounded-xl border border-white/5">
                <span className="text-gray-300">Unknown Faces</span>
                <span className="font-mono font-bold text-amber-400 text-lg">{scanResult.unknown_count}</span>
              </div>
            </div>

            <button
              onClick={() => downloadReport(selectedTimetableId, 'session')}
              className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/35 hover:to-teal-600/35 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Download size={18} /> Download Session CSV Report
            </button>

            {showRecognizedList && scanResult.attendanceRecords && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 border-t border-white/10 pt-4"
              >
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Class Attendance Directory
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {scanResult.attendanceRecords.length === 0 ? (
                    <p className="text-gray-400 text-xs italic">No student records found.</p>
                  ) : (
                    scanResult.attendanceRecords.map((record: any) => {
                      const isPresent = record.status === 'PRESENT';
                      return (
                        <div key={record.id} className="text-xs bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center hover:border-purple-500/10 transition-colors">
                          <div>
                            <p className="font-bold text-white">{record.student?.user?.firstName} {record.student?.user?.lastName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{record.student?.user?.email}</p>
                            <p className="text-[9px] text-gray-500 mt-1 font-mono">{record.student?.rollNumber}</p>
                          </div>
                          
                          {/* Slide Toggle Switch (1 | 0) */}
                          <button
                            onClick={() => handleToggleManualAttendance(record.id, record.status)}
                            className={`relative w-16 h-8 rounded-full border p-1 transition-all duration-300 flex items-center ${
                              isPresent 
                                ? "bg-emerald-500/20 border-emerald-500/40" 
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <span className={`absolute text-[10px] font-extrabold transition-all duration-300 font-mono ${
                              isPresent 
                                ? "left-3 text-emerald-400" 
                                : "right-3 text-gray-400"
                            }`}>
                              {isPresent ? "1" : "0"}
                            </span>
                            <span className={`w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                              isPresent 
                                ? "translate-x-8 bg-emerald-400" 
                                : "translate-x-0 bg-gray-500"
                            }`} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setShowResultModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition shadow-lg w-full text-center"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-semibold animate-pulse">Processing Faces...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ time, subject, section, room, status, onTakeAttendance, timetableId, downloadReport, activeDownloadDropdown, setActiveDownloadDropdown }: any) {
  const isCurrent = status === 'current';
  return (
    <div className={`p-4 rounded-xl border ${isCurrent ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/5'} flex justify-between items-center relative`}>
      <div>
        <p className="text-xs text-gray-400 mb-1">{time}</p>
        <p className={`font-semibold ${isCurrent ? 'text-pink-400' : 'text-white'}`}>{subject} ({section})</p>
        <p className="text-sm text-gray-400">{room}</p>
      </div>
      <div className="flex gap-2 items-center z-10">
        <div className="relative">
          <button 
            onClick={() => {
              setActiveDownloadDropdown(activeDownloadDropdown === `card-${timetableId}` ? null : `card-${timetableId}`);
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition shadow-md"
          >
            Download Report
          </button>
          {activeDownloadDropdown === `card-${timetableId}` && (
            <div className="absolute right-0 bottom-full mb-2 w-56 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50">
              <button 
                onClick={() => {
                  downloadReport(timetableId, 'session');
                  setActiveDownloadDropdown(null);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 border-b border-white/5 transition-colors"
              >
                📈 Session Report (Today)
              </button>
              <button 
                onClick={() => {
                  downloadReport(timetableId, 'overall');
                  setActiveDownloadDropdown(null);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                📊 Overall Report (All-Time)
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={onTakeAttendance}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition shadow-md"
        >
          Take Attendance
        </button>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, color }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className={`glass-dark p-6 rounded-2xl border ${color} cursor-pointer group flex items-center gap-4 h-full`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform bg-white/5">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
    </motion.div>
  );
}
