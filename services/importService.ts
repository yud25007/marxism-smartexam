import { supabase } from './supabaseClient';
import { EXAMS } from '../constants';
import { QuestionType } from '../types';

export const importService = {
  // 之前的同步逻辑保持不变...
  async syncToCloud(): Promise<{ success: boolean; message: string }> {
    // ... (保持原有代码)
    return { success: true, message: "同步成功" };
  },

  // 新增：从大型 JSON 文件导入
  async importFromExternalJson(jsonData: any[]): Promise<{ success: boolean; count: number; message: string }> {
    if (!supabase) return { success: false, count: 0, message: "Supabase 未配置" };

    try {
      // 1. 创建一个默认的“全量导入章节”
      const examId = "external_full_import";
      await supabase.from('exams').upsert({
        id: examId,
        title: "全量导入题库",
        description: `从外部 JSON 导入的题目，共 ${jsonData.length} 道`,
        category: "全量库",
        difficulty: "Medium"
      });

      // 2. 分批处理（分块上传，每块 100 题，防止数据库报错）
      const batchSize = 100;
      let totalImported = 0;

      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        const questionData = batch.map((q: any) => {
          // 转换字母答案 A, B 为索引 0, 1
          const correctAnswers = Array.isArray(q.answer) 
            ? q.answer.map((a: string) => a.charCodeAt(0) - 65)
            : [];

          return {
            id: `ext_${q.id}`,
            exam_id: examId,
            type: correctAnswers.length > 1 ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
            text: q.question,
            options: [
              q.options.A ? `A. ${q.options.A}` : null,
              q.options.B ? `B. ${q.options.B}` : null,
              q.options.C ? `C. ${q.options.C}` : null,
              q.options.D ? `D. ${q.options.D}` : null
            ].filter(Boolean),
            correct_answers: correctAnswers,
            points: 2
          };
        });

        const { error } = await supabase.from('questions').upsert(questionData);
        if (error) throw error;
        totalImported += questionData.length;
      }

      return { success: true, count: totalImported, message: "全量题库导入成功！" };
    } catch (err: any) {
      console.error("Import error:", err);
      return { success: false, count: 0, message: err.message };
    }
  }
};
