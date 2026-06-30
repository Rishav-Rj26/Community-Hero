import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Trophy, Medal, Star, Target, Crown, ShieldCheck } from 'lucide-react';
import { LEADERBOARD_MOCK } from '../data/mockData';

export function LeaderboardPage() {
  const { user, setActiveTab } = useApp();

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-4">
      
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20 mb-4">
          <Trophy size={32} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Civic Leaderboard</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Recognizing the top contributors making our community better. Earn points by reporting, verifying, and participating.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 mb-16 pt-8">
        
        {/* 2nd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="order-2 md:order-1 flex-1 max-w-[220px] mx-auto md:mx-0"
        >
          <div className="glass-panel p-6 rounded-t-3xl border-t-[4px] border-slate-300 relative flex flex-col items-center text-center h-[220px]">
            <div className="absolute -top-8 bg-slate-800 p-2 rounded-full border-4 border-slate-300 shadow-lg shadow-slate-300/20 z-10">
              <img src={LEADERBOARD_MOCK[1].avatar} className="w-14 h-14 rounded-full bg-slate-900" alt="2nd Place" />
            </div>
            <div className="mt-10 mb-2">
              <h3 className="font-bold text-white text-lg line-clamp-1">{LEADERBOARD_MOCK[1].name}</h3>
              <p className="text-xs text-indigo-400 font-medium">Level {LEADERBOARD_MOCK[1].level} Hero</p>
            </div>
            <div className="mt-auto pt-4 w-full border-t border-slate-700/50">
              <div className="text-2xl font-black text-slate-300">{LEADERBOARD_MOCK[1].points}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Points</div>
            </div>
          </div>
        </motion.div>

        {/* 1st Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="order-1 md:order-2 flex-[1.2] max-w-[260px] mx-auto md:mx-0 z-10 -mx-2 md:mx-0"
        >
          <div className="glass-panel p-6 rounded-t-3xl border-t-[6px] border-amber-400 relative flex flex-col items-center text-center h-[260px] shadow-2xl shadow-amber-500/10">
            <div className="absolute -top-12">
              <Crown className="w-8 h-8 text-amber-400 mx-auto mb-[-10px] relative z-20" />
              <div className="bg-slate-800 p-2 rounded-full border-4 border-amber-400 shadow-xl shadow-amber-500/30 relative z-10">
                <img src={LEADERBOARD_MOCK[0].avatar} className="w-16 h-16 rounded-full bg-slate-900" alt="1st Place" />
              </div>
            </div>
            <div className="mt-12 mb-2">
              <h3 className="font-bold text-white text-xl line-clamp-1">{LEADERBOARD_MOCK[0].name}</h3>
              <p className="text-sm text-indigo-400 font-bold">Level {LEADERBOARD_MOCK[0].level} Legend</p>
            </div>
            <div className="mt-auto pt-4 w-full border-t border-slate-700/50 flex justify-center gap-4">
              <div>
                 <div className="text-3xl font-black text-amber-400">{LEADERBOARD_MOCK[0].points}</div>
                 <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Points</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="order-3 md:order-3 flex-1 max-w-[220px] mx-auto md:mx-0"
        >
          <div className="glass-panel p-6 rounded-t-3xl border-t-[4px] border-amber-700 relative flex flex-col items-center text-center h-[200px]">
            <div className="absolute -top-8 bg-slate-800 p-2 rounded-full border-4 border-amber-700 shadow-lg shadow-amber-700/20 z-10">
              <img src={LEADERBOARD_MOCK[2].avatar} className="w-12 h-12 rounded-full bg-slate-900" alt="3rd Place" />
            </div>
            <div className="mt-8 mb-2">
              <h3 className="font-bold text-white text-lg line-clamp-1">{LEADERBOARD_MOCK[2].name}</h3>
              <p className="text-xs text-indigo-400 font-medium">Level {LEADERBOARD_MOCK[2].level} Hero</p>
            </div>
            <div className="mt-auto pt-4 w-full border-t border-slate-700/50">
              <div className="text-2xl font-black text-amber-700">{LEADERBOARD_MOCK[2].points}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Points</div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Leaderboard List */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-semibold text-center w-16">Rank</th>
                <th className="px-6 py-4 font-semibold">Hero</th>
                <th className="px-6 py-4 font-semibold text-center">Reports</th>
                <th className="px-6 py-4 font-semibold text-center">Verifications</th>
                <th className="px-6 py-4 font-semibold text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {LEADERBOARD_MOCK.slice(3).map((entry, idx) => (
                <tr key={entry.userId} className={`hover:bg-slate-800/30 transition-colors ${user?.id === entry.userId ? 'bg-indigo-500/10' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold">
                      {idx + 4}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={entry.avatar} className="w-10 h-10 rounded-full bg-slate-800" alt={entry.name} />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {entry.name}
                          {user?.id === entry.userId && <span className="text-[10px] px-2 py-0.5 bg-indigo-500 text-white rounded-full uppercase">You</span>}
                        </div>
                        <div className="text-xs text-indigo-400 font-medium">Level {entry.level}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <div className="flex items-center justify-center gap-1">
                      <Target size={14} className="text-slate-500" /> {entry.issuesReported}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <div className="flex items-center justify-center gap-1">
                      <ShieldCheck size={14} className="text-slate-500" /> {entry.issuesVerified}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-lg font-bold text-white">{entry.points}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!user && (
        <div className="mt-8 text-center p-8 glass-panel rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-transparent to-indigo-900/20">
          <h3 className="text-xl font-bold text-white mb-2">Want to see your name here?</h3>
          <p className="text-slate-400 mb-6">Join Community Hero today and start earning points for making your city better.</p>
          <button 
            onClick={() => setActiveTab('auth')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg"
          >
            Create an Account
          </button>
        </div>
      )}

    </div>
  );
}


