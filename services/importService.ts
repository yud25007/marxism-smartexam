import { supabase } from './supabaseClient';
import { EXAMS } from '../constants';

export const importService = {
  async syncToCloud(): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: "Supabase 未配置" };

    try {
      for (const exam of EXAMS) {
        // 1. 插入或更新试卷
        const { error: examError } = await supabase
          .from('exams')
          .upsert({
            id: exam.id,
            title: exam.title,
            description: exam.description,
            category: exam.category,
            duration_minutes: exam.durationMinutes,
            difficulty: exam.difficulty,
            cover_image: exam.coverImage
          });

        if (examError) throw examError;

        // 2. 批量插入或更新题目
        const questionData = exam.questions.map(q => ({
          id: q.id,
          exam_id: exam.id,
          type: q.type,
          text: q.text,
          options: q.options,
          correct_answers: q.correctAnswers,
          points: q.points,
          answer_text: q.answerText
        }));

        const { error: qError } = await supabase
          .from('questions')
          .upsert(questionData);

        if (qError) throw qError;
      }

      return { success: true, message: "同步成功！所有题目已存入云端。" };
    } catch (err: any) {
      console.error("Sync error:", err);
      return { success: false, message: `同步失败: ${err.message}` };
    }
  }
};
