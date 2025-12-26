
import { supabase } from './supabaseClient';

export interface ExamPermission {
  exam_id: string;
  is_public: boolean;
  min_role: 'ADMIN' | 'MEMBER';
}

export const permissionService = {
  async getAllPermissions(): Promise<Record<string, ExamPermission>> {
    try {
      const { data, error } = await supabase
        .from('exam_permissions')
        .select('*');
      
      if (error) throw error;
      
      const permissionMap: Record<string, ExamPermission> = {};
      data.forEach(p => {
        permissionMap[p.exam_id] = p;
      });
      return permissionMap;
    } catch (err) {
      console.error('获取权限失败:', err);
      return {}; // 失败时返回空，代码将按默认逻辑处理
    }
  },

  async getPermission(examId: string): Promise<ExamPermission | null> {
    try {
      const { data, error } = await supabase
        .from('exam_permissions')
        .select('*')
        .eq('exam_id', examId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      return data;
    } catch (err) {
      console.warn('查询单章权限失败:', err);
      return null;
    }
  }
};
