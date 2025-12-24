import { ExamResult } from '../types';
import { supabase, DbExamHistory, isSupabaseConfigured } from './supabaseClient';

const HISTORY_KEY_PREFIX = 'smart_exam_history_';

// Convert database record to ExamResult
const dbToExamResult = (record: DbExamHistory): ExamResult => ({
  id: record.id,
  examId: record.exam_id,
  score: record.score,
  maxScore: record.max_score,
  percentage: record.percentage,
  correctCount: record.correct_count,
  incorrectCount: record.incorrect_count,
  unansweredCount: record.unanswered_count,
  answers: record.answers,
  notes: record.notes || '',
  completedAt: new Date(record.completed_at)
});

// ========== 本地存储模式 ==========
const localHistory = {
  saveResult: (username: string, result: ExamResult): void => {
    if (!username) return;
    const key = `${HISTORY_KEY_PREFIX}${username}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift(result);
    localStorage.setItem(key, JSON.stringify(history));
  },

  getHistory: (username: string): ExamResult[] => {
    if (!username) return [];
    const key = `${HISTORY_KEY_PREFIX}${username}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  clearHistory: (username: string): void => {
    if (!username) return;
    localStorage.removeItem(`${HISTORY_KEY_PREFIX}${username}`);
  },

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

// ========== 导出的服务 ==========
export const historyService = {
  saveResult: async (username: string, result: ExamResult): Promise<void> => {
    if (!username) return;

    if (!isSupabaseConfigured || !supabase) {
      localHistory.saveResult(username, result);
      return;
    }

    const { data, error } = await supabase
      .from('exam_history')
      .insert({
        username: username,
        exam_id: result.examId,
        score: result.score,
        max_score: result.maxScore,
        percentage: result.percentage,
        correct_count: result.correctCount,
        incorrect_count: result.incorrectCount,
        unanswered_count: result.unansweredCount,
        answers: result.answers,
        notes: result.notes || '',
        completed_at: result.completedAt
      })
      .select('id')
      .single();
    
    if (data) result.id = data.id;
  },

  updateNotes: async (recordId: string, notes: string): Promise<boolean> => {
    if (!recordId) return false;

    if (!isSupabaseConfigured || !supabase) {
      // Local mode update would be complex without ID, but we try based on latest
      return false; 
    }

    const { error } = await supabase
      .from('exam_history')
      .update({ notes })
      .eq('id', recordId);

    return !error;
  },

  getHistory: async (username: string): Promise<ExamResult[]> => {
    if (!username) return [];

    if (!isSupabaseConfigured || !supabase) {
      return localHistory.getHistory(username);
    }

    const { data, error } = await supabase
      .from('exam_history')
      .select('*')
      .eq('username', username)
      .order('completed_at', { ascending: false });

    if (error || !data) return [];
    return data.map(dbToExamResult);
  },

  clearHistory: async (username: string): Promise<void> => {
    if (!username) return;

    if (!isSupabaseConfigured || !supabase) {
      localHistory.clearHistory(username);
      return;
    }

    await supabase
      .from('exam_history')
      .delete()
      .eq('username', username);
  },

  getAllUserStats: async (): Promise<Record<string, number>> => {
    if (!isSupabaseConfigured || !supabase) {
      return localHistory.getAllUserStats();
    }

    const { data, error } = await supabase
      .from('exam_history')
      .select('username');

    if (error || !data) return {};

    const stats: Record<string, number> = {};
    data.forEach(record => {
      const username = record.username;
      stats[username] = (stats[username] || 0) + 1;
    });

    return stats;
  }
};
