"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Camera, ShieldCheck, BarChart3, Users, GraduationCap, Building, User, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#060913] text-white">
      
      {/* Water Droplet Ambient Light Waves */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none animate-water-pulse" />
      <div className="absolute top-[35%] -right-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-water-pulse" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Water Drop Navbar */}
      <nav className="w-full flex justify-between items-center px-6 sm:px-12 py-5 z-20 bg-[#070B16]/80 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-sky-400/20 to-blue-600/20 border border-sky-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <img src="/logo.png" alt="Attendify Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Attendify
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block shadow-[0_0_8px_#38BDF8]"></span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#portals" className="text-sm font-medium text-slate-300 hover:text-white transition">Portals</Link>
          <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition">Features</Link>
          <Link href="/auth/login" className="text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-16 z-10 text-center max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs font-semibold tracking-wider uppercase shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Sparkles size={14} className="text-sky-400" />
            Next-Gen Facial Recognition Attendance
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight text-white leading-tight">
            Seamless Attendance. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300">
              Zero Proxy. Pure Speed.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate manual roll calls. Capture high-speed classroom group scans and verify attendance instantly with intelligent face recognition.
          </p>
        </motion.div>

        {/* Role Portals Section */}
        <motion.div 
          id="portals"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleWindowPane 
              title="Student Portal"
              icon={<User size={32} className="text-sky-400" />}
              desc="Register facial biometric, check individual subject attendance, and track real-time statistics."
              roleName="Student"
            />
            <RoleWindowPane 
              title="Teacher Portal"
              icon={<GraduationCap size={32} className="text-sky-400" />}
              desc="Trigger live classroom scans, manage course timetables, and download instant attendance reports."
              roleName="Teacher"
              featured={true}
            />
            <RoleWindowPane 
              title="Admin Dashboard"
              icon={<Building size={32} className="text-sky-400" />}
              desc="Manage departments, register faculties, dispatch invite tokens, and oversee university metrics."
              roleName="Admin"
            />
          </div>
        </motion.div>
      </main>

      {/* Feature Section */}
      <section id="features" className="z-10 py-16 bg-[#04060D] border-t border-white/10 w-full">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">Built for Unmatched Accuracy & Speed</h2>
            <p className="text-slate-400 text-sm mt-1">Enterprise-grade attendance workflows designed for high density classrooms</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={<Camera size={24} className="text-sky-400" />} title="Live Crowd Scan" desc="Detects and identifies multiple student faces in a single classroom shot." />
            <FeatureCard icon={<ShieldCheck size={24} className="text-sky-400" />} title="Anti-Spoofing" desc="Advanced liveness algorithms prevent proxy or photo-based trickery." />
            <FeatureCard icon={<BarChart3 size={24} className="text-sky-400" />} title="Smart Analytics" desc="Automated shortfall alerts and detailed class performance graphs." />
            <FeatureCard icon={<Users size={24} className="text-sky-400" />} title="Role-Based" desc="Clean, isolated workspaces tailored specifically for students, staff, and admin." />
          </div>
        </div>
      </section>

    </div>
  );
}

function RoleWindowPane({ title, icon, desc, featured }: any) {
  return (
    <motion.div 
      whileHover={{ y: -6 }}
      className={`water-pane water-pane-hover p-8 flex flex-col items-center text-center relative overflow-hidden ${
        featured ? 'ring-1 ring-sky-500/30' : ''
      }`}
    >
      {/* Top light reflection */}
      <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none" />

      <div className="mb-5 w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-500/20 to-blue-600/10 border border-sky-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.2)]">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed flex-grow">{desc}</p>
      
      <div className="w-full flex gap-3 mt-auto">
        <Link href="/auth/login" className="flex-1 py-3 rounded-xl font-semibold btn-water text-sm flex items-center justify-center gap-1.5">
          <span>Login</span>
          <ArrowRight size={14} />
        </Link>
        <Link href="/auth/register" className="flex-1 py-3 rounded-xl font-semibold text-white text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center">
          Register
        </Link>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="water-card p-6 border border-white/10 bg-[#0A0F1D]/60 hover:border-sky-500/30 transition-all">
      <div className="mb-4 w-11 h-11 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
