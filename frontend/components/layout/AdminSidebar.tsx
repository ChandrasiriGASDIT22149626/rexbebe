'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ShoppingBag,
  Users,
  ArrowLeft,
  Globe2,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  Truck,
  Banknote,
  Settings2,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';
import { useAdminData } from '../../hooks/AdminContext';

interface AdminLinkGroup {
  groupTitle: string;
  links: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { visitorStats, orders, products } = useAdminData();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rexbebe_admin_token') : null;
    try {
      if (token) await authService.adminLogout(token);
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

  useEffect(() => {
    const handleOpenNav = () => setIsMobileOpen(true);
    window.addEventListener('open-admin-nav', handleOpenNav);
    return () => window.removeEventListener('open-admin-nav', handleOpenNav);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/store-overview';
    }
    if (href === '/admin/website/homepage' || href === '/admin/homepage') {
      return pathname === '/admin/homepage' || pathname.startsWith('/admin/website/homepage');
    }
    if (href === '/admin/navigation') {
      return pathname === '/admin/navigation' || pathname.startsWith('/admin/categories');
    }
    return pathname === href || (href !== '/admin' && pathname.startsWith(href.split('?')[0]));
  };

  const NAV_GROUPS: AdminLinkGroup[] = [
    {
      groupTitle: 'STORE MANAGEMENT',
      links: [
        { name: 'Store Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Global Visitor Insights', href: '/admin/visitors', icon: Globe2, badge: 'Live' },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: orders.length > 0 ? `${orders.length}` : undefined },
        { name: 'COD Orders', href: '/admin/orders/cod', icon: Banknote, badge: 'COD' },
        { name: 'Courier & Shipping', href: '/admin/shipping', icon: Truck },
        { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
      ],
    },
    {
      groupTitle: 'WEBSITE MANAGEMENT',
      links: [
        { name: 'Homepage Studio', href: '/admin/homepage', icon: Sparkles, badge: 'Studio' },
        { name: 'Categories & Menu', href: '/admin/navigation', icon: FolderTree, badge: 'Header' },
        { name: 'Product Management', href: '/admin/products', icon: Package, badge: `${products.length}` },
      ],
    },
    {
      groupTitle: 'LOGISTICS & FINANCE',
      links: [
        { name: 'COD Financial Reports', href: '/admin/reports/cod', icon: Banknote, badge: 'COD' },
        { name: 'Returns & RTS Center', href: '/admin/returns', icon: RotateCcw, badge: 'RTS' },
        { name: 'Customers', href: '/admin/customers', icon: Users },
      ],
    },
    {
      groupTitle: 'ADMIN SETTINGS',
      links: [
        { name: 'Admin Users & Permissions', href: '/admin/users', icon: ShieldCheck },
        { name: 'Delivery Zones & Charges', href: '/admin/settings/delivery', icon: Settings2 },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#18181B] text-stone-300 overflow-hidden pointer-events-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-stone-800 bg-[#121214] flex items-center justify-between shrink-0">
        <Link href="/admin" className="block group">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center text-white font-black text-sm shadow-md">
              🦕
            </div>
            <div>
              <h2 className="font-heading text-lg font-black tracking-wider text-white group-hover:text-amber-400 transition-colors">
                REXBEBE
              </h2>
              <span className="text-[9px] uppercase tracking-widest text-amber-400/90 font-bold block -mt-0.5">
                Admin Control Suite
              </span>
            </div>
          </div>
        </Link>
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
            aria-label="Close Admin Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto scrollbar-none touch-scroll min-h-0 pointer-events-auto">
        {/* Global Live Traffic Badge */}
        <div className="p-4 mx-4 mt-4 bg-stone-900/90 rounded-2xl border border-stone-800 flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-stone-300">Live Traffic</span>
          </div>
          <Link
            href="/admin/visitors"
            prefetch={false}
            onClick={() => setIsMobileOpen(false)}
            className="text-[11px] font-extrabold text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>{visitorStats.totalVisits || 6} Visitors</span>
          </Link>
        </div>

        {/* Navigation Link Groups */}
        <div className="p-4 space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">
                {group.groupTitle}
              </h3>
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={false}
                    onClick={() => {
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer pointer-events-auto select-none ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                        : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 active:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 pointer-events-none">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                      <span>{link.name}</span>
                    </div>
                    {link.badge && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full pointer-events-none ${
                          isActive
                            ? 'bg-stone-950/20 text-stone-950'
                            : 'bg-stone-800 text-amber-400 border border-stone-700/60'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 border-t border-stone-800 bg-[#121214] shrink-0 space-y-2 pointer-events-auto">
        <Link
          href="/"
          target="_blank"
          prefetch={false}
          className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-bold transition-all border border-stone-800 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Storefront</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white text-xs font-bold transition-all border border-rose-900/50 shadow-sm cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanently Fixed in Position with elevated z-40) */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r border-stone-800 h-screen fixed inset-y-0 left-0 z-40 flex-col pointer-events-auto">
        {sidebarContent}
      </aside>

      {/* Desktop Layout Spacer: preserves exact column width & prevents content overlap */}
      <div className="hidden lg:block w-72 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Mobile Drawer Trigger (Floating Action Button) */}
      <div className="lg:hidden fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-3.5 bg-stone-900 text-white rounded-full shadow-2xl border border-stone-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
          aria-label="Toggle Admin Navigation Drawer"
        >
          <Menu className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Mobile Drawer (Accessible via open-admin-nav event or floating button) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex pointer-events-auto">
          <div
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#18181B] z-10 shadow-2xl pointer-events-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
