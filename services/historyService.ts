import { ExamResult } from '../types';

const HISTORY_KEY_PREFIX = 'smart_exam_history_';

// Helper to ensure we always get a valid user-scoped key
const getUserKey = (username: string): string | null => {
  if (!username || username.trim() === '') return null;
  return `${HISTORY_KEY_PREFIX}${username}`;
};

export const historyService = {
  saveResult: (username: string, result: ExamResult) => {
    const key = getUserKey(username);
    if (!key) return; // Do not save if no valid username

    const historyStr = localStorage.getItem(key);
    const history: ExamResult[] = historyStr ? JSON.parse(historyStr) : [];
    
    // Add new result to the beginning
    history.unshift(result);
    
    localStorage.setItem(key, JSON.stringify(history));
  },

  getHistory: (username: string): ExamResult[] => {
    const key = getUserKey(username);
    if (!key) return []; // Return empty if no valid username

    const historyStr = localStorage.getItem(key);
    return historyStr ? JSON.parse(historyStr) : [];
  },

  clearHistory: (username: string) => {
    const key = getUserKey(username);
    if (!key) return;
    localStorage.removeItem(key);
  },

  // For Admin Dashboard: Iterates all keys to find stats.
  // This is safe because it only reads metadata (count) and is only used by Admin.
  getAllUserStats: (): Record<string, number> => {
    const stats: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HISTORY_KEY_PREFIX)) {
        const username = key.replace(HISTORY_KEY_PREFIX, '');
        if (username) {
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            stats[username] = history.length;
        }
      }
    }
    return stats;
  }
};