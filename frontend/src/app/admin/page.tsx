"use client";
import { motion } from "framer-motion";
import { Users, BookOpen, Key, Building, CheckCircle, Clock, Trash2, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { getApiUrl } from "../../lib/api";
import ProfileModal from "../../components/ProfileModal";

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
        
        if (data.departments && data.departments.length > 0) {
          setSubjectForm(prev => ({ ...prev, departmentId: data.departments[0].id }));
        }

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
        alert(`New Teacher Token Generated:\n\n${data.token}\n\nCopy this and give it to the teacher!`);
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
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to assign slot");
      }
    } catch (err) {
      alert("Error assigning timetable slot");
    }
  };

  const handleDeleteTimetable = async (timetableId: string) => {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/timetables/${timetableId}`), {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        alert("Timetable slot removed!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to remove slot");
      }
    } catch (err) {
      alert("Error removing timetable slot");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will delete all scheduled timetable slots and attendance records associated with it!")) return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
        Loading Admin Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-7xl mx-auto text-black relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-5 border-b border-black/[0.06]">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Admin Portal</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage departments, subjects, sections, and staff directory</p>
        </div>
        <ProfileModal onProfileUpdate={fetchAdminData} />
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div onClick={() => setActiveModal("STUDENTS")} className="cursor-pointer">
          <StatCard icon={<Users size={20} />} title="Total Students" value={stats.totalStudents} subtitle="Click to view list by Year & Section" />
        </div>
        <div onClick={() => setActiveModal("TEACHERS")} className="cursor-pointer">
          <StatCard icon={<Users size={20} />} title="Total Teachers" value={stats.totalTeachers} subtitle="Click to view department staff directory" />
        </div>
        <StatCard icon={<Building size={20} />} title="Departments" value={stats.totalDepartments} subtitle="Active academic departments" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">
        
        {/* Left Column: Teacher Access & Subject/Department Creation */}
        <div className="space-y-7">
          
          {/* Teacher Invite Token Card */}
          <div className="mac-window p-7 rounded-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
              <div className="mac-dots">
                <span className="mac-dot mac-dot-close" />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">Access Token</span>
            </div>

            <h3 className="text-base font-bold text-black mb-1 flex items-center gap-2">
              <Key size={18} className="text-black" /> Teacher Invite Tokens
            </h3>
            <p className="text-xs text-neutral-500 mb-4">Generate secret registration tokens for new faculty members.</p>

            <button 
              onClick={generateToken} 
              className="w-full btn-high-black py-2.5 px-4 rounded-xl text-xs font-bold mb-4"
            >
              Generate New Teacher Token
            </button>

            <div className="max-h-36 overflow-y-auto space-y-2">
              {inviteTokens.length === 0 ? (
                <p className="text-xs text-neutral-400 italic text-center py-2">No tokens generated yet.</p>
              ) : (
                inviteTokens.slice(0, 6).map(t => (
                  <div key={t.id} className="text-xs bg-black/[0.03] p-2.5 rounded-xl border border-black/[0.06] flex justify-between items-center">
                    <span className="font-mono text-black select-all font-semibold">{t.token}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      t.used ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {t.used ? "Used" : "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department Card */}
          {departments.length >= 1 ? (
            <div className="mac-window p-7 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <Building size={18} /> Active Department
                </h3>
                <span className="text-[10px] bg-black/[0.04] text-black border border-black/10 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Configured
                </span>
              </div>
              <div className="bg-black/[0.03] p-4 rounded-2xl border border-black/[0.06]">
                <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">Department Name</p>
                <p className="text-base font-bold text-black mb-3">{departments[0].name}</p>
                <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">Department Code</p>
                <p className="text-sm font-mono text-black font-bold">{departments[0].code}</p>
              </div>
            </div>
          ) : (
            <div className="mac-window p-7 rounded-3xl">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                <Building size={18} /> Add New Department
              </h3>
              <form onSubmit={createDepartment} className="space-y-3">
                <input 
                  type="text" required placeholder="Department Name (e.g. Computer Science)" 
                  value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} 
                  className="w-full glass-input py-2.5 px-3 text-xs" 
                />
                <input 
                  type="text" required placeholder="Department Code (e.g. CS)" 
                  value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} 
                  className="w-full glass-input py-2.5 px-3 text-xs" 
                />
                <button type="submit" className="w-full btn-high-black py-2.5 rounded-xl text-xs font-bold">
                  Add Department
                </button>
              </form>
            </div>
          )}

          {/* Subjects Card */}
          <div className="mac-window p-7 rounded-3xl">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <BookOpen size={18} /> Course Subjects
            </h3>
            <form onSubmit={createSubject} className="space-y-3 mb-6">
              <select 
                required value={subjectForm.departmentId} 
                onChange={e => setSubjectForm({...subjectForm, departmentId: e.target.value})} 
                className="w-full glass-input py-2.5 px-3 text-xs cursor-pointer"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input 
                type="text" required placeholder="Subject Name (e.g. Operating Systems)" 
                value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} 
                className="w-full glass-input py-2.5 px-3 text-xs" 
              />
              <input 
                type="text" required placeholder="Subject Code (e.g. CS301)" 
                value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} 
                className="w-full glass-input py-2.5 px-3 text-xs" 
              />
              <button type="submit" className="w-full btn-high-black py-2.5 rounded-xl text-xs font-bold">
                Add Subject
              </button>
            </form>
            
            {/* Created Subjects list */}
            <div className="pt-4 border-t border-black/[0.06]">
              <h4 className="font-bold text-black mb-3 text-xs uppercase tracking-wider">
                Existing Subjects ({subjects.length})
              </h4>
              {subjects.length === 0 ? (
                <p className="text-neutral-400 text-xs italic">No subjects created yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {subjects.map(sub => (
                    <div key={sub.id} className="text-xs bg-black/[0.03] p-3 rounded-xl border border-black/[0.06] flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black">{sub.name}</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{sub.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/[0.04] text-neutral-600 border border-black/[0.06] font-mono">
                          {sub.department?.code || "CS"}
                        </span>
                        <button 
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete Subject"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sections and Approvals */}
        <div className="space-y-7">
          
          {/* Class Sections Card */}
          <div className="mac-window p-7 rounded-3xl">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <Users size={18} /> New Class Section
            </h3>
            <form onSubmit={createSection} className="space-y-3 mb-6">
              <div className="flex gap-2">
                <input 
                  type="text" required placeholder="Section Name (e.g. CS-A)" 
                  value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} 
                  className="flex-1 glass-input py-2.5 px-3 text-xs" 
                />
                <select 
                  required value={sectionForm.year} 
                  onChange={e => setSectionForm({...sectionForm, year: e.target.value})} 
                  className="w-24 glass-input py-2.5 px-3 text-xs cursor-pointer"
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-high-black py-2.5 rounded-xl text-xs font-bold">
                Add Section
              </button>
            </form>

            <h4 className="font-bold text-black mb-3 text-xs uppercase tracking-wider">
              Existing Sections ({sections.length})
            </h4>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {sections.length === 0 ? (
                <p className="text-neutral-400 text-xs italic">No sections created yet.</p>
              ) : (
                sections.map(s => (
                  <div key={s.id} className="text-xs bg-black/[0.03] p-3 rounded-xl border border-black/[0.06] flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-black">{s.name} (Year {s.year})</span>
                      <button 
                        onClick={() => handleDeleteSection(s.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete Section"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-500 break-all select-all">ID: {s.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Teacher Approvals */}
          <div className="mac-window p-7 rounded-3xl">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <Clock size={18} /> Pending Teacher Approvals
            </h3>
            {pendingTeachers.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-3 text-center bg-black/[0.02] rounded-xl border border-black/[0.04]">
                No pending teacher approvals.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingTeachers.map(t => (
                  <div key={t.id} className="bg-black/[0.03] p-3.5 rounded-2xl border border-black/[0.06] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-black">{t.user.firstName} {t.user.lastName}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">{t.user.email}</p>
                    </div>
                    <button 
                      onClick={() => approveTeacher(t.id)} 
                      className="btn-high-black px-3.5 py-1.5 rounded-xl text-xs font-bold"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Directory Modal */}
      {activeModal === "TEACHERS" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full max-w-2xl mac-window p-8 rounded-3xl relative max-h-[85vh] overflow-y-auto text-black"
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
              <div className="mac-dots">
                <span className="mac-dot mac-dot-close" onClick={() => { setActiveModal(null); setExpandedTeacherId(null); }} />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <button 
                onClick={() => { setActiveModal(null); setExpandedTeacherId(null); }} 
                className="text-neutral-400 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-black mb-1">Active Faculty Staff ({teachers.length})</h3>
            <p className="text-xs text-neutral-500 mb-6">List of approved teachers. Click 'Set Timetable' to schedule their classes.</p>
            
            {teachers.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-8 text-center bg-black/[0.02] rounded-2xl border border-black/[0.06]">
                No active teachers registered yet.
              </p>
            ) : (
              <div className="space-y-4">
                {teachers.map(t => (
                  <div key={t.id} className="bg-black/[0.02] rounded-2xl border border-black/[0.06] overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-sm">{t.user?.firstName} {t.user?.lastName}</p>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{t.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.04] text-black border border-black/10 font-bold uppercase font-mono">
                          {t.department?.code || "Staff"}
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
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                            expandedTeacherId === t.id 
                              ? "btn-high-black" 
                              : "bg-black/[0.04] text-black border border-black/10 hover:bg-black/[0.08]"
                          }`}
                        >
                          {expandedTeacherId === t.id ? "Hide Timetable" : "Set Timetable"}
                        </button>
                      </div>
                    </div>

                    {expandedTeacherId === t.id && (
                      <div className="p-4 bg-white/70 border-t border-black/[0.06] space-y-4">
                        <form onSubmit={(e) => handleAssignTimetable(e, t.id)} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <select 
                            required value={timetableForm.subjectId} 
                            onChange={e => setTimetableForm({...timetableForm, subjectId: e.target.value})}
                            className="glass-input py-2 px-2 text-xs"
                          >
                            <option value="">Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                          </select>
                          <select 
                            required value={timetableForm.sectionId} 
                            onChange={e => setTimetableForm({...timetableForm, sectionId: e.target.value})}
                            className="glass-input py-2 px-2 text-xs"
                          >
                            <option value="">Section</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <select 
                            value={timetableForm.dayOfWeek} 
                            onChange={e => setTimetableForm({...timetableForm, dayOfWeek: e.target.value})}
                            className="glass-input py-2 px-2 text-xs"
                          >
                            {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                          <div className="flex gap-1">
                            <input 
                              type="time" value={timetableForm.startTime} 
                              onChange={e => setTimetableForm({...timetableForm, startTime: e.target.value})} 
                              className="w-1/2 glass-input py-1.5 px-1 text-[11px]" 
                            />
                            <input 
                              type="time" value={timetableForm.endTime} 
                              onChange={e => setTimetableForm({...timetableForm, endTime: e.target.value})} 
                              className="w-1/2 glass-input py-1.5 px-1 text-[11px]" 
                            />
                          </div>
                          <button type="submit" className="col-span-2 sm:col-span-4 btn-high-black py-2 rounded-xl text-xs font-bold">
                            Save Timetable Slot
                          </button>
                        </form>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Assigned Classes</p>
                          {timetables.filter(tm => tm.teacherId === t.id).length === 0 ? (
                            <p className="text-neutral-400 text-xs italic">No slots scheduled yet.</p>
                          ) : (
                            timetables.filter(tm => tm.teacherId === t.id).map(tm => (
                              <div key={tm.id} className="bg-black/[0.03] p-2.5 rounded-xl border border-black/[0.06] flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-black">{tm.subject?.name}</span>
                                  <span className="text-neutral-500 font-mono text-[11px] ml-2">
                                    ({tm.section?.name}) - {days[tm.dayOfWeek]} {tm.startTime}-{tm.endTime}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTimetable(tm.id)}
                                  className="text-neutral-400 hover:text-red-600 p-1 rounded transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Students Directory Modal */}
      {activeModal === "STUDENTS" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full max-w-3xl mac-window p-8 rounded-3xl relative max-h-[85vh] overflow-y-auto text-black"
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
              <div className="mac-dots">
                <span className="mac-dot mac-dot-close" onClick={() => setActiveModal(null)} />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="text-neutral-400 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-black mb-1">Enrolled Students ({students.length})</h3>
            <p className="text-xs text-neutral-500 mb-6">Directory of students registered in the system, grouped by Year & Class Section.</p>
            
            {students.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-8 text-center bg-black/[0.02] rounded-2xl border border-black/[0.06]">
                No students enrolled yet.
              </p>
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
                  <div key={groupKey} className="border border-black/[0.06] bg-black/[0.02] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/[0.06]">
                      <span className="font-bold text-black text-sm">{groupKey}</span>
                      <span className="text-[10px] bg-black/[0.04] text-black font-bold px-2 py-0.5 rounded-full border border-black/10">
                        {groupStudents.length} Students
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupStudents.map(s => (
                        <div key={s.id} className="bg-white/80 p-3.5 rounded-xl border border-black/[0.06] flex justify-between items-center">
                          <div>
                            <p className="font-bold text-black text-xs">{s.user?.firstName} {s.user?.lastName}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">{s.user?.email}</p>
                            <p className="text-[10px] text-neutral-600 mt-1 font-mono">
                              Roll: <strong className="text-black">{s.rollNumber}</strong>
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                            s.faceRegistered 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                              : "bg-amber-50 text-amber-600 border-amber-200"
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
        </div>
      )}

    </div>
  );
}

function StatCard({ icon, title, value, subtitle }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="mac-card p-6 flex items-center gap-4 h-full">
      <div className="w-12 h-12 rounded-2xl bg-black/[0.04] border border-black/10 flex items-center justify-center text-black shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-black">{value}</p>
        {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
