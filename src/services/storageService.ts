export const STORAGE_KEYS = {
  TOKEN: 'community_hero_token',
  CURRENT_USER: 'community_hero_user',
  ISSUES: 'community_hero_issues',
  USER_UPVOTES: 'community_hero_upvotes',
  USER_VERIFICATIONS: 'community_hero_verifications',
  CHAT_HISTORY: 'community_hero_chat',
  NOTIFICATIONS: 'community_hero_notifications',
  USE_API: 'community_hero_use_api',
} as const;

export function saveToStorage<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn('Storage save failed:', e); }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

export function removeFromStorage(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}
