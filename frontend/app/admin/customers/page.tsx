'use client';

import React from 'react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';

export default function AdminCustomersPage() {
  const customers = [
    { id: 'cust-1', name: 'Elena Rostova', email: 'elena@example.com', phone: '+94 77 123 4567', totalOrders: 3, spend: 125000 },
    { id: 'cust-2', name: 'Samantha Jayawardena', email: 'samantha@example.com', phone: '+94 71 987 6543', totalOrders: 1, spend: 24500 }
  ];

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Customer Directory" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                  <tr>
                    <th className="p-4 font-bold">Customer Name</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Phone</th>
                    <th className="p-4 font-bold">Total Orders</th>
                    <th className="p-4 font-bold">Lifetime Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="p-4 font-bold text-stone-900">{c.name}</td>
                      <td className="p-4 text-stone-500">{c.email}</td>
                      <td className="p-4 text-stone-600">{c.phone}</td>
                      <td className="p-4 text-stone-900 font-semibold">{c.totalOrders} Orders</td>
                      <td className="p-4 font-bold text-emerald-700">LKR {c.spend.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
