import { ExamResult } from '../types';
import { supabase, DbExamHistory, isSupabaseConfigured } from './supabaseClient';

const HISTORY_KEY_PREFIX = 'smart_exam_history_';

// Convert database record to ExamResult
const dbToExamResult = (record: DbExamHistory): ExamResult => ({
  examId: record.exam_id,
  score: record.score,
  maxScore: record.max_score,
  percentage: record.percentage,
  correctCount: record.correct_count,
  incorrectCount: record.incorrect_count,
  unansweredCount: record.unanswered_count,
  answers: record.answers,
  completedAt: new Date(record.completed_at)
});

// ========== 本地存储模式 ==========
const localHistory = {
  saveResult: (userId: string, result: ExamResult): void => {
    if (!userId) return;
    const key = `${HISTORY_KEY_PREFIX}${userId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift(result);
    localStorage.setItem(key, JSON.stringify(history));
  },

  getHistory: (userId: string): ExamResult[] => {
    if (!userId) return [];
    const key = `${HISTORY_KEY_PREFIX}${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  clearHistory: (userId: string): void => {
    if (!userId) return;
    localStorage.removeItem(`${HISTORY_KEY_PREFIX}${userId}`);
  },

  getAllUserStats: (): Record<string, number> => {
    const stats: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HISTORY_KEY_PREFIX)) {
        const userId = key.replace(HISTORY_KEY_PREFIX, '');
        if (userId) {
          const history = JSON.parse(localStorage.getItem(key) || '[]');
          stats[userId] = history.length;
        }
      }
    }
    return stats;
  }
};

// ========== 导出的服务 ==========
export const historyService = {
  saveResult: async (userId: string, result: ExamResult): Promise<void> => {
    if (!userId) return;

    if (!isSupabaseConfigured || !supabase) {
      localHistory.saveResult(userId, result);
      return;
    }

    await supabase
      .from('exam_history')
      .insert({
        user_id: userId,
        exam_id: result.examId,
        score: result.score,
        max_score: result.maxScore,
        percentage: result.percentage,
        correct_count: result.correctCount,
        incorrect_count: result.incorrectCount,
        unanswered_count: result.unansweredCount,
        answers: result.answers,
        completed_at: result.completedAt
      });
  },

  getHistory: async (userId: string): Promise<ExamResult[]> => {
    if (!userId) return [];

    if (!isSupabaseConfigured || !supabase) {
      return localHistory.getHistory(userId);
    }

    const { data, error } = await supabase
      .from('exam_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error || !data) return [];
    return data.map(dbToExamResult);
  },

  clearHistory: async (userId: string): Promise<void> => {
    if (!userId) return;

    if (!isSupabaseConfigured || !supabase) {
      localHistory.clearHistory(userId);
      return;
    }

    await supabase
      .from('exam_history')
      .delete()
      .eq('user_id', userId);
  },

  getAllUserStats: async (): Promise<Record<string, number>> => {
    if (!isSupabaseConfigured || !supabase) {
      return localHistory.getAllUserStats();
    }

    const { data, error } = await supabase
      .from('exam_history')
      .select('user_id');

    if (error || !data) return {};

    const stats: Record<string, number> = {};
    data.forEach(record => {
      const userId = record.user_id;
      stats[userId] = (stats[userId] || 0) + 1;
    });

    return stats;
  }
};
