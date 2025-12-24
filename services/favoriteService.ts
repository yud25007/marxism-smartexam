
import { supabase, isSupabaseConfigured } from './supabaseClient';

const FAVORITES_KEY = 'smart_exam_favorites';

export const favoriteService = {
  // Get all favorite question IDs for a user
  async getFavorites(username: string): Promise<string[]> {
    if (!isSupabaseConfigured || !supabase) {
      const allFavs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}');
      return allFavs[username] || [];
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('question_id')
      .eq('username', username);

    if (error) return [];
    return data.map(item => item.question_id);
  },

  async toggleFavorite(username: string, questionId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const allFavs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}');
      const userFavs = allFavs[username] || [];
      const index = userFavs.indexOf(questionId);
      
      if (index === -1) {
        userFavs.push(questionId);
      } else {
        userFavs.splice(index, 1);
      }
      
      allFavs[username] = userFavs;
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavs));
      return true;
    }

    // Supabase logic
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('username', username)
      .eq('question_id', questionId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ username, question_id: questionId });
      return !error;
    }
  }
};
