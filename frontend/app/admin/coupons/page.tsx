'use client';

import React from 'react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';

export default function AdminCouponsPage() {
  const coupons = [
    { code: 'REXBEBE10', type: '10% PERCENTAGE', minSpend: 10000, usages: 42, active: true },
    { code: 'WELCOME5000', type: 'LKR 5,000 FIXED', minSpend: 30000, usages: 18, active: true },
  ];

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Promotional Coupons & Discounts" />
        <main className="p-8">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr>
                  <th className="p-4 font-bold">Coupon Code</th>
                  <th className="p-4 font-bold">Discount Type</th>
                  <th className="p-4 font-bold">Min Threshold</th>
                  <th className="p-4 font-bold">Total Usages</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {coupons.map(c => (
                  <tr key={c.code} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-brand-700">{c.code}</td>
                    <td className="p-4 text-stone-800">{c.type}</td>
                    <td className="p-4 text-stone-600">LKR {c.minSpend.toLocaleString()}</td>
                    <td className="p-4 text-stone-900 font-semibold">{c.usages} times</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
