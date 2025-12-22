import { User, UserRole, UserStatus } from '../types';
import { supabase } from './supabaseClient';

const CURRENT_USER_KEY = 'smart_exam_current_user';

export interface StoredUser extends User {
  password: string;
}

// Initialize default admin if not exists (runs once on first load)
const initAuth = async () => {
  try {
    const { data: users } = await supabase.from('users').select('*').limit(1);

    if (!users || users.length === 0) {
      // Create default admin and demo user
      await supabase.from('users').insert([
        {
          username: 'admin',
          password: '123456',
          role: 'ADMIN',
          status: 'ACTIVE',
          ai_enabled: true
        },
        {
          username: 'student',
          password: '123',
          role: 'MEMBER',
          status: 'ACTIVE',
          ai_enabled: false
        }
      ]);
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

initAuth();

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !user) {
        return null;
      }

      if (user.status === 'PENDING') {
        return null;
      }

      const safeUser: User = {
        username: user.username,
        role: user.role,
        status: user.status || 'ACTIVE',
        aiEnabled: user.ai_enabled ?? false
      };

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      return safeUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  getUserStatus: async (username: string): Promise<UserStatus | 'NOT_FOUND'> => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('status')
        .eq('username', username)
        .single();

      return user ? (user.status || 'ACTIVE') : 'NOT_FOUND';
    } catch {
      return 'NOT_FOUND';
    }
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return { ...user, aiEnabled: user.aiEnabled ?? false, status: user.status || 'ACTIVE' };
  },

  register: async (username: string, password: string, role: UserRole = 'MEMBER', status: UserStatus = 'PENDING'): Promise<boolean> => {
    try {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existing) {
        return false;
      }

      const { error } = await supabase.from('users').insert({
        username,
        password,
        role,
        status,
        ai_enabled: false
      });

      return !error;
    } catch {
      return false;
    }
  },

  getAllUsers: async (): Promise<StoredUser[]> => {
    try {
      const { data: users } = await supabase.from('users').select('*');

      return (users || []).map(u => ({
        username: u.username,
        password: u.password,
        role: u.role,
        status: u.status || 'ACTIVE',
        aiEnabled: u.ai_enabled ?? false
      }));
    } catch {
      return [];
    }
  },

  updatePassword: async (username: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('username', username);

      return !error;
    } catch {
      return false;
    }
  },

  updateAiAccess: async (username: string, enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ai_enabled: enabled })
        .eq('username', username);

      if (!error) {
        const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser.username === username) {
            currentUser.aiEnabled = enabled;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
          }
        }
      }

      return !error;
    } catch {
      return false;
    }
  },

  verifyPassword: async (username: string, passwordToCheck: string): Promise<boolean> => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('password')
        .eq('username', username)
        .single();

      return user ? user.password === passwordToCheck : false;
    } catch {
      return false;
    }
  },

  approveUser: async (username: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'ACTIVE' })
        .eq('username', username);

      return !error;
    } catch {
      return false;
    }
  },

  rejectUser: async (username: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username);

      return !error;
    } catch {
      return false;
    }
  }
};
