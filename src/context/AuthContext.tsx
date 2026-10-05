import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  quickLoginAs: (role: UserRole) => void;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    groupName?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

// Pre-defined users for instant login & tests
export const DEMO_USERS: Record<UserRole, User> = {
  student: {
    id: 'usr-student-1',
    name: 'Azizbek Aliyev',
    email: 'student@testhub.uz',
    role: 'student',
    groupName: '9-A Guruh',
    phone: '+998 90 123 45 67',
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  teacher: {
    id: 'usr-teacher-1',
    name: 'Dilshodbek Rustamov',
    email: 'teacher@testhub.uz',
    role: 'teacher',
    groupName: 'Matematika & IT kafedrasi',
    phone: '+998 93 987 65 43',
    createdAt: '2026-08-15T09:00:00.000Z',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Tizim Administratori',
    email: 'admin@testhub.uz',
    role: 'admin',
    groupName: 'Boshqaruv markazi',
    phone: '+998 71 200 00 00',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('testhub_auth_user');
      return saved ? JSON.parse(saved) : DEMO_USERS.student; // Default logged in as student for instant preview experience
    } catch {
      return DEMO_USERS.student;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('testhub_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('testhub_auth_user');
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Smooth realistic latency

    const cleanEmail = email.trim().toLowerCase();

    // Check pre-configured demo credentials or registered users
    let matchedUser: User | null = null;

    if (cleanEmail === 'student@testhub.uz' || cleanEmail === 'student' || cleanEmail.includes('azizbek')) {
      matchedUser = DEMO_USERS.student;
    } else if (cleanEmail === 'teacher@testhub.uz' || cleanEmail === 'teacher' || cleanEmail.includes('dilshod')) {
      matchedUser = DEMO_USERS.teacher;
    } else if (cleanEmail === 'admin@testhub.uz' || cleanEmail === 'admin') {
      matchedUser = DEMO_USERS.admin;
    } else {
      // Check stored custom users in localStorage
      try {
        const customUsers: User[] = JSON.parse(localStorage.getItem('testhub_custom_users') || '[]');
        const found = customUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (found) {
          matchedUser = found;
        }
      } catch {
        // ignore
      }
    }

    if (!matchedUser) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Kiritilgan email yoki parol noto\'g\'ri. Iltimos, qaytadan tekshirib ko\'ring.',
      };
    }

    if (password.length < 4) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak.',
      };
    }

    setCurrentUser(matchedUser);
    setIsLoading(false);
    return {
      success: true,
      message: `Xush kelibsiz, ${matchedUser.name}!`,
    };
  };

  const quickLoginAs = (role: UserRole) => {
    const user = DEMO_USERS[role];
    setCurrentUser(user);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    groupName?: string;
  }): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 650));

    if (!data.name.trim()) {
      setIsLoading(false);
      return { success: false, message: 'Iltimos, to\'liq ism va familiyangizni kiriting.' };
    }

    if (!data.email.includes('@')) {
      setIsLoading(false);
      return { success: false, message: 'Iltimos, to\'g\'ri elektron pochta manzilini kiriting.' };
    }

    if (data.password.length < 4) {
      setIsLoading(false);
      return { success: false, message: 'Parol kamida 4 ta belgidan iborat bo\'lishi shart.' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      groupName: data.groupName || (data.role === 'student' ? '9-A Guruh' : 'Kafedra'),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing: User[] = JSON.parse(localStorage.getItem('testhub_custom_users') || '[]');
      existing.push(newUser);
      localStorage.setItem('testhub_custom_users', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setCurrentUser(newUser);
    setIsLoading(false);
    return {
      success: true,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('testhub_auth_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        quickLoginAs,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
