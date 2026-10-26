'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Sparkles,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';
import { authService, AdminUser } from '../../services/authService';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const router = useRouter();
  const { visitorStats } = useAdminData();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('rexbebe_admin_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse current admin user:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rexbebe_admin_token') : null;
    try {
      if (token) {
        await authService.adminLogout(token);
      }
    } catch (e) {
      console.warn('Logout API notice:', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rexbebe_admin_token');
        localStorage.removeItem('rexbebe_admin_user');
        document.cookie = 'rexbebe_admin_token=; path=/; max-age=0; SameSite=Strict';
      }
      router.replace('/admin/login?reason=logout');
    }
  };

  const displayName = currentUser?.name || 'Rexbebe Admin';
  const displayEmail = currentUser?.email || 'admin@rexbebe.com';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'AD';

  return (
    <header className="bg-white border-b border-stone-200/90 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-30 shadow-2xs">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 2xl:gap-4 w-full">
        {/* Left: Mobile Trigger + Page Title + Portal Badge + Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-admin-nav'));
              }
            }}
            className="lg:hidden p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors focus:outline-none shrink-0 cursor-pointer"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5 text-stone-700" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold font-heading text-stone-900 tracking-tight whitespace-nowrap">
                {title}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Admin Portal</span>
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5 font-medium line-clamp-1 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions, System Tools & User Profile */}
        <div className="flex items-center justify-between 2xl:justify-end flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 w-full 2xl:w-auto shrink-0">
          {/* Page-Specific Actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}

          {/* Quick System Tools & Session Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick System Tools (Live Visitors & View Store) */}
            <Link
              href="/admin/analytics"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-semibold shrink-0 shadow-2xs"
              title="View live visitors & countries"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{visitorStats.liveVisitors}</span>
              <span className="hidden sm:inline">Live</span>
              <span className="hidden 2xl:inline">Visitors</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs shrink-0"
              title="Open Public Storefront in new tab"
            >
              <span className="hidden sm:inline">View Live Store</span>
              <span className="sm:hidden">Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            </Link>

            {/* Vertical Divider (2xl Only) */}
            <div className="hidden 2xl:block h-6 w-px bg-stone-200 shrink-0 mx-0.5" aria-hidden="true" />

            {/* Admin User Profile & Logout */}
            <div className="h-9 flex items-center gap-2 px-2.5 rounded-xl bg-stone-50 border border-stone-200/90 shadow-2xs shrink-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center font-black text-[10px] shadow-xs shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left max-w-[110px] lg:max-w-[130px] xl:max-w-[150px]">
                <p className="text-xs font-bold text-stone-900 leading-none truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-none truncate" title={displayEmail}>
                  {displayEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Sign out of administrative console"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
