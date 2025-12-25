import { supabase } from './supabaseClient';
import { Exam, Question } from '../types';

export const examService = {
  // 获取所有试卷列表
  async getExams(): Promise<Exam[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // 获取特定试卷的所有题目
  async getQuestions(examId: string): Promise<Question[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    // 数据库中存储的是下划线命名，这里需要适配前端的驼峰命名
    return (data || []).map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswers: q.correct_answers,
      points: q.points,
      answerText: q.answer_text
    })) as Question[];
  },

  // 更新题目的标准答案
  async updateQuestionAnswer(questionId: string, correctAnswers: number[]): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('questions')
      .update({ correct_answers: correctAnswers })
      .eq('id', questionId);
    
    return !error;
  }
};
