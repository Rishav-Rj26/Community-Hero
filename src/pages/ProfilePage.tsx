import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { User, ShieldCheck, Mail, Calendar, TrendingUp, Award, MapPin, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ProfilePage() {
  const { user, issues, navigateToIssue } = useApp();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <User size={64} className="text-slate-600 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Not Signed In</h2>
        <p className="text-slate-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  const userIssues = issues.filter(i => i.reporterId === user.id);
  const resolvedIssues = userIssues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Profile Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="relative group shrink-0">
          <img src={user.avatar} className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 shadow-xl" alt={user.name} />
          <button className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit3 size={16} />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider ${
              user.role === 'Authority' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {user.role}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-slate-400 mb-6">
            <span className="flex items-center gap-1.5"><Mail size={16} /> {user.email}</span>
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><MapPin size={16} /> Community Hero Member</span>
          </div>

          <div className="flex gap-6 w-full max-w-md">
            <div className="flex-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{user.points}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Points</div>
            </div>
            <div className="flex-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
              <div className="text-2xl font-bold text-indigo-400">Lvl {Math.floor(user.points / 100) + 1}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Hero Status</div>
            </div>
            <div className="flex-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
              <div className="text-2xl font-bold text-amber-400">{user.streak}🔥</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Col */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-400 w-5 h-5" /> Contribution Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Issues Reported</span>
                <span className="font-bold text-white">{user.issuesReported}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Issues Resolved</span>
                <span className="font-bold text-emerald-400">{resolvedIssues}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Issues Verified</span>
                <span className="font-bold text-indigo-400">{user.issuesVerified}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Comments Posted</span>
                <span className="font-bold text-white">{user.commentsPosted}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Award className="text-purple-400 w-5 h-5" /> Earned Badges ({user.badges.length})
            </h2>
            {user.badges.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No badges earned yet.</div>
            ) : (
              <div className="space-y-3">
                {user.badges.map(badge => (
                  <div key={badge.id} className="flex gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 items-start">
                    <div className="text-3xl shrink-0 mt-1">{badge.icon}</div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{badge.name}</h4>
                      <p className="text-xs text-slate-400 mb-1">{badge.description}</p>
                      <p className="text-[10px] text-indigo-400 font-medium">Earned {new Date(badge.dateEarned || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl h-full">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="text-blue-400 w-5 h-5" /> Activity History
            </h2>
            
            {userIssues.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                <p>No activity found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...userIssues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(issue => (
                  <div 
                    key={issue.id}
                    onClick={() => navigateToIssue(issue.id)}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-700 transition-all group"
                  >
                    <img src={issue.imageUrl} className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg shrink-0" alt="Issue" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 pr-2">{issue.title}</h3>
                          <span className="text-xs text-slate-500 shrink-0">{formatDistanceToNow(new Date(issue.createdAt))}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                             issue.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                           }`}>{issue.status}</span>
                           <span className="text-xs text-slate-400 truncate">{issue.location.address}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>👍 {issue.upvotes}</span>
                        <span>✅ {issue.verifiedCount}</span>
                        <span>💬 {issue.comments.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
