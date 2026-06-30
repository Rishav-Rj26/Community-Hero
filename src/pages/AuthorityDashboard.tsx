import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { RechartsAnalytics } from '../components/RechartsAnalytics';
import { LeafletMap } from '../components/LeafletMap';
import { ShieldCheck, Users, AlertTriangle, CheckCircle2, Clock, Filter, ArrowRight, Download } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';

export function AuthorityDashboard() {
  const { user, issues, updateIssueStatus, navigateToIssue, addToast, setActiveTab } = useApp();
  const [activeDept, setActiveDept] = useState('All');
  
  const deptIssues = useMemo(() => {
    if (activeDept === 'All') return issues;
    return issues.filter(i => i.department === activeDept);
  }, [issues, activeDept]);

  const stats = useMemo(() => {
    return {
      total: deptIssues.length,
      critical: deptIssues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length,
      resolved: deptIssues.filter(i => i.status === 'Resolved').length,
      avgResolveTime: '2.4 Days',
    };
  }, [deptIssues]);

  const actionRequired = useMemo(() => {
    return deptIssues
      .filter(i => i.status !== 'Resolved' && i.verifiedCount >= 5)
      .sort((a, b) => b.verifiedCount - a.verifiedCount)
      .slice(0, 5);
  }, [deptIssues]);

  if (!user || user.role !== 'Authority') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldCheck size={64} className="text-rose-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400">You must be logged in as an Authority to view this dashboard.</p>
      </div>
    );
  }

  const handleExport = () => {
    const csvHeaders = 'ID,Title,Category,Severity,Status,Location,Upvotes,Verified,Reported Date\n';
    const csvRows = deptIssues.map(i => 
      `"${i.id}","${i.title}","${i.category}","${i.severity}","${i.status}","${i.location.address}",${i.upvotes},${i.verifiedCount},"${i.createdAt}"`
    ).join('\n');
    const csv = csvHeaders + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-hero-issues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Export Complete', `Downloaded ${deptIssues.length} issues as CSV`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <ShieldCheck className="text-purple-400" /> Authority Control Center
          </h1>
          <p className="text-slate-400">Overview and management of city infrastructure issues.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={activeDept}
            onChange={e => setActiveDept(e.target.value)}
            className="flex-1 md:w-48 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:border-purple-500 outline-none"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button 
            onClick={handleExport}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors"
            title="Export Report"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="glass-panel p-5 rounded-2xl border-t border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Filter size={18} /></div>
            <span className="text-sm font-medium text-slate-400">Total Assigned</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 rounded-2xl border-t border-rose-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg"><AlertTriangle size={18} /></div>
            <span className="text-sm font-medium text-slate-400">Critical Active</span>
          </div>
          <div className="text-3xl font-bold text-rose-400">{stats.critical}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 rounded-2xl border-t border-emerald-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle2 size={18} /></div>
            <span className="text-sm font-medium text-slate-400">Resolved</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats.resolved}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5 rounded-2xl border-t border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Clock size={18} /></div>
            <span className="text-sm font-medium text-slate-400">Avg Resolution</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.avgResolveTime}</div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold text-white mb-6">Department Analytics</h2>
            <RechartsAnalytics issues={deptIssues} compact={false} />
          </div>

          <div className="glass-panel p-6 rounded-3xl overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Live Department Map</h2>
             </div>
             <div className="h-[400px] -mx-6 -mb-6 border-t border-slate-700">
               <LeafletMap issues={deptIssues} height="100%" showControls={true} />
             </div>
          </div>
        </div>

        {/* Priority Actions Queue */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-rose-400 w-5 h-5" /> Priority Queue
            </h2>
            <p className="text-xs text-slate-400 mb-4">Highly verified issues requiring immediate attention.</p>
            
            <div className="space-y-3">
              {actionRequired.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No priority issues found.</div>
              ) : (
                actionRequired.map(issue => (
                  <div key={issue.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-1 flex-1 pr-2">{issue.title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                        issue.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{issue.severity}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-400" /> {issue.verifiedCount} Verifications</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(issue.createdAt))}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigateToIssue(issue.id)}
                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                      {issue.status === 'Reported' && (
                        <button 
                          onClick={() => updateIssueStatus(issue.id, 'Under Review')}
                          className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Mark Review
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setActiveTab('feed')} className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium">
              View All Open Issues <ArrowRight size={16} />
            </button>
          </div>

          {/* AI Predictive Insights */}
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-900/20 border border-indigo-500/30">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
              </span>
              Predictive Insights
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="text-xs font-bold text-rose-400 mb-1 uppercase tracking-wider">High Risk Category Detected</div>
                <p className="text-sm text-slate-300">Based on recent reports, <span className="font-bold text-white">{deptIssues.filter(i => i.severity === 'Critical' || i.severity === 'High').length > 0 ? deptIssues.filter(i => i.severity === 'Critical' || i.severity === 'High')[0].category : 'Public Safety'}</span> is showing an elevated number of severe issues requiring immediate attention.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">Resource Allocation</div>
                <p className="text-sm text-slate-300">With <span className="font-bold text-white">{stats.total}</span> active reports in this view, we recommend shifting additional maintenance crews to address the backlog.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
