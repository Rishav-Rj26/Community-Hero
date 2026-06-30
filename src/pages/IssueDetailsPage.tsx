import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { ArrowLeft, MapPin, ThumbsUp, ShieldCheck, Share2, MessageSquare, Zap, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function IssueDetailsPage() {
  const { 
    issues, 
    selectedIssueId, 
    setActiveTab, 
    user, 
    upvoteIssue, 
    verifyIssue, 
    hasUpvoted, 
    hasVerified,
    addComment,
    updateIssueStatus,
    addToast
  } = useApp();

  const [commentInput, setCommentInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const issue = issues.find(i => i.id === selectedIssueId);

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Issue Not Found</h2>
        <p className="text-slate-400 mb-6">This issue might have been removed or doesn't exist.</p>
        <button onClick={() => setActiveTab('feed')} className="text-indigo-400 hover:text-indigo-300">Return to Feed</button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`Check out this issue on Community Hero: ${issue.title}`);
    addToast('Link Copied', 'Issue link copied to clipboard!', 'success');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(issue.id, commentInput);
    setCommentInput('');
  };

  const handleVerifyClick = () => {
    if (!user) {
      addToast('Sign In Required', 'Please sign in to verify issues', 'warning');
      return;
    }
    
    if (user.role === 'Authority') {
       verifyIssue(issue.id);
       return;
    }
    
    setIsVerifying(true);
    addToast('Checking Location', 'Please allow location access to verify this issue...', 'info');
    
    if (!navigator.geolocation) {
       addToast('Error', 'Geolocation is not supported by your browser', 'error');
       setIsVerifying(false);
       return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
         setIsVerifying(false);
         verifyIssue(issue.id, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
         setIsVerifying(false);
         if (error.code === error.PERMISSION_DENIED) {
           addToast('Permission Denied', 'Location access is required to verify issues to prevent fraud.', 'error');
         } else {
           addToast('Error', 'Could not get your location. Please try again.', 'error');
         }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-4">
      
      {/* Header Bar */}
      <button 
        onClick={() => setActiveTab('feed')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Feed
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title & Badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded border ${
                issue.status === 'Resolved' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : issue.status === 'In Progress' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : issue.status === 'Under Review' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}>{issue.status}</span>
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">{issue.category}</span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded border ${
                issue.severity === 'Critical' ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                : issue.severity === 'High' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : issue.severity === 'Medium' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              }`}>{issue.severity} Severity</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">{issue.title}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} /> {issue.location.address}
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800">
            {issue.videoUrl ? (
               <video src={issue.videoUrl} controls className="w-full max-h-[500px] object-cover" />
            ) : (
               <img src={issue.imageUrl} alt={issue.title} className="w-full max-h-[500px] object-cover" />
            )}
          </div>

          {/* AI Analysis Card */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 to-purple-900/10">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-2 uppercase tracking-wider">
              <Zap size={16} /> AI Analysis
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">{issue.aiDescription}</p>
            <div className="flex gap-4 text-xs font-medium">
              <span className="text-slate-400">Confidence: <span className="text-emerald-400">{(issue.aiConfidence * 100).toFixed(0)}%</span></span>
              <span className="text-slate-400">Assigned: <span className="text-white">{issue.department}</span></span>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Reporter's Description</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{issue.description}</p>
          </div>

          {/* Comments Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-400" /> Discussion ({issue.comments.length})
            </h3>
            
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8 flex gap-3">
                <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-800" alt="You" />
                <div className="flex-1">
                  <textarea 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add to the discussion..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={!commentInput.trim()} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-slate-800/50 rounded-xl text-center text-sm text-slate-400 border border-slate-700">
                Please <button onClick={() => setActiveTab('auth')} className="text-indigo-400 hover:underline">sign in</button> to join the discussion.
              </div>
            )}

            <div className="space-y-6">
              {issue.comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <img src={comment.authorAvatar} className="w-10 h-10 rounded-full bg-slate-800" alt={comment.authorName} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{comment.authorName}</span>
                      {comment.role === 'Authority' && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded uppercase font-bold">Authority</span>}
                      <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
            <button 
              onClick={() => upvoteIssue(issue.id)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${hasUpvoted(issue.id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <ThumbsUp size={18} className={hasUpvoted(issue.id) ? 'fill-current' : ''} />
              Upvote ({issue.upvotes})
            </button>
            <button 
              onClick={handleVerifyClick}
              disabled={issue.reporterId === user?.id || hasVerified(issue.id) || isVerifying}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${hasVerified(issue.id) ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <ShieldCheck size={18} className={hasVerified(issue.id) ? 'fill-current' : ''} />
              {isVerifying ? 'Checking...' : hasVerified(issue.id) ? 'Verified' : 'Verify'} ({issue.verifiedCount})
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              <Share2 size={18} /> Share
            </button>
          </div>

          {/* Authority Actions */}
          {user?.role === 'Authority' && (
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-400" /> Authority Controls
              </h3>
              <div className="space-y-2">
                <button onClick={() => updateIssueStatus(issue.id, 'Under Review')} disabled={issue.status === 'Under Review'} className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg border border-amber-500/20 disabled:opacity-50 transition-colors">Mark Under Review</button>
                <button onClick={() => updateIssueStatus(issue.id, 'In Progress')} disabled={issue.status === 'In Progress'} className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg border border-blue-500/20 disabled:opacity-50 transition-colors">Mark In Progress</button>
                <button onClick={() => updateIssueStatus(issue.id, 'Resolved')} disabled={issue.status === 'Resolved'} className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20 disabled:opacity-50 transition-colors">Mark Resolved</button>
              </div>
            </div>
          )}

          {/* Reporter Info */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <img src={issue.reporterAvatar} className="w-12 h-12 rounded-full bg-slate-800" alt={issue.reporterName} />
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Reported by</div>
              <div className="font-bold text-white">{issue.reporterName}</div>
              <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</div>
            </div>
          </div>

          {/* Mini Map */}
          <div className="glass-panel p-1 rounded-2xl overflow-hidden border border-slate-700">
             <div className="h-[200px] rounded-xl overflow-hidden relative">
                <LeafletMap issues={[issue]} height="100%" zoom={15} centerLat={issue.location.lat} centerLng={issue.location.lng} />
             </div>
          </div>

          {/* Timeline */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" /> Timeline
            </h3>
            <div className="space-y-4">
              {issue.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {idx !== issue.timeline.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-[-16px] w-[2px] bg-slate-700"></div>
                  )}
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 z-10 border-[3px] border-slate-900 ${
                    event.status === 'Resolved' ? 'bg-emerald-500' :
                    event.status === 'In Progress' ? 'bg-blue-500' :
                    event.status === 'Under Review' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white text-sm">{event.status}</span>
                      <span className="text-[10px] text-slate-500">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-1">{event.description}</p>
                    <p className="text-[10px] text-slate-500 font-medium">by {event.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
