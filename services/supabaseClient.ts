import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 使用 Vite 的 import.meta.env 读取环境变量
const supabaseUrl = (import.meta as any).env?.SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.SUPABASE_ANON_KEY || '';

// 检查是否配置了 Supabase
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// 创建 Supabase 客户端（如果未配置则创建一个 dummy 客户端）
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase 未配置，系统将使用本地存储模式。');
}

export const supabase = supabaseInstance;

// Database types
export interface DbUser {
  id: string;
  username: string;
  password_hash: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING';
  ai_enabled: boolean;
  ai_model?: string;
  invited_by?: string;
  created_at: string;
}

export interface DbExamHistory {
  id: string;
  username: string;
  exam_id: string;
  score: number;
  max_score: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  answers: Record<string, number[]>;
  completed_at: string;
}
