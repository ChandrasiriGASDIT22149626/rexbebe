'use client';

import React from 'react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';

export default function AdminReportsPage() {
  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Executive Analytics & Sales Reports" />
        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase">Average Order Value</span>
              <p className="text-2xl font-bold text-stone-900">LKR 28,450</p>
              <span className="text-[10px] text-emerald-600 font-bold">+5.2% vs last month</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase">Gross Profit Margin</span>
              <p className="text-2xl font-bold text-stone-900">68.4%</p>
              <span className="text-[10px] text-emerald-600 font-bold">Premium Luxury Tier</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase">Repeat Purchase Rate</span>
              <p className="text-2xl font-bold text-stone-900">41.8%</p>
              <span className="text-[10px] text-emerald-600 font-bold">High Customer Loyalty</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
