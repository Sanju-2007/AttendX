"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Camera, ShieldCheck, BarChart3, Users, GraduationCap, Building, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark text-white">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center p-6 z-10 glass-dark border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-1 rounded-lg border border-primary/30 flex items-center justify-center w-10 h-10 overflow-hidden">
            <img src="/logo.png" alt="Attendify Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Attendify
          </span>
        </div>
        <div className="hidden md:flex gap-6">
          <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
          <Link href="#portals" className="text-gray-300 hover:text-white transition">Portals</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 z-10 text-center mt-12 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full glass border border-primary/30 text-primary-light text-sm font-semibold tracking-wide">
            🚀 The Future of Classroom Management
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-tight">
            Meet <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Attendify</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Eliminate manual roll calls and proxy attendance. Capture group photos to mark attendance instantly using state-of-the-art facial recognition.
          </p>
        </motion.div>

        {/* Role Portals Section */}
        <motion.div 
          id="portals"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="w-full max-w-6xl mt-8"
        >
          <h2 className="text-2xl font-semibold text-gray-300 mb-8 tracking-widest uppercase">Select Your Portal</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RoleCard 
              title="Student Portal"
              icon={<User size={40} className="text-emerald-400" />}
              desc="Register your face biometric, track your attendance, and view real-time alerts."
              color="emerald"
            />
            <RoleCard 
              title="Teacher Portal"
              icon={<GraduationCap size={40} className="text-blue-400" />}
              desc="Start live class scanning, generate QR codes, and manage your timetables."
              color="blue"
            />
            <RoleCard 
              title="Admin Dashboard"
              icon={<Building size={40} className="text-purple-400" />}
              desc="Monitor university-wide statistics, manage departments, and oversee operations."
              color="purple"
            />
          </div>
        </motion.div>
      </main>

      {/* Feature Section */}
      <section id="features" className="z-10 py-20 bg-black/40 border-t border-white/5 w-full">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<Camera size={28} className="text-blue-400" />} title="Live Crowd Scan" desc="Detects multiple faces in a single classroom shot." />
            <FeatureCard icon={<ShieldCheck size={28} className="text-green-400" />} title="Anti-Spoofing" desc="Advanced liveness detection prevents proxy attendance." />
            <FeatureCard icon={<BarChart3 size={28} className="text-purple-400" />} title="Smart Analytics" desc="Automated reports and low-attendance warnings." />
            <FeatureCard icon={<Users size={28} className="text-pink-400" />} title="Role-Based" desc="Secure, isolated portals tailored for every user." />
          </div>
        </div>
      </section>

    </div>
  );
}

function RoleCard({ title, icon, desc, color }: any) {
  const colorMap: any = {
    emerald: "from-emerald-500/20 to-emerald-900/20 border-emerald-500/30 hover:border-emerald-400 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]",
    blue: "from-blue-500/20 to-blue-900/20 border-blue-500/30 hover:border-blue-400 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    purple: "from-purple-500/20 to-purple-900/20 border-purple-500/30 hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
  };

  const btnMap: any = {
    emerald: "bg-emerald-500 hover:bg-emerald-400",
    blue: "bg-blue-600 hover:bg-blue-500",
    purple: "bg-purple-600 hover:bg-purple-500"
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`relative group flex flex-col items-center text-center p-8 rounded-3xl border bg-gradient-to-b ${colorMap[color]} backdrop-blur-xl transition-all duration-300`}
    >
      <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 mb-8 leading-relaxed flex-grow">{desc}</p>
      
      <div className="w-full flex gap-3 mt-auto">
        <Link href="/auth/login" className={`flex-1 py-3 rounded-xl font-semibold text-white transition shadow-lg ${btnMap[color]}`}>
          Login
        </Link>
        <Link href="/auth/register" className="flex-1 py-3 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition">
          Register
        </Link>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="mb-4 bg-black/50 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function ScanFaceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-light">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <path d="M9 9h.01"></path>
      <path d="M15 9h.01"></path>
    </svg>
  );
}
