import { ExamResult } from '../types';
import { supabase } from './supabaseClient';

export const historyService = {
  saveResult: async (username: string, result: ExamResult) => {
    if (!username || username.trim() === '') return;

    try {
      await supabase.from('exam_history').insert({
        username,
        exam_id: result.examId,
        exam_title: result.examTitle,
        score: result.score,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers,
        time_spent: result.timeSpent,
        completed_at: result.completedAt,
        answers: result.answers
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  },

  getHistory: async (username: string): Promise<ExamResult[]> => {
    if (!username || username.trim() === '') return [];

    try {
      const { data } = await supabase
        .from('exam_history')
        .select('*')
        .eq('username', username)
        .order('completed_at', { ascending: false });

      return (data || []).map(r => ({
        examId: r.exam_id,
        examTitle: r.exam_title,
        score: r.score,
        totalQuestions: r.total_questions,
        correctAnswers: r.correct_answers,
        timeSpent: r.time_spent,
        completedAt: r.completed_at,
        answers: r.answers
      }));
    } catch {
      return [];
    }
  },

  clearHistory: async (username: string) => {
    if (!username || username.trim() === '') return;

    try {
      await supabase
        .from('exam_history')
        .delete()
        .eq('username', username);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  getAllUserStats: async (): Promise<Record<string, number>> => {
    try {
      const { data } = await supabase
        .from('exam_history')
        .select('username');

      const stats: Record<string, number> = {};
      (data || []).forEach(r => {
        stats[r.username] = (stats[r.username] || 0) + 1;
      });
      return stats;
    } catch {
      return {};
    }
  }
};
