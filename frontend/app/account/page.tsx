'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { User, Package, Heart, MapPin, Settings, LogOut, ArrowRight, ShieldCheck, Truck, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'settings'>('orders');

  const orders = [
    {
      id: 'REX-84920',
      date: 'October 6, 2026',
      total: 'Rs. 43,400',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      carrier: 'DHL Express (DHL-9284710492)',
      itemsCount: 2,
    },
    {
      id: 'REX-72109',
      date: 'September 18, 2026',
      total: 'Rs. 24,900',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      carrier: 'DHL Express (DHL-817263910)',
      itemsCount: 1,
    },
  ];

  return (
    <>
      <Header />

      <CategoryHeaderBanner
        badge="VIP ATELIER CUSTOMER PORTAL 👑"
        title="MY BOUTIQUE ACCOUNT"
        highlightWord="PROFILE"
        description="Manage your global shipping addresses, track active shipments, review past order invoices, and update security credentials."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar User Card & Navigation Tabs */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)] text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-sky-400 text-white rounded-full flex items-center justify-center font-heading font-black text-2xl mx-auto shadow-md border-4 border-white">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'EB'}
              </div>
              
              <div>
                <h3 className="font-heading text-lg font-black text-slate-900">{user?.name || 'Amasha Perera'}</h3>
                <p className="text-xs font-semibold text-slate-500">{user?.email || 'amasha@rexbebe.com'}</p>
              </div>

              <div className="inline-block px-3.5 py-1 bg-pink-50 text-pink-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-pink-200">
                ✨ VIP Atelier Member
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                  activeTab === 'orders' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Order History ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                  activeTab === 'addresses' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                  activeTab === 'wishlist' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Saved Wishlist</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                  activeTab === 'settings' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-black text-slate-900">Order History & Tracking</h2>
                  <Link href="/order-tracking">
                    <button className="btn-rexbebe-3d btn-3d-sky px-4 py-2 text-xs">
                      LIVE ORDER TRACKING 🚚
                    </button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                        <div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 font-heading block">
                            ORDER NUMBER
                          </span>
                          <span className="font-heading text-lg font-black text-slate-900">{order.id}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200 text-[10px] font-black uppercase tracking-wider">
                            ORDER: {order.status}
                          </span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            PAYMENT: {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase font-heading block">DATE</span>
                          <span className="font-extrabold text-slate-800">{order.date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase font-heading block">TOTAL AMOUNT</span>
                          <span className="font-extrabold text-pink-600">{order.total}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase font-heading block">ITEMS</span>
                          <span className="font-extrabold text-slate-800">{order.itemsCount} Items</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase font-heading block">CARRIER</span>
                          <span className="font-extrabold text-slate-800 truncate block">{order.carrier}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Link href="/order-tracking">
                          <button className="btn-rexbebe-3d btn-3d-pink px-5 py-2 text-xs">
                            VIEW LIVE TRACKING & INVOICE
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-black text-slate-900">Saved Shipping Addresses</h2>
                  <button className="btn-rexbebe-3d btn-3d-pink px-4 py-2 text-xs">
                    + ADD NEW ADDRESS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border-2 border-pink-200 shadow-xs relative space-y-3">
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 text-[10px] font-extrabold uppercase rounded-full border border-pink-200">
                      DEFAULT ADDRESS
                    </span>
                    <h4 className="font-heading text-base font-black text-slate-900">Amasha Perera</h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      No. 45, Rosmead Place, Colombo 07<br />
                      Western Province, 00700<br />
                      Sri Lanka<br />
                      Phone: +94 77 123 4567
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-black text-slate-900">Saved Wishlist Items</h2>
                  <Link href="/shop">
                    <button className="btn-rexbebe-3d btn-3d-sky px-4 py-2 text-xs">
                      EXPLORE CATALOG 🌸
                    </button>
                  </Link>
                </div>

                <p className="text-xs font-semibold text-slate-500">
                  You have saved products in your wishlist for nursery design planning.
                </p>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-heading text-xl font-black text-slate-900">Security & Credentials</h2>
                
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1 font-heading">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || 'Amasha Perera'}
                      className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:border-pink-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1 font-heading">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || 'amasha@rexbebe.com'}
                      className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:border-pink-500 outline-none"
                    />
                  </div>

                  <button className="btn-rexbebe-3d btn-3d-pink px-6 py-2.5 text-xs">
                    UPDATE CREDENTIALS
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
