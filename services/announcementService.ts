import { supabase } from './supabaseClient';
import { Announcement } from '../types';

const LOCAL_STORAGE_KEY = 'marxism_local_announcements';

export const announcementService = {
  async getLatestAnnouncement(userRole?: string): Promise<Announcement | null> {
    if (!supabase) {
      // 如果没有 Supabase，使用本地默认公告
      return this.getLocalAnnouncement();
    }

    try {
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (userRole) {
        // If user has a role, show announcements targeted at their role OR public announcements
        query = query.or(`target_group.is.null,target_group.eq."${userRole}"`);
      } else {
        // Fallback for unexpected cases
        query = query.is('target_group', null);
      }

      const { data, error } = await query.limit(1).maybeSingle();

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
      // 数据清洗：将空字符串转换为 null，避免数据库约束错误
      const cleanData = {
        ...announcement,
        image_url: announcement.image_url?.trim() || null,
        target_group: announcement.target_group?.trim() || null,
        date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('announcements')
        .insert([cleanData]);

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
  },

  async uploadImage(file: File): Promise<string | null> {
    if (!supabase) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  }
};
