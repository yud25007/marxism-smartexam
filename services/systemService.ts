import { supabase } from './supabaseClient';

export interface SystemSetting {
  key: string;
  value: boolean;
  description: string;
}

export const systemService = {
  async getAllSettings(): Promise<SystemSetting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  async updateSetting(key: string, value: boolean): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('system_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
    return !error;
  },

  async isEnabled(key: string): Promise<boolean> {
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    return data?.value || false;
  }
};
