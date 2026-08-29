"use client";
import { motion } from "framer-motion";
import { Users, BookOpen, Key, Building, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getApiUrl } from "../../lib/api";
import ProfileModal from "../../components/ProfileModal";
import ProfileButton from "../../components/ProfileButton";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({ totalTeachers: 0, totalStudents: 0, totalDepartments: 0, classesConducted: 0 });
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [inviteTokens, setInviteTokens] = useState<any[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);

  // Selected teacher for expanded timetable view in the active teachers modal
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  // Form States
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", departmentId: "" });
  const [sectionForm, setSectionForm] = useState({ name: "", year: "1" });
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [timetableForm, setTimetableForm] = useState({
    subjectId: "",
    sectionId: "",
    dayOfWeek: "1", // Default Monday
    startTime: "09:00",
    endTime: "10:00"
  });
  const [activeModal, setActiveModal] = useState<"TEACHERS" | "STUDENTS" | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, dataRes, teachersRes] = await Promise.all([
        fetch(getApiUrl("/api/admin/dashboard"), { credentials: "include" }),
        fetch(getApiUrl("/api/admin/data"), { credentials: "include" }),
        fetch(getApiUrl("/api/admin/teachers/pending"), { credentials: "include" })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (teachersRes.ok) setPendingTeachers(await teachersRes.json());
      if (dataRes.ok) {
        const data = await dataRes.json();
        setDepartments(data.departments);
        setSubjects(data.subjects);
        setSections(data.sections);
        setInviteTokens(data.inviteTokens);
        setTeachers(data.teachers || []);
        setStudents(data.students || []);
        setTimetables(data.timetables || []);
        
        // Auto-select single department for subjects if available
        if (data.departments && data.departments.length > 0) {
          setSubjectForm(prev => ({ ...prev, departmentId: data.departments[0].id }));
        }

        // Auto-populate timetable form with first elements
        if (data.subjects && data.subjects.length > 0) {
          setTimetableForm(prev => ({ ...prev, subjectId: prev.subjectId || data.subjects[0].id }));
        }
        if (data.sections && data.sections.length > 0) {
          setTimetableForm(prev => ({ ...prev, sectionId: prev.sectionId || data.sections[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/teachers/invite-token"), { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        alert(`New Teacher Token Generated: \n\n${data.token}\n\nCopy this and give it to the teacher!`);
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to generate token");
    }
  };

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/admin/departments"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deptForm), credentials: "include"
      });
      if (res.ok) { alert("Department created!"); setDeptForm({name: "", code: ""}); fetchAdminData(); }
    } catch (err) { alert("Failed to create department"); }
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/admin/subjects"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subjectForm), credentials: "include"
      });
      if (res.ok) { alert("Subject created!"); setSubjectForm({name: "", code: "", departmentId: ""}); fetchAdminData(); }
    } catch (err) { alert("Failed to create subject"); }
  };

  const createSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/admin/sections"), {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: sectionForm.name, year: parseInt(sectionForm.year) }), 
        credentials: "include"
      });
      if (res.ok) { alert("Section created!"); setSectionForm({name: "", year: "1"}); fetchAdminData(); }
    } catch (err) { alert("Failed to create section"); }
  };

  const approveTeacher = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/teachers/${id}/approve`), { method: "PUT", credentials: "include" });
      if (res.ok) { alert("Teacher approved!"); fetchAdminData(); }
    } catch (err) { alert("Failed to approve"); }
  };

  const handleAssignTimetable = async (e: React.FormEvent, teacherId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/admin/timetables"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...timetableForm,
          teacherId
        }),
        credentials: "include"
      });
      if (res.ok) {
        alert("Timetable slot assigned successfully!");
        // Reset form times but keep subject/section
        setTimetableForm(prev => ({ ...prev, startTime: "09:00", endTime: "10:00" }));
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to assign timetable slot");
      }
    } catch (err) {
      alert("Error assigning timetable");
    }
  };

  const handleDeleteTimetable = async (timetableId: string) => {
    if (!confirm("Are you sure you want to delete this class slot?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/timetables/${timetableId}`), {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        alert("Timetable slot deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete slot");
      }
    } catch (err) {
      alert("Error deleting slot");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will delete all timetable classes and attendance records associated with it!")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/subjects/${subjectId}`), {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        alert("Subject deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete subject");
      }
    } catch (err) {
      alert("Error deleting subject");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? This will delete all timetable classes and attendance records associated with it, and clear section assignments for students!")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/sections/${sectionId}`), {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        alert("Section deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete section");
      }
    } catch (err) {
      alert("Error deleting section");
    }
  };

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-dark p-6 text-white relative">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Admin Portal</h1>
        <ProfileModal onProfileUpdate={fetchAdminData} />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div onClick={() => setActiveModal("STUDENTS")} className="cursor-pointer">
          <StatCard icon={<Users />} title="Total Students" value={stats.totalStudents} color="text-blue-400" subtitle="Click to view list grouped by Year & Section" />
        </div>
        <div onClick={() => setActiveModal("TEACHERS")} className="cursor-pointer">
          <StatCard icon={<Users />} title="Total Teachers" value={stats.totalTeachers} color="text-purple-400" subtitle="Click to view department staff directory" />
        </div>
        <StatCard icon={<Building />} title="Departments" value={stats.totalDepartments} color="text-pink-400" subtitle="System active department count" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Create Entities */}
        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Key className="text-yellow-400" /> Teacher Access</h3>
            <button onClick={generateToken} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-xl transition mb-4">
              Generate Teacher Invite Token
            </button>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {inviteTokens.slice(0, 5).map(t => (
                <div key={t.id} className="text-sm bg-black/40 p-2 rounded border border-white/5 flex justify-between">
                  <span className="font-mono text-gray-300">{t.token}</span>
                  <span className={t.used ? "text-red-400" : "text-emerald-400"}>{t.used ? "Used" : "Active"}</span>
                </div>
              ))}
            </div>
          </div>

          {departments.length >= 1 ? (
            <div className="glass-dark p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
                  <Building size={22} /> Active Department
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Configured</span>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Department Name</p>
                <p className="text-lg font-bold text-white mb-3">{departments[0].name}</p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Department Code</p>
                <p className="text-md font-mono text-emerald-300 font-bold">{departments[0].code}</p>
              </div>
            </div>
          ) : (
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Building className="text-pink-400" /> New Department</h3>
              <form onSubmit={createDepartment} className="space-y-3">
                <input type="text" required placeholder="Name (e.g. Computer Science)" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm" />
                <input type="text" required placeholder="Code (e.g. CS)" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm" />
                <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 rounded-lg text-sm">Add Department</button>
              </form>
            </div>
          )}

          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpen className="text-blue-400" /> New Subject</h3>
            <form onSubmit={createSubject} className="space-y-3">
              <select required value={subjectForm.departmentId} onChange={e => setSubjectForm({...subjectForm, departmentId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="text" required placeholder="Subject Name (e.g. Physics)" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm" />
              <input type="text" required placeholder="Subject Code (e.g. PHY101)" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm" />
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-sm">Add Subject</button>
            </form>
            
            {/* Created Subjects list inside the Card */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="font-semibold text-gray-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                Created Subjects ({subjects.length})
              </h4>
              {subjects.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No subjects created yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {subjects.map(sub => (
                    <div key={sub.id} className="text-xs bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center hover:border-white/10 transition-colors">
                      <div>
                        <p className="font-bold text-white">{sub.name}</p>
                        <p className="text-[10px] text-blue-400 font-mono mt-0.5">{sub.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 font-medium uppercase font-mono">
                          {sub.department?.code || "CS"}
                        </span>
                        <button 
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition"
                          title="Delete Subject"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Existing Entities */}
        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Users className="text-indigo-400" /> New Class Section</h3>
            <form onSubmit={createSection} className="space-y-3 mb-6">
              <div className="flex gap-2">
                <input type="text" required placeholder="Section Name (e.g. CS-A)" value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm" />
                <select required value={sectionForm.year} onChange={e => setSectionForm({...sectionForm, year: e.target.value})} className="w-24 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm">
                  <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm">Add Section</button>
            </form>

            <h4 className="font-semibold text-gray-300 mb-2">Existing Sections (Give IDs to Students)</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sections.map(s => (
                <div key={s.id} className="text-sm bg-black/40 p-3 rounded border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{s.name} (Yr {s.year})</span>
                    <button 
                      onClick={() => handleDeleteSection(s.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition"
                      title="Delete Section"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <span className="font-mono text-xs text-indigo-400 break-all select-all">{s.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Clock className="text-orange-400" /> Pending Teacher Approvals</h3>
            {pendingTeachers.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending approvals.</p>
            ) : (
              <div className="space-y-3">
                {pendingTeachers.map(t => (
                  <div key={t.id} className="bg-black/40 p-3 rounded border border-orange-500/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-white">{t.user.firstName} {t.user.lastName}</p>
                      <p className="text-xs text-gray-400">{t.user.email}</p>
                    </div>
                    <button onClick={() => approveTeacher(t.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition">
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Modals Section */}
      {activeModal === "TEACHERS" && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }} 
            animate={{ scale: 1, y: 0 }} 
            className="w-full max-w-2xl glass-dark p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            <button 
              onClick={() => {
                setActiveModal(null);
                setExpandedTeacherId(null);
              }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
            >
              &times;
            </button>
            
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-purple-400">
              <Users size={26} /> Active Department Staff ({teachers.length})
            </h3>
            <p className="text-sm text-gray-400 mb-6">List of approved teachers. Click 'Set Timetable' to manage their class slots.</p>
            
            {teachers.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-8 text-center bg-black/20 rounded-xl border border-white/5">No active teachers registered yet.</p>
            ) : (
              <div className="space-y-4">
                {teachers.map(t => (
                  <div key={t.id} className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-purple-500/20">
                    {/* Header Row */}
                    <div className="p-4 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                      <div>
                        <p className="font-bold text-white text-base">{t.user?.firstName} {t.user?.lastName}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{t.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase tracking-wider font-mono">
                          {t.department?.code || "CS Staff"}
                        </span>
                        <button 
                          onClick={() => {
                            setExpandedTeacherId(expandedTeacherId === t.id ? null : t.id);
                            if (subjects.length > 0 && !timetableForm.subjectId) {
                              setTimetableForm(prev => ({ ...prev, subjectId: subjects[0].id }));
                            }
                            if (sections.length > 0 && !timetableForm.sectionId) {
                              setTimetableForm(prev => ({ ...prev, sectionId: sections[0].id }));
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                            expandedTeacherId === t.id 
                              ? "bg-purple-500 text-white border-purple-500/30" 
                              : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {expandedTeacherId === t.id ? "Hide Timetable" : "Set Timetable"}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Panel */}
                    {expandedTeacherId === t.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-5 border-t border-white/5 bg-black/30 space-y-6"
                      >
                        {/* 1. Add Slot Form */}
                        <div className="border border-white/5 bg-black/40 p-4 rounded-xl space-y-4">
                          <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} /> Add Class Slot
                          </h4>
                          
                          <form onSubmit={(e) => handleAssignTimetable(e, t.id)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Subject</label>
                                <select 
                                  required
                                  value={timetableForm.subjectId}
                                  onChange={e => setTimetableForm({ ...timetableForm, subjectId: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                  {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id} className="bg-dark text-white text-xs">{sub.name} ({sub.code})</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Section / Class</label>
                                <select 
                                  required
                                  value={timetableForm.sectionId}
                                  onChange={e => setTimetableForm({ ...timetableForm, sectionId: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                  {sections.map(sec => (
                                    <option key={sec.id} value={sec.id} className="bg-dark text-white text-xs">{sec.name} (Year {sec.year})</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Day of Week</label>
                                <select 
                                  required
                                  value={timetableForm.dayOfWeek}
                                  onChange={e => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                  <option value="1" className="bg-dark text-white text-xs">Monday</option>
                                  <option value="2" className="bg-dark text-white text-xs">Tuesday</option>
                                  <option value="3" className="bg-dark text-white text-xs">Wednesday</option>
                                  <option value="4" className="bg-dark text-white text-xs">Thursday</option>
                                  <option value="5" className="bg-dark text-white text-xs">Friday</option>
                                  <option value="6" className="bg-dark text-white text-xs">Saturday</option>
                                  <option value="0" className="bg-dark text-white text-xs">Sunday</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Start Time</label>
                                <input 
                                  type="time" required
                                  value={timetableForm.startTime}
                                  onChange={e => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">End Time</label>
                                <input 
                                  type="time" required
                                  value={timetableForm.endTime}
                                  onChange={e => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-lg"
                            >
                              Add Class Slot
                            </button>
                          </form>
                        </div>

                        {/* 2. Existing Timetable Slots */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            Assigned Slots ({timetables.filter(item => item.teacherId === t.id).length})
                          </h4>
                          
                          {timetables.filter(item => item.teacherId === t.id).length === 0 ? (
                            <p className="text-gray-400 text-xs italic py-4 text-center bg-black/20 rounded-xl border border-white/5">
                              No class slots scheduled for this teacher yet.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                              {timetables
                                .filter(item => item.teacherId === t.id)
                                .map(slot => (
                                  <div key={slot.id} className="text-xs bg-black/40 p-3.5 rounded-xl border border-white/5 flex justify-between items-center hover:border-white/10 transition-colors">
                                    <div>
                                      <p className="font-bold text-white text-sm">{slot.subject?.name} ({slot.subject?.code})</p>
                                      <p className="text-[11px] text-gray-400 mt-1 font-sans">
                                        Section: <strong className="text-gray-300">{slot.section?.name} (Yr {slot.section?.year})</strong>
                                      </p>
                                      <p className="text-[10px] text-purple-400 font-mono mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {days[slot.dayOfWeek]} {slot.startTime} - {slot.endTime}
                                      </p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteTimetable(slot.id)}
                                      className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition"
                                      title="Delete Slot"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeModal === "STUDENTS" && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }} 
            animate={{ scale: 1, y: 0 }} 
            className="w-full max-w-3xl glass-dark p-8 rounded-3xl border border-blue-500/30 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
            >
              &times;
            </button>
            
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-blue-400">
              <Users size={26} /> Enrolled Students List ({students.length})
            </h3>
            <p className="text-sm text-gray-400 mb-6">Directory of students registered in the system, grouped by their Academic Year and Class Section.</p>
            
            {students.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-8 text-center bg-black/20 rounded-xl border border-white/5">No students enrolled yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  students.reduce((acc: Record<string, any[]>, student) => {
                    const yearText = `Year ${student.year}`;
                    const sectionText = student.section?.name || "Unassigned Section";
                    const key = `${yearText} - ${sectionText}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(student);
                    return acc;
                  }, {})
                ).map(([groupKey, groupStudents]) => (
                  <div key={groupKey} className="border border-white/5 bg-black/20 rounded-2xl p-5">
                    <h4 className="text-md font-bold text-blue-300 mb-3 border-b border-white/5 pb-2 uppercase tracking-wide flex justify-between">
                      <span>{groupKey}</span>
                      <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full">{groupStudents.length} Students</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {groupStudents.map(s => (
                        <div key={s.id} className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-blue-500/20 transition-all">
                          <div>
                            <p className="font-bold text-white text-sm">{s.user?.firstName} {s.user?.lastName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{s.user?.email}</p>
                            <p className="text-[10px] text-gray-500 mt-1.5 font-sans">
                              Roll: <strong className="text-gray-300 font-mono">{s.rollNumber}</strong>
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                            s.faceRegistered 
                              ? "bg-teal-500/10 text-teal-300 border-teal-500/20" 
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse"
                          }`}>
                            {s.faceRegistered ? "Biometric OK" : "Biometric Req"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}

function StatCard({ icon, title, value, color, subtitle }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className="glass-dark p-6 rounded-2xl border border-white/10 flex items-center gap-4 h-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-colors pointer-events-none" />
      <div className={`p-4 rounded-xl bg-white/5 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
