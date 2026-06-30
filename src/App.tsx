import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard').then((module) => ({ default: module.CitizenDashboard })));
const AuthorityDashboard = lazy(() => import('./pages/AuthorityDashboard').then((module) => ({ default: module.AuthorityDashboard })));
const ReportIssuePage = lazy(() => import('./pages/ReportIssuePage').then((module) => ({ default: module.ReportIssuePage })));
const CommunityFeed = lazy(() => import('./pages/CommunityFeed').then((module) => ({ default: module.CommunityFeed })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then((module) => ({ default: module.AIAssistantPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const IssueDetailsPage = lazy(() => import('./pages/IssueDetailsPage').then((module) => ({ default: module.IssueDetailsPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then((module) => ({ default: module.LeaderboardPage })));
const MapWidget = lazy(() => import('./components/MapWidget').then((module) => ({ default: module.MapWidget })));
const FloatingAI = lazy(() => import('./components/FloatingAI').then((module) => ({ default: module.FloatingAI })));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="h-3 w-3 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-sm font-medium">Loading workspace...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, addToast } = useApp();
  React.useEffect(() => {
    if (!isAuthenticated) {
      addToast('Sign In Required', 'Please sign in to access this feature.', 'warning');
    }
  }, [isAuthenticated, addToast]);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { activeTab } = useApp(); // Used by Navbar and Sidebar for active states

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/authority-dashboard" element={<ProtectedRoute><AuthorityDashboard /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportIssuePage /></ProtectedRoute>} />
        <Route path="/feed" element={<CommunityFeed />} />
        <Route path="/map" element={<ProtectedRoute><div className="h-[calc(100vh-100px)]"><MapWidget /></div></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/issue-details" element={<IssueDetailsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/20 relative flex flex-col">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-300/24 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[30%] -left-[10%] w-[40%] h-[40%] bg-violet-300/24 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute -bottom-[20%] right-[20%] w-[60%] h-[60%] bg-emerald-200/28 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzOGMtMS4yMzggMC0yLjM2Ny0uMzE4LTMuMzIzLS44NjdMMzUgMzQuNTcyVjI2aC04djUuMzEzbC0yLjY1NiA1Ljg1M0EyMC4wNzQgMjAuMDc0IDAgMCAxIDE1IDI1LjE1NlYyMmg4djIuMTM4bDIuMjgzLTMuODQyQTE5LjkyNyAxOS45MjcgMCAwIDEgMjUgMTBjMy4zMyAwIDYuNDk4LjgyIDkuMzIzIDIuMzgyTDMyIDE0LjYyNlYyMmguOThjMS4xMzgtMi4xNDIgMy4yMjMtMy41IDUuNTItMy41IDEuMzQgMCAyLjU4Mi40NTYgMy41ODUgMS4yNDdsMi4xNC0zLjA2YTE5LjkyNyAxOS45MjcgMCAwIDEtMy4zMDItNS41NTNsLTIuNjU0IDMuNTEzQTIwLjA3NCAyMC4wNzQgMCAwIDEgNDggMjV2NWgtOHY1LjMyMmwyLjQwNCAzLjQxNUEyMC4wNzQgMjAuMDc0IDAgMCAxIDQxIDM4Yy0xLjM2IDAtMi42MzctLjMzNC0zLjgwOC0uOTI1TDM2LjgzIDM2LjVaIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiLz48L2c+PC9zdmc+')] opacity-50"></div>
      </div>

      <div className="relative z-10 flex-1 flex w-full">
        <Navbar />
        <Sidebar />
        <main className="flex-1 md:ml-64 pt-20 px-4 md:px-8 transition-all min-h-screen">
          <Suspense fallback={<PageFallback />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      <Suspense fallback={null}>
        <FloatingAI />
      </Suspense>
      <ToastContainer />
    </div>
  );
}

export default AppContent;