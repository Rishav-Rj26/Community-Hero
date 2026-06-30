import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Issue } from '../types';
import { HeartPulse, CheckCircle2, Users, AlertTriangle } from 'lucide-react';

export function CommunityHealthScore({ issues }: { issues: Issue[] }) {
  const stats = useMemo(() => {
    if (issues.length === 0) return { score: 100, resRate: 0, active: 0, criticalRatio: 0 };
    
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const resRate = resolved / issues.length;
    const active = new Set(issues.map(i => i.reporterId)).size;
    const criticals = issues.filter(i => i.severity === 'Critical').length;
    const criticalRatio = criticals / issues.length;
    
    // Formula: base 50 + (resRate * 30) + (min(active, 100) / 100 * 20) - (criticalRatio * 40)
    let computedScore = 50 + (resRate * 30) + (Math.min(active, 10) / 10 * 20) - (criticalRatio * 40);
    computedScore = Math.max(0, Math.min(100, Math.round(computedScore)));
    
    return { score: computedScore, resRate: Math.round(resRate * 100), active, criticalRatio: Math.round(criticalRatio * 100) };
  }, [issues]);

  const color = stats.score > 70 ? 'text-emerald-400' : stats.score > 40 ? 'text-amber-400' : 'text-rose-400';
  const strokeColor = stats.score > 70 ? '#34d399' : stats.score > 40 ? '#fbbf24' : '#fb7185';
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (stats.score / 100) * circumference;

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center gap-8 justify-center border border-slate-700/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
      
      {/* Gauge */}
      <div className="relative w-40 h-40 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
          <motion.circle 
            cx="50" cy="50" r="45" fill="none" 
            stroke={strokeColor} 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center shadow-inner rounded-full">
          <span className={`text-4xl font-black ${color}`}>{stats.score}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health</span>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="flex-1 w-full max-w-sm">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <HeartPulse className={color} /> Community Pulse
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2"><CheckCircle2 size={16} /> Resolution Rate</span>
            <span className="text-white font-bold">{stats.resRate}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.resRate}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-slate-400 flex items-center gap-2"><Users size={16} /> Active Reporters</span>
            <span className="text-white font-bold">{stats.active}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
            <span className="text-slate-400 flex items-center gap-2"><AlertTriangle size={16} /> Critical Issues</span>
            <span className="text-rose-400 font-bold">{stats.criticalRatio}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
