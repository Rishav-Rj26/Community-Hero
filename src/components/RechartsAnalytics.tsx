import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import type { Issue } from '../types';
import { Activity, Clock, Target } from 'lucide-react';

interface AnalyticsProps {
  issues: Issue[];
  compact?: boolean;
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#64748b'];

export function RechartsAnalytics({ issues, compact = false }: AnalyticsProps) {
  
  const trendData = useMemo(() => {
    // Generate last 7 days of data
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().split('T')[0], 0);
    }
    
    issues.forEach(issue => {
      const dateStr = issue.createdAt.split('T')[0];
      if (map.has(dateStr)) {
        map.set(dateStr, map.get(dateStr)! + 1);
      }
    });

    return Array.from(map.entries()).map(([date, count]) => {
      const [, month, day] = date.split('-');
      return {
        name: `${month}/${day}`,
        Issues: count,
      };
    });
  }, [issues]);

  const categoryData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [issues]);

  const statusData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);
  
  const severityData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { name: 'Critical', value: counts['Critical'] || 0, fill: '#ef4444' },
      { name: 'High', value: counts['High'] || 0, fill: '#f59e0b' },
      { name: 'Medium', value: counts['Medium'] || 0, fill: '#3b82f6' },
      { name: 'Low', value: counts['Low'] || 0, fill: '#10b981' },
    ];
  }, [issues]);
  
  const resolutionMetrics = useMemo(() => {
    const resolved = issues.filter(i => i.status === 'Resolved' && i.resolvedAt);
    const rate = issues.length > 0 ? (resolved.length / issues.length) * 100 : 0;
    
    let totalMs = 0;
    resolved.forEach(i => {
      const created = new Date(i.createdAt).getTime();
      const resolvedDate = new Date(i.resolvedAt!).getTime();
      totalMs += (resolvedDate - created);
    });
    
    const avgDays = resolved.length > 0 ? (totalMs / resolved.length) / (1000 * 60 * 60 * 24) : 0;
    
    return {
      rate: rate.toFixed(1),
      avgDays: avgDays.toFixed(1),
    };
  }, [issues]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 mb-1">{label || payload[0].name}</p>
          <p className="text-white font-bold">
            {payload[0].value} {payload[0].dataKey || 'Reports'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        
        {/* Trend Area Chart */}
        <div className={`glass-panel p-5 rounded-2xl ${compact ? 'md:col-span-2' : 'md:col-span-2'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Reporting Trend (Last 7 Days)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Issues" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut Chart */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Status Distribution</h3>
          <div className="h-[250px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!compact && (
          <>
            {/* Category Bar Chart */}
            <div className="glass-panel p-5 rounded-2xl md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-6">Top Categories</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-center gap-6">
              <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex justify-center mb-2">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{resolutionMetrics.rate}%</div>
                <div className="text-sm text-slate-400">Resolution Rate</div>
              </div>
              
              <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex justify-center mb-2">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{resolutionMetrics.avgDays}d</div>
                <div className="text-sm text-slate-400">Avg Resolution Time</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
