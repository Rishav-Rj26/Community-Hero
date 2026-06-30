import type { Issue, User, Comment, AppNotification, LeaderboardEntry } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'community_hero_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options.headers as Record<string,string> } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Auth
export const apiLogin = (email: string, password: string) =>
  apiFetch<{token: string, user: User}>('/auth/login', { method: 'POST', body: JSON.stringify({email, password}) });

export const apiRegister = (name: string, email: string, password: string, role: string) =>
  apiFetch<{token: string, user: User}>('/auth/register', { method: 'POST', body: JSON.stringify({name, email, password, role}) });

export const apiGetMe = () => apiFetch<{user: User}>('/auth/me');

// Issues
export const apiGetIssues = (filters?: {category?: string, severity?: string, status?: string}) => {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return apiFetch<{issues: Issue[]}>(`/issues${qs ? '?' + qs : ''}`);
};

export const apiGetIssue = (id: string) => apiFetch<{issue: Issue}>(`/issues/${id}`);

export const apiCreateIssue = (formData: FormData) =>
  apiFetch<{issue: Issue}>('/issues', { method: 'POST', body: formData });

export const apiUpdateIssueStatus = (id: string, status: string, notes?: string) =>
  apiFetch<{issue: Issue}>(`/issues/${id}/status`, { method: 'PUT', body: JSON.stringify({status, notes}) });

export const apiUpvoteIssue = (id: string) =>
  apiFetch<{issue: Issue, upvoted: boolean}>(`/issues/${id}/upvote`, { method: 'POST' });

export const apiVerifyIssue = (id: string, lat?: number, lng?: number) =>
  apiFetch<{issue: Issue}>(`/issues/${id}/verify`, { method: 'POST', body: JSON.stringify({lat, lng}) });

export const apiAddComment = (issueId: string, content: string) =>
  apiFetch<{comment: Comment}>(`/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify({content}) });

// Users
export const apiGetLeaderboard = () => apiFetch<{leaderboard: LeaderboardEntry[]}>('/users/leaderboard');
export const apiGetUserProfile = (id: string) => apiFetch<{user: User}>(`/users/${id}`);

// AI
export const apiAnalyzeImage = (imageData: string, mimeType: string) =>
  apiFetch<any>('/ai/analyze-image', { method: 'POST', body: JSON.stringify({imageData, mimeType}) });

export const apiChat = (message: string, context: any, history: any[]) =>
  apiFetch<{text: string, recommendations?: string[]}>('/ai/chat', { method: 'POST', body: JSON.stringify({message, context, history}) });

export const apiGetInsights = (issues: Issue[]) =>
  apiFetch<{text: string, insights: any[]}>('/ai/insights', { method: 'POST', body: JSON.stringify({issues}) });

// Notifications
export const apiGetNotifications = () => apiFetch<{notifications: AppNotification[]}>('/notifications');
export const apiMarkNotificationRead = (id: string) => apiFetch<{notification: AppNotification}>(`/notifications/${id}/read`, { method: 'PUT' });
export const apiMarkAllNotificationsRead = () => apiFetch<{success: boolean}>('/notifications/read-all', { method: 'PUT' });

// Reset
export const apiReset = () => apiFetch<{success: boolean}>('/reset', { method: 'POST' });
