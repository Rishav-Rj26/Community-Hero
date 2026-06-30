import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { RechartsAnalytics } from '../components/RechartsAnalytics';
import { CommunityHealthScore } from '../components/CommunityHealthScore';
import { ShieldCheck, PlusCircle, Trophy, FileText, CheckCircle2, TrendingUp, Award, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ALL_BADGES } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';

export function CitizenDashboard() {
  const { user, issues, setActiveTab, navigateToIssue } = useApp();

  const userIssues = useMemo(() => user ? issues.filter(i => i.reporterId === user.id) : [], [issues, user]);
  const resolvedIssuesCount = useMemo(() => userIssues.filter(i => i.status === 'Resolved').length, [userIssues]);
  const recentIssues = useMemo(() => userIssues.slice(0, 5), [userIssues]);

  if (!user) return null;

  const level = Math.floor(user.points / 100) + 1;
  const progressToNext = user.points % 100;

  const stats = [
    { label: 'My Reports', value: user.issuesReported, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Issues Resolved', value: resolvedIssuesCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Civic Points', value: user.points, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Badges Earned', value: user.badges.length, icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={user.avatar} alt="Profile" className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500/50" />
            <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1 border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {user.name}!</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/20">
                Level {level} Citizen
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto flex gap-3">
          <button 
            onClick={() => setActiveTab('report')}
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <PlusCircle className="w-5 h-5" /> Report Issue
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className="flex-1 md:flex-none px-6 py-2.5 glass-panel hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Trophy className="w-5 h-5" /> Leaderboard
          </button>
        </div>
      </motion.div>

      {/* Community Health */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CommunityHealthScore issues={issues} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-400">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Col: Analytics & Recent Issues */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold text-white mb-6">Community Analytics</h2>
            <RechartsAnalytics issues={issues} compact={true} />
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">My Recent Reports</h2>
              <button 
                onClick={() => setActiveTab('profile')}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            {recentIssues.length === 0 ? (
              <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">You haven't reported any issues yet.</p>
                <button onClick={() => setActiveTab('report')} className="mt-3 text-indigo-400 text-sm font-medium">Report your first issue</button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.map(issue => (
                  <div 
                    key={issue.id}
                    onClick={() => navigateToIssue(issue.id)}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <img src={issue.imageUrl} alt={issue.title} className="w-16 h-16 rounded-lg object-cover bg-slate-800" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate mb-1">{issue.title}</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium`}>{issue.status}</span>
                        <span className="text-slate-500">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-slate-400">
                      <div className="mb-1">⬆️ {issue.upvotes}</div>
                      <div>✅ {issue.verifiedCount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Badges & Progress */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> Badge Showcase
            </h2>
            
            <div className="space-y-3">
              {user.badges.map(badge => (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <div className="font-bold text-white text-sm">{badge.name}</div>
                    <div className="text-xs text-slate-400">{badge.description}</div>
                  </div>
                </div>
              ))}
              
              {/* Show locked badges if less than 3 earned to fill space */}
              {ALL_BADGES.filter(b => !user.badges.find(ub => ub.id === b.id)).slice(0, Math.max(0, 3 - user.badges.length)).map(badge => (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700 opacity-50 grayscale">
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <div className="font-bold text-slate-300 text-sm">{badge.name}</div>
                    <div className="text-xs text-slate-500">{badge.requirement}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setActiveTab('profile')} className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white rounded-lg transition-colors">
              View All Badges
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Next Level
            </h2>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Level {level}</span>
              <span className="text-indigo-400 font-bold">{user.points} / {(level) * 100}</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Earn {100 - progressToNext} more points to reach Level {level + 1}!
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
