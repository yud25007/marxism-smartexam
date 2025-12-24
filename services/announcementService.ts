import { supabase } from './supabaseClient';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'important';
  is_active?: boolean;
}

const LOCAL_STORAGE_KEY = 'marxism_local_announcements';

export const announcementService = {
  async getLatestAnnouncement(): Promise<Announcement | null> {
    if (!supabase) {
      // 如果没有 Supabase，使用本地默认公告
      return this.getLocalAnnouncement();
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching announcement:', err);
      return this.getLocalAnnouncement();
    }
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching all announcements:', err);
      return [];
    }
  },

  async saveAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{ ...announcement, date: new Date().toISOString().split('T')[0] }]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error saving announcement:', err);
      return false;
    }
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting announcement:', err);
      return false;
    }
  },

  getLocalAnnouncement(): Announcement {
    return {
      id: 'default-1',
      title: '系统公告',
      content: '欢迎使用马克思主义基本原理在线智能刷题系统！',
      date: new Date().toISOString().split('T')[0],
      type: 'info'
    };
  }
};
