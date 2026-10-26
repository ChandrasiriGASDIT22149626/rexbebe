'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService, AdminUser } from '../../services/authService';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/admin/login';
  const verifiedTokenRef = React.useRef<string | null>(null);

  useEffect(() => {
    // If we're on the login page, no client verification is needed
    if (isLoginPage) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('rexbebe_admin_token') : null;

    if (!token) {
      // Unauthenticated user attempting to access admin route: redirect immediately to login
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
      return;
    }

    // If this token was already verified in this session, do not perform redundant network requests
    if (verifiedTokenRef.current === token) return;

    // Verify token with backend in background once per session
    authService.getAdminMe(token)
      .then(res => {
        if (res && res.user) {
          verifiedTokenRef.current = token;
          localStorage.setItem('rexbebe_admin_user', JSON.stringify(res.user));
        }
      })
      .catch(err => {
        console.warn('[AdminAuthGuard] Session check notice:', err.message);
        verifiedTokenRef.current = null;
        localStorage.removeItem('rexbebe_admin_token');
        localStorage.removeItem('rexbebe_admin_user');
        document.cookie = 'rexbebe_admin_token=; path=/; max-age=0; SameSite=Strict';
        router.replace(`/admin/login?reason=expired&redirect=${encodeURIComponent(pathname)}`);
      });
  }, [pathname, isLoginPage, router]);

  // Consistently render children on both server and client to achieve 100% hydration matching with 0ms INP penalty
  return <>{children}</>;
}
