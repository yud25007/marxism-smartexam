import { User, UserRole, UserStatus } from '../types';

const USERS_KEY = 'smart_exam_users';
const CURRENT_USER_KEY = 'smart_exam_current_user';

export interface StoredUser extends User {
  password: string; 
}

// Initialize default admin if not exists
const initAuth = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const defaultAdmin: StoredUser = {
      username: 'admin',
      password: '123456', // Default password
      role: 'ADMIN',
      status: 'ACTIVE',
      aiEnabled: true
    };
    const demoMember: StoredUser = {
      username: 'student',
      password: '123',
      role: 'MEMBER',
      status: 'ACTIVE',
      aiEnabled: false
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin, demoMember]));
  } else {
    // Migration for existing data without status
    const parsedUsers: StoredUser[] = JSON.parse(users);
    const updatedUsers = parsedUsers.map(u => ({
      ...u,
      status: u.status || 'ACTIVE' // Default existing users to ACTIVE
    }));
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  }
};

initAuth();

export const authService = {
  login: (username: string, password: string): User | null => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      if (user.status === 'PENDING') {
        return null; // Should be handled by UI checking status
      }

      const { password, ...safeUser } = user;
      // Ensure aiEnabled/status is present
      const currentUserData = {
        ...safeUser,
        aiEnabled: safeUser.aiEnabled ?? false,
        status: safeUser.status || 'ACTIVE'
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUserData));
      return currentUserData;
    }
    return null;
  },

  // Helper to check why login might have failed (wrong password vs pending)
  getUserStatus: (username: string): UserStatus | 'NOT_FOUND' => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username);
    return user ? (user.status || 'ACTIVE') : 'NOT_FOUND';
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

  register: (username: string, password: string, role: UserRole = 'MEMBER', status: UserStatus = 'PENDING'): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.some(u => u.username === username)) {
      return false; // User exists
    }

    const newUser: StoredUser = { 
      username, 
      password, 
      role, 
      status, 
      aiEnabled: false 
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  // --- Methods for Admin ---

  getAllUsers: (): StoredUser[] => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.map((u: StoredUser) => ({
      ...u,
      aiEnabled: u.aiEnabled ?? false,
      status: u.status || 'ACTIVE'
    }));
  },

  updatePassword: (username: string, newPassword: string): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  updateAiAccess: (username: string, enabled: boolean): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
      users[userIndex].aiEnabled = enabled;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.username === username) {
          currentUser.aiEnabled = enabled;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        }
      }
      return true;
    }
    return false;
  },

  verifyPassword: (username: string, passwordToCheck: string): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username);
    return user ? user.password === passwordToCheck : false;
  },

  // Approval Workflow
  approveUser: (username: string): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
      users[userIndex].status = 'ACTIVE';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  rejectUser: (username: string): boolean => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUsers = users.filter(u => u.username !== username); // Delete the user request
    
    if (users.length !== newUsers.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      return true;
    }
    return false;
  }
};