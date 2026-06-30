import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from './LeafletMap';
import { Map, Filter, Activity, AlertTriangle, CheckCircle2, Radio, Zap, TrendingUp } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

interface LiveEvent {
  id: string;
  text: string;
  type: 'new' | 'upvote' | 'status' | 'verify';
  timestamp: number;
}

export function MapWidget() {
  const { issues, navigateToIssue, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const prevIssuesRef = useRef(issues);
  const lastUpdateRef = useRef(Date.now());
  
  // Detect changes in issues for live feed
  useEffect(() => {
    const prev = prevIssuesRef.current;
    const now = Date.now();

    if (prev.length < issues.length) {
      // New issue added
      const newIssues = issues.filter(i => !prev.find(p => p.id === i.id));
      newIssues.forEach(issue => {
        setLiveEvents(e => [{
          id: `${now}-${issue.id}`,
          text: `📍 New report: "${issue.title}"`,
          type: 'new' as const,
          timestamp: now,
        }, ...e].slice(0, 8));
      });
      lastUpdateRef.current = now;
    }

    // Check for status changes
    issues.forEach(issue => {
      const prevIssue = prev.find(p => p.id === issue.id);
      if (prevIssue) {
        if (prevIssue.status !== issue.status) {
          setLiveEvents(e => [{
            id: `${now}-status-${issue.id}`,
            text: `🔄 "${issue.title}" → ${issue.status}`,
            type: 'status' as const,
            timestamp: now,
          }, ...e].slice(0, 8));
          lastUpdateRef.current = now;
        }
        if (prevIssue.upvotes < issue.upvotes) {
          setLiveEvents(e => [{
            id: `${now}-upvote-${issue.id}`,
            text: `⬆️ "${issue.title}" +${issue.upvotes - prevIssue.upvotes} upvote`,
            type: 'upvote' as const,
            timestamp: now,
          }, ...e].slice(0, 8));
          lastUpdateRef.current = now;
        }
        if (prevIssue.verifiedCount < issue.verifiedCount) {
          setLiveEvents(e => [{
            id: `${now}-verify-${issue.id}`,
            text: `✅ "${issue.title}" verified`,
            type: 'verify' as const,
            timestamp: now,
          }, ...e].slice(0, 8));
          lastUpdateRef.current = now;
        }
      }
    });

    prevIssuesRef.current = issues;
  }, [issues]);

  // Clean up old events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 30000; // 30 seconds
      setLiveEvents(e => e.filter(ev => ev.timestamp > cutoff));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchCategory = selectedCategory === 'All' || issue.category === selectedCategory;
      const matchSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'All' || issue.status === selectedStatus;
      return matchCategory && matchSeverity && matchStatus;
    });
  }, [issues, selectedCategory, selectedSeverity, selectedStatus]);
  
  const stats = useMemo(() => {
    return {
      total: filteredIssues.length,
      critical: filteredIssues.filter(i => i.severity === 'Critical').length,
      resolved: filteredIssues.filter(i => i.status === 'Resolved').length,
      inProgress: filteredIssues.filter(i => i.status === 'In Progress').length,
    };
  }, [filteredIssues]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedSeverity('All');
    setSelectedStatus('All');
  };

  const getEventColor = (type: LiveEvent['type']) => {
    switch (type) {
      case 'new': return 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';
      case 'upvote': return 'text-blue-300 bg-blue-500/10 border-blue-500/20';
      case 'status': return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
      case 'verify': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Map className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Live Issue Map</h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {isLive ? 'LIVE' : 'PAUSED'}
            </div>
          </div>
          <p className="text-slate-400 text-sm">Real-time geographical view of community reports</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <motion.div 
            className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            key={`total-${stats.total}`}
          >
            <Activity className="w-4 h-4 text-blue-400" />
            <div className="text-sm">
              <span className="text-slate-400">Total: </span>
              <motion.span 
                className="text-white font-bold"
                key={stats.total}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.total}
              </motion.span>
            </div>
          </motion.div>
          <motion.div 
            className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2"
            key={`critical-${stats.critical}`}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div className="text-sm">
              <span className="text-slate-400">Critical: </span>
              <motion.span 
                className="text-white font-bold"
                key={stats.critical}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.critical}
              </motion.span>
            </div>
          </motion.div>
          <motion.div 
            className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2"
            key={`resolved-${stats.resolved}`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="text-sm">
              <span className="text-slate-400">Resolved: </span>
              <motion.span 
                className="text-white font-bold"
                key={stats.resolved}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.resolved}
              </motion.span>
            </div>
          </motion.div>
          <motion.div 
            className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2"
            key={`progress-${stats.inProgress}`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <div className="text-sm">
              <span className="text-slate-400">Active: </span>
              <motion.span 
                className="text-white font-bold"
                key={stats.inProgress}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.inProgress}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center gap-3 relative z-10">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        <span className="text-sm text-slate-400 font-medium mr-2">Filters:</span>
        
        <select 
          className="bg-slate-800/50 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select 
          className="bg-slate-800/50 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <select 
          className="bg-slate-800/50 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Reported">Reported</option>
          <option value="Under Review">Under Review</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        
        {(selectedCategory !== 'All' || selectedSeverity !== 'All' || selectedStatus !== 'All') && (
          <button 
            onClick={resetFilters}
            className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
      
      <div className="flex-1 flex gap-4 min-h-[500px]">
        {/* Map Area */}
        <div className="glass-panel rounded-2xl overflow-hidden flex-1 relative border border-slate-700/50">
          <LeafletMap
            issues={filteredIssues}
            onIssueClick={(id) => navigateToIssue(id)}
            height="100%"
            showControls={true}
          />
          {filteredIssues.length === 0 && (
            <div className="absolute inset-0 z-[350] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] px-6">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-indigo-300">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold mb-2">No Matching Reports</h3>
                <p className="text-sm text-slate-300 mb-4">Try widening the category, severity, or status filters.</p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="hidden lg:flex flex-col w-72 glass-panel rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Activity</h3>
              </div>
              <button
                onClick={() => setIsLive(prev => !prev)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                  isLive 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {isLive ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {liveEvents.length > 0 ? liveEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`text-xs p-2.5 rounded-lg border ${getEventColor(event.type)} leading-relaxed`}
                >
                  <div className="truncate">{event.text}</div>
                  <div className="text-[10px] opacity-60 mt-1">
                    {Math.round((Date.now() - event.timestamp) / 1000)}s ago
                  </div>
                </motion.div>
              )) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center py-10 px-4"
                >
                  <Zap className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-xs text-slate-500">
                    Watching for live updates...
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Events appear here as they happen
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{filteredIssues.length} issues tracked</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 text-center">
        Showing {filteredIssues.length} of {issues.length} issues • Auto-updating in real-time
      </p>
    </motion.div>
  );
}
