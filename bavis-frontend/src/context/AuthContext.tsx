import React, { createContext, useContext, useState } from 'react';
import type { UserRole, User } from '../types/bavis';
import { MOCK_USERS } from '../mock/mockData';
import { api } from '../api/client';

interface AuthContextType {
  user: User;
  role: UserRole;
  setRole: (role: UserRole) => void;
  canEditZones: boolean;
  canManageSystem: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('operator');

  const performBackendLogin = async (selectedRole: UserRole) => {
    const credentialsMap: Record<UserRole, { username: string; password: string }> = {
      operator: { username: 'operator', password: 'op123' },
      supervisor: { username: 'supervisor', password: 'super123' },
      admin: { username: 'admin', password: 'admin123' },
    };

    const creds = credentialsMap[selectedRole];
    if (creds) {
      try {
        await api.login(creds.username, creds.password);
      } catch (err) {
        console.warn('Backend login failed, using local session:', err);
      }
    }
  };

  React.useEffect(() => {
    performBackendLogin(role);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    api.setRole(newRole);
    performBackendLogin(newRole);
  };

  const user = MOCK_USERS[role];
  const canEditZones = role === 'supervisor' || role === 'admin';
  const canManageSystem = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, role, setRole, canEditZones, canManageSystem }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
