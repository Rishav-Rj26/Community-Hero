import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Bell, Search, Menu, X, LogIn, LogOut, User as UserIcon, LayoutDashboard, Shield, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AppNotification } from '../types';

export function Navbar() {
  const { 
    user, 
    isAuthenticated, 
    logoutUser,
    setActiveTab, 
    searchQuery, 
    setSearchQuery,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    navigateToIssue,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useApp();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('feed');
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.issueId) {
      navigateToIssue(notif.issueId);
      setShowNotifications(false);
    }
  };

  return (
    <>
      <nav ref={navRef} className={`fixed left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-40 px-4 flex items-center justify-between transition-all duration-300 top-0`}>
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 text-slate-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight hidden sm:block">
            Community<span className="text-indigo-400">Hero</span>
          </span>
        </div>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-xl px-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder="Search issues, categories, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="submit" className="absolute left-3 top-2.5 text-slate-400 hover:text-indigo-400">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <div className="relative">
          <button 
            className="p-2 text-slate-400 hover:text-white relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel border border-slate-700 rounded-xl shadow-2xl z-50"
              >
                <div className="p-3 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="p-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-lg cursor-pointer mb-1 transition-colors ${notif.read ? 'hover:bg-slate-800/30' : 'bg-indigo-500/10 hover:bg-indigo-500/20'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-semibold text-sm ${notif.read ? 'text-slate-300' : 'text-indigo-300'}`}>{notif.title}</span>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs flex items-center justify-end gap-1 text-slate-400">
                  <span className="text-indigo-400 font-bold">{user.points} pts</span>
                </div>
              </div>
              <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 glass-panel border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                    {user.role === 'Authority' ? <ShieldCheck size={16} className="text-amber-400" /> : <Shield size={16} className="text-indigo-400" />}
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{user.role}</span>
                  </div>
                  <div className="p-1">
                    <button onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg flex items-center gap-2">
                      <UserIcon size={16} /> Profile
                    </button>
                    <button onClick={() => { setActiveTab(user.role === 'Authority' ? 'authority-dashboard' : 'dashboard'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg flex items-center gap-2">
                      <LayoutDashboard size={16} /> Dashboard
                    </button>
                    <div className="h-px bg-slate-700/50 my-1"></div>
                    <button onClick={() => { logoutUser(); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button 
            onClick={() => setActiveTab('auth')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-1.5 px-4 rounded-full transition-colors"
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
      </nav>
    </>
  );
}