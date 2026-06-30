import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Issue, User, ChatMessage, AppNotification, ToastData, AppTab, NewIssueInput, Badge } from '../types';
import { INITIAL_ISSUES, MOCK_USERS, ALL_BADGES } from '../data/mockData';
import { saveToStorage, loadFromStorage, clearAllStorage, STORAGE_KEYS } from '../services/storageService';
import { apiLogin, apiRegister, apiGetMe, apiGetIssues, apiCreateIssue, apiUpdateIssueStatus, apiUpvoteIssue, apiVerifyIssue, apiAddComment, apiGetLeaderboard, apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead, apiReset, getToken, setToken, removeToken } from '../services/apiService';

export type { AppTab } from '../types';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  apiAvailable: boolean;
  loginUser: (email: string, password: string) => Promise<boolean>;
  registerUser: (name: string, email: string, password: string, role: 'Citizen' | 'Authority') => Promise<void>;
  logoutUser: () => void;
  
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedIssueId: string | null;
  navigateToIssue: (id: string) => void;
  
  issues: Issue[];
  addIssue: (input: NewIssueInput) => void;
  upvoteIssue: (id: string) => void;
  verifyIssue: (id: string, lat?: number, lng?: number) => void;
  updateIssueStatus: (id: string, status: Issue['status'], notes?: string) => void;
  addComment: (issueId: string, content: string) => void;
  hasUpvoted: (issueId: string) => boolean;
  hasVerified: (issueId: string) => boolean;
  
  chatMessages: ChatMessage[];
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  toasts: ToastData[];
  addToast: (title: string, message: string, type: ToastData['type']) => void;
  removeToast: (id: string) => void;
  
  resetDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadFromStorage(STORAGE_KEYS.CURRENT_USER, null));
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => loadFromStorage('registeredUsers', MOCK_USERS));
  const [activeTab, setActiveTab] = useState<AppTab>('landing');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>(() => loadFromStorage(STORAGE_KEYS.ISSUES, INITIAL_ISSUES));
  const [upvotedIssues, setUpvotedIssues] = useState<Set<string>>(() => new Set(loadFromStorage(STORAGE_KEYS.USER_UPVOTES, [])));
  const [verifiedIssues, setVerifiedIssues] = useState<Set<string>>(() => new Set(loadFromStorage(STORAGE_KEYS.USER_VERIFICATIONS, [])));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadFromStorage(STORAGE_KEYS.CHAT_HISTORY, []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, []));
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [apiAvailable, setApiAvailable] = useState<boolean>(() => loadFromStorage(STORAGE_KEYS.USE_API, false));

  const isAuthenticated = !!user;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => { saveToStorage(STORAGE_KEYS.USE_API, apiAvailable); }, [apiAvailable]);

  const fetchIssuesFromApi = useCallback(async () => {
    try {
      const data = await apiGetIssues();
      setIssues(data.issues);
    } catch (e) {
      console.warn("Failed to fetch issues from API", e);
    }
  }, []);

  useEffect(() => {
    async function initApi() {
      const token = getToken();
      if (token) {
        try {
          const res = await apiGetMe();
          setUser(res.user);
          setApiAvailable(true);
          await fetchIssuesFromApi();
        } catch (e) {
          console.warn("API check failed, falling back to local storage", e);
          setApiAvailable(false);
        }
      }
    }
    initApi();
  }, [fetchIssuesFromApi]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.CURRENT_USER, user); }, [user]);
  useEffect(() => { saveToStorage('registeredUsers', registeredUsers); }, [registeredUsers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ISSUES, issues); }, [issues]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USER_UPVOTES, Array.from(upvotedIssues)); }, [upvotedIssues]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USER_VERIFICATIONS, Array.from(verifiedIssues)); }, [verifiedIssues]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CHAT_HISTORY, chatMessages); }, [chatMessages]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications); }, [notifications]);

  const addToast = useCallback((title: string, message: string, type: ToastData['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }].slice(-5));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'], issueId?: string) => {
    setNotifications((prev) => [{
      id: Date.now().toString(),
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
      issueId
    }, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const checkBadges = useCallback((currentUser: User) => {
    const newBadges = [...currentUser.badges];
    let badgesAdded = false;

    for (const badge of ALL_BADGES) {
      if (!newBadges.find(b => b.id === badge.id)) {
        let earned = false;
        switch (badge.id) {
          case 'badge-1': earned = currentUser.issuesReported >= badge.threshold; break;
          case 'badge-2': earned = currentUser.issuesVerified >= badge.threshold; break;
          case 'badge-3': earned = currentUser.issuesReported >= badge.threshold; break;
          case 'badge-4': earned = currentUser.points >= badge.threshold; break;
          case 'badge-5': earned = currentUser.commentsPosted >= badge.threshold; break;
          case 'badge-6': earned = currentUser.streak >= badge.threshold; break;
          case 'badge-7': earned = true; break; // Always earned
          case 'badge-8': 
            const resolvedCount = issues.filter(i => i.reporterId === currentUser.id && i.status === 'Resolved').length;
            earned = resolvedCount >= badge.threshold;
            break;
        }
        if (earned) {
          newBadges.push({ ...badge, dateEarned: new Date().toISOString() });
          badgesAdded = true;
          addNotification('Badge Earned! 🏆', `You've earned the ${badge.name} badge!`, 'badge');
          addToast('New Badge!', `You earned: ${badge.name}`, 'success');
        }
      }
    }

    if (badgesAdded) {
      const updatedUser = { ...currentUser, badges: newBadges };
      setUser(updatedUser);
      setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  }, [issues, addNotification, addToast]);

  const updatePoints = useCallback((points: number) => {
    if (!user) return;
    const updatedUser = { ...user, points: user.points + points };
    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    checkBadges(updatedUser);
  }, [user, checkBadges]);

  const updateStreak = useCallback((currentUser: User) => {
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.lastActiveDate === today) return currentUser;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = currentUser.streak;
    
    if (currentUser.lastActiveDate === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const updatedUser = { ...currentUser, streak: newStreak, lastActiveDate: today };
    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    return updatedUser;
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    if (apiAvailable || getToken()) {
      try {
        const res = await apiLogin(email, password);
        setToken(res.token);
        setUser(res.user);
        setApiAvailable(true);
        setActiveTab(res.user.role === 'Authority' ? 'authority-dashboard' : 'dashboard');
        addToast('Welcome Back', `Logged in as ${res.user.name}`, 'success');
        fetchIssuesFromApi();
        return true;
      } catch (e) {
        setApiAvailable(false);
      }
    }

    const foundUser = registeredUsers.find((u) => u.email === email && u.password === password);
    if (foundUser) {
      const updatedUser = updateStreak(foundUser);
      setUser(updatedUser);
      setActiveTab(updatedUser.role === 'Authority' ? 'authority-dashboard' : 'dashboard');
      addToast('Welcome Back', `Logged in as ${updatedUser.name}`, 'success');
      return true;
    }
    return false;
  }, [apiAvailable, registeredUsers, updateStreak, addToast, fetchIssuesFromApi]);

  const registerUser = useCallback(async (name: string, email: string, password: string, role: 'Citizen' | 'Authority') => {
    if (apiAvailable || getToken() || !getToken()) {
      try {
        const res = await apiRegister(name, email, password, role);
        setToken(res.token);
        setUser(res.user);
        setApiAvailable(true);
        setActiveTab(role === 'Authority' ? 'authority-dashboard' : 'dashboard');
        addToast('Account Created', `Welcome to Community Hero, ${name}!`, 'success');
        fetchIssuesFromApi();
        return;
      } catch (e) {
        console.warn('API Register failed, falling back', e);
        setApiAvailable(false);
      }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role,
      points: 0,
      badges: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      joinedAt: new Date().toISOString(),
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      issuesReported: 0,
      issuesVerified: 0,
      commentsPosted: 0,
    };
    setRegisteredUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    setActiveTab(role === 'Authority' ? 'authority-dashboard' : 'dashboard');
    addToast('Account Created', `Welcome to Community Hero, ${name}!`, 'success');
    checkBadges(newUser);
  }, [apiAvailable, addToast, checkBadges, fetchIssuesFromApi]);

  const logoutUser = useCallback(() => {
    removeToken();
    setUser(null);
    setActiveTab('landing');
    addToast('Logged Out', 'You have been successfully logged out.', 'info');
  }, [addToast]);

  const navigateToIssue = useCallback((id: string) => {
    setSelectedIssueId(id);
    setActiveTab('issue-details');
  }, []);

  const addIssue = useCallback(async (input: NewIssueInput) => {
    if (!user) return;
    
    if (apiAvailable) {
      try {
        const formData = new FormData();
        formData.append('title', input.title);
        formData.append('description', input.description);
        formData.append('category', input.category);
        formData.append('severity', input.severity);
        formData.append('department', input.department);
        formData.append('location', JSON.stringify(input.location));
        formData.append('aiConfidence', input.aiConfidence.toString());
        formData.append('aiDescription', input.aiDescription);
        if (input.imageUrl) formData.append('imageUrl', input.imageUrl);
        
        await apiCreateIssue(formData);
        addNotification('Issue Reported', `Your report "${input.title}" has been submitted successfully.`, 'status');
        fetchIssuesFromApi();
        apiGetMe().then(res => setUser(res.user)).catch(console.warn);
        return;
      } catch (e) {
        console.warn('API Issue Creation Failed', e);
      }
    }

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      status: 'Reported',
      location: input.location,
      imageUrl: input.imageUrl,
      videoUrl: input.videoUrl,
      aiConfidence: input.aiConfidence,
      aiDescription: input.aiDescription,
      department: input.department,
      upvotes: 1,
      upvotedBy: [user.id],
      verifiedCount: 0,
      verifiedBy: [],
      isVerifiedByAuthority: false,
      reporterId: user.id,
      reporterName: user.name,
      reporterAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      timeline: [{
        status: 'Reported',
        date: new Date().toISOString(),
        description: 'Issue reported by citizen',
        actor: user.name
      }],
      comments: []
    };

    setIssues((prev) => [newIssue, ...prev]);
    
    const updatedUser = { ...user, issuesReported: user.issuesReported + 1 };
    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    updatePoints(10);
    
    setUpvotedIssues(prev => new Set(prev).add(newIssue.id));
    addNotification('Issue Reported', `Your report "${input.title}" has been submitted successfully.`, 'status', newIssue.id);
  }, [user, updatePoints, checkBadges, addNotification, apiAvailable, fetchIssuesFromApi]);

  const hasUpvoted = useCallback((id: string) => upvotedIssues.has(id), [upvotedIssues]);
  
  const upvoteIssue = useCallback(async (id: string) => {
    if (!user) {
      addToast('Sign In Required', 'Please sign in to upvote issues', 'warning');
      return;
    }

    if (apiAvailable) {
      try {
        await apiUpvoteIssue(id);
        fetchIssuesFromApi();
        apiGetMe().then(res => setUser(res.user)).catch(console.warn);
        setUpvotedIssues((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        return;
      } catch (e) {
        console.warn('API upvote failed', e);
      }
    }

    setIssues((prev) => prev.map((issue) => {
      if (issue.id === id) {
        const isUpvoting = !upvotedIssues.has(id);
        if (isUpvoting && issue.upvotedBy.length === 0) {
            updatePoints(5); // Point for first upvote
        }
        return {
          ...issue,
          upvotes: issue.upvotes + (isUpvoting ? 1 : -1),
          upvotedBy: isUpvoting 
            ? [...issue.upvotedBy, user.id]
            : issue.upvotedBy.filter(uid => uid !== user.id)
        };
      }
      return issue;
    }));

    setUpvotedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [user, upvotedIssues, updatePoints, addToast, apiAvailable, fetchIssuesFromApi]);

  const hasVerified = useCallback((id: string) => verifiedIssues.has(id), [verifiedIssues]);

  const verifyIssue = useCallback(async (id: string, lat?: number, lng?: number) => {
    if (!user) {
      addToast('Sign In Required', 'Please sign in to verify issues', 'warning');
      return;
    }
    
    if (verifiedIssues.has(id)) {
      addToast('Already Verified', 'You have already verified this issue', 'info');
      return;
    }

    if (apiAvailable) {
      try {
        await apiVerifyIssue(id, lat, lng);
        fetchIssuesFromApi();
        apiGetMe().then(res => setUser(res.user)).catch(console.warn);
        setVerifiedIssues((prev) => new Set(prev).add(id));
        addToast('Issue Verified', 'Thank you for verifying this issue', 'success');
        return;
      } catch (e: any) {
        if (e.message?.includes('Cannot verify own issue')) {
          addToast('Error', 'Cannot verify your own issue', 'error');
        } else {
          console.warn('API verify failed', e);
        }
        if (e.message?.includes('Cannot verify own issue')) return;
      }
    }

    const issueToVerify = issues.find(i => i.id === id);
    if (lat && lng && issueToVerify && user.role !== 'Authority') {
       const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
         const earthRadiusMeters = 6371e3;
         const phi1 = lat1 * Math.PI / 180;
         const phi2 = lat2 * Math.PI / 180;
         const deltaPhi = (lat2 - lat1) * Math.PI / 180;
         const deltaLambda = (lon2 - lon1) * Math.PI / 180;
         const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
         return earthRadiusMeters * c;
       };
       const dist = getDistance(lat, lng, issueToVerify.location.lat, issueToVerify.location.lng);
       if (dist > 500) {
         addToast('Verification Failed', `You are too far away (${Math.round(dist)}m. Max allowed: 500m)`, 'error');
         return;
       }
    }

    setIssues((prev) => prev.map((issue) => {
      if (issue.id === id) {
        if (issue.reporterId === user.id) return issue; // Can't verify own issue
        return {
          ...issue,
          verifiedCount: issue.verifiedCount + 1,
          verifiedBy: [...issue.verifiedBy, user.id],
          isVerifiedByAuthority: user.role === 'Authority' ? true : issue.isVerifiedByAuthority
        };
      }
      return issue;
    }));

    setVerifiedIssues((prev) => new Set(prev).add(id));
    
    const updatedUser = { ...user, issuesVerified: user.issuesVerified + 1 };
    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    updatePoints(15);
    checkBadges(updatedUser);
    addToast('Issue Verified', 'Thank you for verifying this issue', 'success');
  }, [user, verifiedIssues, updatePoints, checkBadges, addToast, apiAvailable, fetchIssuesFromApi]);

  const updateIssueStatus = useCallback(async (id: string, status: Issue['status'], notes?: string) => {
    if (!user || user.role !== 'Authority') return;

    if (apiAvailable) {
      try {
        await apiUpdateIssueStatus(id, status, notes);
        fetchIssuesFromApi();
        addToast('Status Updated', `Issue is now ${status}`, 'success');
        return;
      } catch (e) {
        console.warn('API update status failed', e);
      }
    }

    setIssues((prev) => prev.map((issue) => {
      if (issue.id === id) {
        const isResolving = status === 'Resolved' && issue.status !== 'Resolved';
        const newTimeline = [...issue.timeline, {
          status,
          date: new Date().toISOString(),
          description: notes || `Status updated to ${status}`,
          actor: user.name
        }];
        
        if (isResolving) {
           addNotification('Issue Resolved!', `An issue you reported has been resolved: ${issue.title}`, 'status', id);
           if (user.id !== issue.reporterId) {
             const reporter = registeredUsers.find(u => u.id === issue.reporterId);
             if (reporter) checkBadges(reporter); // Trigger badge check for reporter potentially earning 'Resolver'
           }
        } else {
           addNotification('Status Update', `Issue "${issue.title}" is now ${status}`, 'status', id);
        }

        return {
          ...issue,
          status,
          resolvedAt: isResolving ? new Date().toISOString() : issue.resolvedAt,
          resolvedNotes: notes || issue.resolvedNotes,
          timeline: newTimeline
        };
      }
      return issue;
    }));
    
    addToast('Status Updated', `Issue is now ${status}`, 'success');
  }, [user, registeredUsers, addNotification, addToast, checkBadges, apiAvailable, fetchIssuesFromApi]);

  const addComment = useCallback(async (issueId: string, content: string) => {
    if (!user) return;

    if (apiAvailable) {
      try {
        await apiAddComment(issueId, content);
        fetchIssuesFromApi();
        apiGetMe().then(res => setUser(res.user)).catch(console.warn);
        return;
      } catch (e) {
        console.warn('API add comment failed', e);
      }
    }

    setIssues((prev) => prev.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          comments: [
            ...issue.comments,
            {
              id: `c-${Date.now()}`,
              authorId: user.id,
              authorName: user.name,
              authorAvatar: user.avatar,
              content,
              createdAt: new Date().toISOString(),
              role: user.role
            }
          ]
        };
      }
      return issue;
    }));

    const updatedUser = { ...user, commentsPosted: user.commentsPosted + 1 };
    setUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    updatePoints(3);
    checkBadges(updatedUser);
  }, [user, updatePoints, checkBadges, apiAvailable, fetchIssuesFromApi]);

  const sendChatMessage = useCallback(async (message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages((prev) => [...prev, newMessage]);
    
    try {
      const { chatWithAssistant } = await import('../services/geminiService');
      const response = await chatWithAssistant(message, {
         totalIssues: issues.length,
         resolvedIssues: issues.filter(i => i.status === 'Resolved').length,
         pendingIssues: issues.filter(i => i.status !== 'Resolved').length,
         criticalIssues: issues.filter(i => i.severity === 'Critical').length,
         topCategories: Array.from(new Set(issues.slice(0, 5).map(i => i.category))),
         userPoints: user?.points,
         userName: user?.name
      });
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          suggestions: response.recommendations
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I am currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  }, [issues, user]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const resetDemo = useCallback(() => {
    clearAllStorage();
    window.location.reload();
  }, []);

  // Real-time simulation & Polling/SSE
  useEffect(() => {
    if (apiAvailable) {
      const evtSource = new EventSource('/api/events');
      evtSource.addEventListener('issue_updated', () => {
         fetchIssuesFromApi();
      });
      return () => {
         evtSource.close();
      };
    }

    const interval = setInterval(() => {

      if (Math.random() < 0.4) {
        // Random upvote
        setIssues(prev => {
          if (prev.length === 0) return prev;
          const randomIdx = Math.floor(Math.random() * prev.length);
          const newIssues = [...prev];
          newIssues[randomIdx] = { ...newIssues[randomIdx], upvotes: newIssues[randomIdx].upvotes + 1 };
          return newIssues;
        });
      }
      
      if (Math.random() < 0.2) {
        // Random verify
        setIssues(prev => {
           if (prev.length === 0) return prev;
           const randomIdx = Math.floor(Math.random() * prev.length);
           const issue = prev[randomIdx];
           if (issue.reporterId === user?.id) {
               addNotification('New Verification', `Your issue "${issue.title}" was verified by a neighbor!`, 'status', issue.id);
           }
           const newIssues = [...prev];
           newIssues[randomIdx] = { ...issue, verifiedCount: issue.verifiedCount + 1 };
           return newIssues;
        });
      }
      
      if (Math.random() < 0.15) {
         // Random status change
         setIssues(prev => {
             const reportedIssues = prev.filter(i => i.status === 'Reported');
             if (reportedIssues.length > 0) {
                 const issue = reportedIssues[Math.floor(Math.random() * reportedIssues.length)];
                 const newIssues = prev.map(i => i.id === issue.id ? { 
                     ...i, 
                     status: 'Under Review' as Issue['status'],
                     timeline: [...i.timeline, { status: 'Under Review' as const, date: new Date().toISOString(), description: 'Issue is now under review by authorities', actor: 'System' }]
                 } : i);
                 if (issue.reporterId === user?.id) {
                     addNotification('Status Update', `Your issue "${issue.title}" is now Under Review!`, 'status', issue.id);
                 }
                 return newIssues;
             }
             return prev;
         });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, addNotification, apiAvailable, fetchIssuesFromApi]);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    apiAvailable,
    loginUser,
    registerUser,
    logoutUser,
    activeTab,
    setActiveTab,
    selectedIssueId,
    navigateToIssue,
    issues,
    addIssue,
    upvoteIssue,
    verifyIssue,
    updateIssueStatus,
    addComment,
    hasUpvoted,
    hasVerified,
    chatMessages,
    sendChatMessage,
    clearChat,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    toasts,
    addToast,
    removeToast,
    resetDemo,
  }), [user, isAuthenticated, apiAvailable, loginUser, registerUser, logoutUser, activeTab, setActiveTab, selectedIssueId, navigateToIssue, issues, addIssue, upvoteIssue, verifyIssue, updateIssueStatus, addComment, hasUpvoted, hasVerified, chatMessages, sendChatMessage, clearChat, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, searchQuery, setSearchQuery, toasts, addToast, removeToast, resetDemo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


