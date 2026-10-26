'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogIn, UserPlus, Package, MapPin, Heart, Settings, LogOut, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function AccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 text-slate-800 hover:text-sky-600 bg-white/75 hover:bg-white/95 rounded-full transition-all border border-white/90 focus:outline-none flex items-center justify-center shadow-sm"
        aria-label="Account options"
      >
        <User className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white/98 backdrop-blur-xl rounded-3xl shadow-pastel-lg border border-purple-100/90 z-50 py-3 text-purple-950 transition-all animate-fadeIn">
          {isAuthenticated ? (
            <div>
              {/* Profile Header */}
              <div className="px-4 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-3xl">
                <p className="text-xs font-bold text-purple-950">{user?.name || 'Valued Guest'}</p>
                <p className="text-[11px] text-purple-600 truncate">{user?.email || 'customer@rexbebe.com'}</p>
              </div>

              {/* Logged In Links */}
              <div className="py-2 text-xs font-medium space-y-0.5">
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>My Account</span>
                </Link>

                <Link
                  href="/account/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/account/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span>Track Order</span>
                </Link>

                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>Addresses</span>
                </Link>

                <Link
                  href="/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>Wishlist</span>
                </Link>

                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-purple-50 text-purple-900 hover:text-purple-600 transition-colors"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-purple-100 px-2">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2 text-xs">
              <div className="px-3 py-2 text-center border-b border-purple-100 pb-3 mb-1">
                <p className="font-heading text-sm font-bold text-purple-950">Welcome to REXBEBE 🌸</p>
                <p className="text-[11px] text-purple-600 mt-0.5">Sign in to access your orders and wishlist</p>
              </div>

              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-2xl hover:shadow-pastel-md transition-all justify-center shadow-pastel-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login 🌸</span>
              </Link>

              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-3 bg-purple-50 text-purple-900 font-bold rounded-2xl hover:bg-purple-100 transition-all justify-center border border-purple-200/60"
              >
                <UserPlus className="w-4 h-4 text-purple-500" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
