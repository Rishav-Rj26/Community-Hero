import React from 'react';
import { motion } from 'motion/react';
import { useApp, type AppTab } from '../context/AppContext';
import { 
  Compass, LayoutDashboard, PlusCircle, Map as MapIcon, 
  Rss, MessageSquare, Building, User, LogIn, LogOut,
  Trophy
} from 'lucide-react';

export function Sidebar() {
  const { activeTab, setActiveTab, isAuthenticated, user, addToast, logoutUser, resetDemo, isMobileMenuOpen, setIsMobileMenuOpen } = useApp();

  const handleNavClick = (tab: AppTab, requiresAuth: boolean = false, adminOnly: boolean = false) => {
    if (requiresAuth && !isAuthenticated) {
      addToast('Sign In Required', 'Please sign in to access this feature.', 'warning');
      setActiveTab('auth');
      setIsMobileMenuOpen(false);
      return;
    }
    if (adminOnly && (!isAuthenticated || user?.role !== 'Authority')) {
      addToast('Access Denied', 'This area is restricted to authorities.', 'error');
      setIsMobileMenuOpen(false);
      return;
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'landing' as AppTab, label: 'Explore', icon: Compass, auth: false },
    { id: 'dashboard' as AppTab, label: 'Dashboard', icon: LayoutDashboard, auth: true },
    { id: 'report' as AppTab, label: 'Report Issue', icon: PlusCircle, auth: true },
    { id: 'map' as AppTab, label: 'Live Map', icon: MapIcon, auth: true },
    { id: 'feed' as AppTab, label: 'Community', icon: Rss, auth: false },
    { id: 'leaderboard' as AppTab, label: 'Leaderboard', icon: Trophy, auth: false },
    { id: 'ai-assistant' as AppTab, label: 'AI Assistant', icon: MessageSquare, auth: false },
    { id: 'authority-dashboard' as AppTab, label: 'Authority Admin', icon: Building, auth: true, admin: true },
    { id: 'profile' as AppTab, label: 'My Profile', icon: User, auth: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        flex flex-col w-64 h-screen fixed left-0 top-0 pt-20 pb-4 px-4 
        bg-slate-900/90 md:bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-50
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide space-y-1">
        {navItems.map((item) => {
          if (item.admin && user?.role !== 'Authority') return null;
          
          const isActive = activeTab === item.id;
          const isLocked = item.auth && !isAuthenticated;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.auth, item.admin)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <item.icon size={20} className={`relative z-10 ${isActive ? 'text-indigo-400' : ''}`} />
              <span className="relative z-10 font-medium text-sm">{item.label}</span>
              
              {isLocked && (
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-slate-400">Lock</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        {isAuthenticated && user ? (
          <div className="glass-panel p-3 rounded-xl mb-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                <div className="text-xs text-indigo-400 font-medium truncate">Level {Math.floor(user.points / 100) + 1} Hero</div>
              </div>
            </div>
            
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                style={{ width: `${(user.points % 100)}%` }}
              />
            </div>
            
            <button 
              onClick={logoutUser}
              className="flex items-center justify-center gap-2 w-full py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <div className="glass-panel p-4 rounded-xl mb-3 text-center">
            <div className="text-sm text-slate-300 mb-3">Join to report issues and earn rewards.</div>
            <button 
              onClick={() => setActiveTab('auth')}
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <LogIn size={16} /> Sign In
            </button>
          </div>
        )}
        
        <button 
          onClick={resetDemo}
          className="w-full text-center py-2 text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
        >
          Reset Demo Data
        </button>
      </div>
    </aside>
    </>
  );
}