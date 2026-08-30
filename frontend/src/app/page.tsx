"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Camera, ShieldCheck, BarChart3, Users, GraduationCap, Building, User, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#FFFFFF] text-black">
      
      {/* Subtle macOS Liquid Ambient Lighting */}
      <div className="absolute -top-32 left-1/3 w-[650px] h-[650px] bg-sky-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] -right-20 w-[550px] h-[550px] bg-blue-50/70 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-10 w-[500px] h-[500px] bg-slate-100/80 rounded-full blur-[130px] pointer-events-none" />

      {/* Mac Translucent Navbar */}
      <nav className="w-full flex justify-between items-center px-6 sm:px-12 py-4 z-30 bg-white/70 backdrop-blur-2xl border-b border-black/[0.06] sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Attendify Logo" className="w-6 h-6 object-contain invert brightness-0" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-black flex items-center gap-1.5">
            Attendify
            <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] inline-block"></span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#portals" className="text-sm font-medium text-neutral-600 hover:text-black transition">Portals</Link>
          <Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-black transition">Features</Link>
          <Link 
            href="/auth/login" 
            className="text-xs uppercase tracking-wider font-bold px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-16 z-10 text-center max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl"
        >
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.08] text-neutral-700 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse"></span>
            Smart Facial Recognition Attendance
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-black mb-6 tracking-tight text-black leading-[1.05]">
            Meet <span className="text-black underline decoration-[#0071E3]/40 decoration-wavy decoration-2">Attendify</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-neutral-600 mb-12 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate manual roll calls and proxy attendance. Capture group photos to mark attendance instantly using state-of-the-art facial recognition.
          </p>
        </motion.div>

        {/* Mac Water Window Panes (Portals) */}
        <motion.div 
          id="portals"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="w-full mt-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MacWindowPane 
              title="Student Portal"
              icon={<User size={26} className="text-black" />}
              desc="Register facial biometric, check individual subject attendance, and track real-time statistics."
            />
            <MacWindowPane 
              title="Teacher Portal"
              icon={<GraduationCap size={26} className="text-black" />}
              desc="Start live class scanning, generate QR codes, and manage your timetables and records."
              featured={true}
            />
            <MacWindowPane 
              title="Admin Dashboard"
              icon={<Building size={26} className="text-black" />}
              desc="Monitor university-wide statistics, manage departments, and oversee institutional operations."
            />
          </div>
        </motion.div>
      </main>

      {/* Feature Section */}
      <section id="features" className="z-10 py-16 bg-[#F5F5F7]/80 border-t border-black/[0.06] w-full">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-black tracking-tight">Simple, Clean & Fast</h2>
            <p className="text-neutral-500 text-sm mt-1">Built with high accuracy for modern educational institutions</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={<Camera size={22} className="text-black" />} title="Live Crowd Scan" desc="Detects multiple faces in a single classroom shot." />
            <FeatureCard icon={<ShieldCheck size={22} className="text-black" />} title="Anti-Spoofing" desc="Advanced liveness detection prevents proxy attendance." />
            <FeatureCard icon={<BarChart3 size={22} className="text-black" />} title="Smart Analytics" desc="Automated reports and low-attendance warnings." />
            <FeatureCard icon={<Users size={22} className="text-black" />} title="Role-Based" desc="Dedicated secure portals tailored for every user." />
          </div>
        </div>
      </section>

    </div>
  );
}

function MacWindowPane({ title, icon, desc, featured }: any) {
  return (
    <motion.div 
      whileHover={{ y: -6 }}
      className={`mac-window mac-window-hover p-6 sm:p-7 flex flex-col text-left relative overflow-hidden ${
        featured ? 'ring-2 ring-black/10 shadow-mac-window' : ''
      }`}
    >
      {/* Mac Window Title Bar & Dots */}
      <div className="flex items-center justify-between pb-5 border-b border-black/[0.06] mb-6">
        <div className="mac-dots">
          <span className="mac-dot mac-dot-close" />
          <span className="mac-dot mac-dot-min" />
          <span className="mac-dot mac-dot-max" />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Window Pane
        </div>
      </div>

      <div className="mb-4 w-12 h-12 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center shadow-sm">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-black mb-2 tracking-tight">{title}</h3>
      <p className="text-neutral-600 text-sm mb-7 leading-relaxed flex-grow">{desc}</p>
      
      <div className="w-full flex gap-2.5 mt-auto">
        <Link 
          href="/auth/login" 
          className="flex-1 py-2.5 rounded-xl font-semibold btn-high-black text-xs flex items-center justify-center gap-1.5 text-white"
        >
          <span>Login</span>
          <ArrowRight size={13} />
        </Link>
        <Link 
          href="/auth/register" 
          className="flex-1 py-2.5 rounded-xl font-semibold text-black text-xs bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] transition flex items-center justify-center"
        >
          Register
        </Link>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="mac-card p-5 border border-black/[0.06] bg-white/80 hover:border-black/20 transition-all">
      <div className="mb-3 w-10 h-10 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-black mb-1">{title}</h3>
      <p className="text-neutral-600 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
