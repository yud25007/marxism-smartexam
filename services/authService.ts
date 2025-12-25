import { User, UserRole, UserStatus } from '../types';
import { supabase, DbUser, isSupabaseConfigured } from './supabaseClient';

const USERS_KEY = 'smart_exam_users';
const CURRENT_USER_KEY = 'smart_exam_current_user';

export interface StoredUser extends User {
  id: string;
  password?: string;
}

// Convert database user to app user
const dbUserToUser = (dbUser: DbUser): StoredUser => ({
  id: dbUser.id,
  username: dbUser.username,
  role: dbUser.role,
  status: dbUser.status,
  aiEnabled: dbUser.ai_enabled,
  aiModel: dbUser.ai_model as any || 'gemini-2.5-pro',
  invitedBy: dbUser.invited_by
});

// ========== 本地存储模式 ==========
const localAuth = {
  init: () => {
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
      const defaultAdmin = {
        id: 'local-admin',
        username: 'admin',
        password: '123456',
        role: 'ADMIN' as UserRole,
        status: 'ACTIVE' as UserStatus,
        aiEnabled: true,
        aiModel: 'gemini-2.5-pro'
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
    }
  },

  login: (username: string, password: string): User | null => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user && user.status !== 'PENDING') {
      const { password: _, ...safeUser } = user;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      return safeUser;
    }
    return null;
  },

  getUserStatus: (username: string): UserStatus | 'NOT_FOUND' => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.username === username);
    return user ? (user.status || 'ACTIVE') : 'NOT_FOUND';
  },

  getAllUsers: (): StoredUser[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  register: (username: string, password: string, role: UserRole, status: UserStatus, invitedBy?: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some((u: any) => u.username === username)) return false;
    users.push({ id: `local-${Date.now()}`, username, password, role, status, aiEnabled: false, aiModel: 'gemini-2.5-pro', invitedBy });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  updateAiModel: (username: string, model: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx !== -1) {
      users[idx].aiModel = model;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  updatePassword: (username: string, newPassword: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx !== -1) {
      users[idx].password = newPassword;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  updateAiAccess: (username: string, enabled: boolean): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx !== -1) {
      users[idx].aiEnabled = enabled;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  verifyPassword: (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.username === username);
    return user?.password === password;
  },

  approveUser: (username: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx !== -1) {
      users[idx].status = 'ACTIVE';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  rejectUser: (username: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUsers = users.filter((u: any) => u.username !== username);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    return true;
  }
};

// 初始化本地存储
if (!isSupabaseConfigured) {
  localAuth.init();
}

// ========== 导出的服务 ==========
export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.login(username, password);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .single();

    if (error || !data) return null;

    const user = dbUserToUser(data);
    if (user.status === 'PENDING') return null;

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  getUserStatus: async (username: string): Promise<UserStatus | 'NOT_FOUND'> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.getUserStatus(username);
    }

    const { data, error } = await supabase
      .from('users')
      .select('status')
      .eq('username', username)
      .single();

    if (error || !data) return 'NOT_FOUND';
    return data.status || 'ACTIVE';
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

  register: async (username: string, password: string, role: UserRole = 'MEMBER', status: UserStatus = 'PENDING', invitedBy?: string): Promise<{success: boolean, error?: string}> => {
    if (!isSupabaseConfigured || !supabase) {
      const res = localAuth.register(username, password, role, status, invitedBy);
      return res ? { success: true } : { success: false, error: 'USER_EXISTS' };
    }

    // Security Check: Only allow if public registration is enabled OR it's an admin-initiated registration
    const { data: regEnabled } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'public_registration')
      .maybeSingle();
    
    if (regEnabled && !regEnabled.value) {
      const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
      const isActuallyAdmin = currentUserStr && JSON.parse(currentUserStr).role === 'ADMIN';
      
      if (!isActuallyAdmin) {
        return { success: false, error: 'REGISTRATION_DISABLED' }; 
      }
    }

    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) return { success: false, error: 'USER_EXISTS' };

    const { error } = await supabase
      .from('users')
      .insert({ username, password_hash: password, role, status, ai_enabled: false, invited_by: invitedBy });

    return { success: !error, error: error ? error.message : undefined };
  },

  getAllUsers: async (): Promise<StoredUser[]> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.getAllUsers();
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(dbUserToUser);
  },

  updatePassword: async (username: string, newPassword: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.updatePassword(username, newPassword);
    }

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPassword })
      .eq('username', username);

    return !error;
  },

  updateAiAccess: async (username: string, enabled: boolean): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.updateAiAccess(username, enabled);
    }

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
  },

  updateAiModel: async (username: string, model: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.updateAiModel(username, model);
    }

    const { error } = await supabase
      .from('users')
      .update({ ai_model: model })
      .eq('username', username);

    if (!error) {
      const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.username === username) {
          currentUser.aiModel = model;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        }
      }
    }

    return !error;
  },

  updateRole: async (username: string, role: UserRole): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const idx = users.findIndex((u: any) => u.username === username);
      if (idx !== -1) {
        users[idx].role = role;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('username', username);

    return !error;
  },

  verifyPassword: async (username: string, passwordToCheck: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.verifyPassword(username, passwordToCheck);
    }

    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('username', username)
      .single();

    if (error || !data) return false;
    return data.password_hash === passwordToCheck;
  },

  approveUser: async (username: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.approveUser(username);
    }

    const { error } = await supabase
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('username', username);

    return !error;
  },

  rejectUser: async (username: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return localAuth.rejectUser(username);
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username);

    return !error;
  }
};
