'use client';

import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>({
    id: 'user-1',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    role: 'CUSTOMER',
  });

  const login = (userData: any) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    login,
    logout,
  };
}
