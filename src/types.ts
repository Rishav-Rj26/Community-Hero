/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ── Type Aliases ──────────────────────────────────────────────
export type IssueStatus = 'Reported' | 'Under Review' | 'In Progress' | 'Resolved';
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type UserRole = 'Citizen' | 'Authority';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type AppTab =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'report'
  | 'issue-details'
  | 'map'
  | 'feed'
  | 'ai-assistant'
  | 'authority-dashboard'
  | 'profile'
  | 'leaderboard';

// ── Core Data Models ──────────────────────────────────────────

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  role: UserRole;
}

export interface TimelineEvent {
  status: IssueStatus;
  date: string;
  description: string;
  actor?: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  status: IssueStatus;
  location: LocationInfo;
  imageUrl: string;
  videoUrl?: string;
  mediaUrls?: string[];
  aiConfidence: number;
  aiDescription: string;
  department: string;
  upvotes: number;
  upvotedBy: string[];
  verifiedCount: number;
  verifiedBy: string[];
  isVerifiedByAuthority: boolean;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedNotes?: string;
  assignedTo?: string;
  estimatedResolutionDays?: number;
  timeline: TimelineEvent[];
  comments: Comment[];
}

// ── User & Gamification ───────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  threshold: number;
  dateEarned?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  points: number;
  badges: Badge[];
  avatar: string;
  joinedAt: string;
  streak: number;
  lastActiveDate: string;
  issuesReported: number;
  issuesVerified: number;
  commentsPosted: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  issuesReported: number;
  issuesVerified: number;
  badgeCount: number;
  rank: number;
}

// ── Chat ──────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// ── Notifications ─────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'status' | 'status_change' | 'verification' | 'comment' | 'badge' | 'system';
  issueId?: string;
  read: boolean;
  createdAt: string;
}

// ── Predictive Insights ───────────────────────────────────────

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  type: 'hotspot' | 'trend' | 'seasonal' | 'resource';
  icon: string;
}

// ── Input Types ───────────────────────────────────────────────

export interface NewIssueInput {
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  location: LocationInfo;
  imageUrl: string;
  videoUrl?: string;
  mediaUrls?: string[];
  aiConfidence: number;
  aiDescription: string;
  department: string;
}

// ── Toast ─────────────────────────────────────────────────────

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}


