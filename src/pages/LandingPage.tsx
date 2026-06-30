import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { CommunityHealthScore } from '../components/CommunityHealthScore';
import { Shield, Zap, Activity, Users, BarChart3, ChevronRight, Map, Camera, FileCheck2, ArrowRight, Sparkles } from 'lucide-react';

export function LandingPage() {
  const { setActiveTab, issues } = useApp();
  
  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    active: new Set(issues.map(i => i.reporterId)).size * 47,
    rate: issues.length > 0 ? Math.round((issues.filter(i => i.status === 'Resolved').length / issues.length) * 100) : 0,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-16 pb-20 pt-8">
      
      {/* Hero Section */}
      <section className="relative text-center px-4 min-h-[60vh] flex flex-col items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] max-w-md max-h-md bg-indigo-500/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[25vw] h-[25vw] max-w-sm max-h-sm bg-purple-500/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-4 h-4 text-indigo-400" /> AI-Powered Civic Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.1]">
            Your Community.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 animate-gradient bg-[length:200%_auto]">
              Your Voice. Your Hero.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Report local issues instantly, track resolutions in real-time, and join thousands of citizens making your city a better place to live.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setActiveTab('report')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" /> Report an Issue
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className="w-full sm:w-auto px-8 py-4 glass-panel hover:bg-slate-800/80 text-white font-bold rounded-full transition-all border border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2"
            >
              <Map className="w-5 h-5" /> Explore Map
            </button>
          </div>
        </motion.div>
      </section>

      {/* Live Stats */}
      <section className="px-6 relative z-10 space-y-6">
        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-5xl mx-auto">
          <CommunityHealthScore issues={issues} />
        </motion.div>
        
        <motion.div 
          variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="glass-panel p-6 md:p-8 rounded-3xl max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-white/5"
        >
          <motion.div variants={itemVariants}>
            <div className="text-4xl font-bold text-white mb-2">{stats.total}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Issues Reported</div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="text-4xl font-bold text-emerald-400 mb-2">{stats.resolved}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Issues Resolved</div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="text-4xl font-bold text-indigo-400 mb-2">{stats.active}+</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Citizens</div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="text-4xl font-bold text-purple-400 mb-2">{stats.rate}%</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Resolution Rate</div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-12 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-16">How It Works</h2>
        
        <motion.div 
          variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid md:grid-cols-4 gap-8 relative"
        >
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-8 left-1/8 right-1/8 h-0.5 bg-slate-800 -z-10"></div>
          
          {[
            { icon: Camera, title: "Capture", desc: "Snap a photo of the issue", color: "from-blue-500 to-cyan-500" },
            { icon: Zap, title: "AI Analysis", desc: "Gemini auto-categorizes", color: "from-purple-500 to-pink-500" },
            { icon: FileCheck2, title: "Verification", desc: "Community validates", color: "from-amber-500 to-orange-500" },
            { icon: Shield, title: "Resolution", desc: "Authorities take action", color: "from-emerald-500 to-teal-500" }
          ].map((step, i) => (
            <motion.div key={i} variants={itemVariants} className="relative">
              <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mini Map */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="glass-panel p-6 rounded-3xl overflow-hidden border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Map className="text-indigo-400" /> Live Issue Map
            </h2>
            <button 
              onClick={() => setActiveTab('map')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View Full Map <ArrowRight size={16} />
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <LeafletMap issues={issues.slice(0, 10)} height="300px" zoom={12} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Zap, title: "AI-Powered Detection", desc: "Upload an image and let Gemini automatically categorize the issue, assess severity, and draft a description." },
            { icon: Activity, title: "Real-Time Tracking", desc: "Follow the lifecycle of reported issues with our live timelines and push notifications." },
            { icon: Users, title: "Community Verification", desc: "Ensure data quality by letting neighbors verify reported issues, earning civic points in return." },
            { icon: BarChart3, title: "Impact Analytics", desc: "Authorities get deep insights into problem hotspots, departmental efficiency, and resolution times." }
          ].map((feat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="glass-panel p-8 rounded-3xl h-full hover:bg-slate-800/80 transition-colors border border-slate-700/50 group">
                <feat.icon className="w-10 h-10 text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-4">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 max-w-4xl mx-auto text-center">
        <div className="p-12 rounded-[3rem] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to be a Community Hero?</h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
              Join the movement. Report issues, verify claims, earn badges, and make a real impact in your neighborhood.
            </p>
            <button 
              onClick={() => setActiveTab('auth')}
              className="px-10 py-4 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all text-lg"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
