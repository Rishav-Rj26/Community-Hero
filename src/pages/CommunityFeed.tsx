import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Search, Filter, ThumbsUp, ShieldCheck, MapPin, MessageSquare, TrendingUp, Users, Activity } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';

export function CommunityFeed() {
  const { 
    issues, 
    searchQuery, 
    setSearchQuery, 
    navigateToIssue, 
    upvoteIssue, 
    verifyIssue, 
    hasUpvoted, 
    hasVerified,
    user
  } = useApp();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'Most Upvoted' | 'Most Verified' | 'Critical First'>('Newest');

  // Filter & Sort Issues
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q) ||
        i.location.address.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(i => i.category === activeCategory);
    }

    // Status filter
    if (activeStatus !== 'All') {
      result = result.filter(i => i.status === activeStatus);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'Newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'Most Upvoted':
          return b.upvotes - a.upvotes;
        case 'Most Verified':
          return b.verifiedCount - a.verifiedCount;
        case 'Critical First': {
          const weight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return weight[b.severity] - weight[a.severity];
        }
        default: return 0;
      }
    });

    return result;
  }, [issues, searchQuery, activeCategory, activeStatus, sortBy]);

  // Trending & Stats
  const trendingIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const scoreA = (a.upvotes * 2) + (a.verifiedCount * 3) - ((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24));
      const scoreB = (b.upvotes * 2) + (b.verifiedCount * 3) - ((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 3600 * 24));
      return scoreB - scoreA;
    }).slice(0, 5);
  }, [issues]);

  const stats = useMemo(() => {
    const totalVerified = issues.reduce((acc, curr) => acc + curr.verifiedCount, 0);
    const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
    const resRate = issues.length > 0 ? (resolvedCount / issues.length) * 100 : 0;
    const reporters = new Set(issues.map(i => i.reporterId)).size;
    return { totalVerified, resRate: resRate.toFixed(1), reporters };
  }, [issues]);

  return (
    <div className="max-w-7xl mx-auto flex gap-6 pb-20 items-start">
      
      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        
        {/* Header & Search */}
        <div className="glass-panel p-4 md:p-6 rounded-3xl sticky top-20 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users size={18} />
              </span>
              Community Feed
              <span className="text-sm font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{filteredIssues.length}</span>
            </h1>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-full bg-slate-800/50 border border-slate-700 text-sm text-white rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                    activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-2">
                {['All', 'Reported', 'Under Review', 'In Progress', 'Resolved'].map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`text-xs font-medium transition-colors ${
                      activeStatus === status ? 'text-white border-b-2 border-indigo-500 pb-0.5' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="Most Upvoted">Most Upvoted</option>
                <option value="Most Verified">Most Verified</option>
                <option value="Critical First">Critical First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issue List */}
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl text-center text-slate-400">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p>No issues found matching your filters.</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveStatus('All'); }} className="mt-4 text-indigo-400 hover:underline">Clear Filters</button>
            </div>
          ) : (
            filteredIssues.map((issue, idx) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                className="glass-panel rounded-2xl overflow-hidden hover:border-slate-600 transition-colors cursor-pointer flex flex-col md:flex-row group"
                onClick={() => navigateToIssue(issue.id)}
              >
                {/* Image */}
                <div className="md:w-64 h-48 md:h-auto relative shrink-0">
                  <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent md:hidden"></div>
                  <div className="absolute top-3 left-3 flex gap-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900/80 text-slate-300 backdrop-blur">{issue.category}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded backdrop-blur ${
                      issue.severity === 'Critical' ? 'bg-rose-500/90 text-white' 
                      : issue.severity === 'High' ? 'bg-amber-500/90 text-white'
                      : issue.severity === 'Medium' ? 'bg-blue-500/90 text-white'
                      : 'bg-emerald-500/90 text-white'
                    }`}>{issue.severity}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{issue.title}</h2>
                    <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${
                      issue.status === 'Resolved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : issue.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : issue.status === 'Under Review' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400'
                    }`}>{issue.status}</span>
                  </div>
                  
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">{issue.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 mt-auto">
                    <MapPin size={12} /> <span className="truncate">{issue.location.address}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <img src={issue.reporterAvatar} className="w-6 h-6 rounded-full bg-slate-800" alt="" />
                      <div className="text-xs">
                        <span className="text-white font-medium">{issue.reporterName}</span>
                        <span className="text-slate-500 mx-1">•</span>
                        <span className="text-slate-500">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); upvoteIssue(issue.id); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          hasUpvoted(issue.id) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <ThumbsUp size={14} className={hasUpvoted(issue.id) ? 'fill-current' : ''} /> {issue.upvotes}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); verifyIssue(issue.id); }}
                        disabled={issue.reporterId === user?.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          hasVerified(issue.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50'
                        }`}
                      >
                        <ShieldCheck size={14} className={hasVerified(issue.id) ? 'fill-current' : ''} /> {issue.verifiedCount}
                      </button>
                      <div className="flex items-center gap-1 text-slate-500 text-xs px-2">
                        <MessageSquare size={14} /> {issue.comments.length}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar (Desktop Only) */}
      <div className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-20">
        
        {/* Civic Scoreboard */}
        <div className="glass-panel p-5 rounded-3xl">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-blue-400" /> Civic Scoreboard
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50">
              <span className="text-slate-400 text-sm">Total Verifications</span>
              <span className="text-white font-bold text-lg">{stats.totalVerified}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50">
              <span className="text-slate-400 text-sm">Resolution Rate</span>
              <span className="text-emerald-400 font-bold text-lg">{stats.resRate}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50">
              <span className="text-slate-400 text-sm">Active Reporters</span>
              <span className="text-indigo-400 font-bold text-lg">{stats.reporters}</span>
            </div>
          </div>
        </div>

        {/* Trending Issues */}
        <div className="glass-panel p-5 rounded-3xl">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" /> Trending Now
          </h2>
          <div className="space-y-4">
            {trendingIssues.map((issue, idx) => (
              <div 
                key={issue.id} 
                onClick={() => navigateToIssue(issue.id)}
                className="group cursor-pointer"
              >
                <div className="flex gap-3">
                  <span className="text-slate-600 font-bold text-lg leading-none mt-0.5">{idx + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">{issue.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><ThumbsUp size={10} /> {issue.upvotes}</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={10} /> {issue.verifiedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>

    </div>
  );
}

