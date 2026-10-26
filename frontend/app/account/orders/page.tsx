'use client';

import React from 'react';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function AccountOrdersPage() {
  const orders = [
    {
      id: 'RXB-2026-9041',
      date: '2026-10-04',
      status: 'PROCESSING',
      total: 43000,
      items: 'Aurelia Cashmere Romper, Nordic Wooden Play Gym',
    }
  ];

  return (
    <>
      <Header />
      <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl text-stone-900 font-normal mb-8">My Orders</h1>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="p-4 font-semibold text-stone-700">Order #</th>
                <th className="p-4 font-semibold text-stone-700">Date</th>
                <th className="p-4 font-semibold text-stone-700">Items</th>
                <th className="p-4 font-semibold text-stone-700">Status</th>
                <th className="p-4 font-semibold text-stone-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="p-4 font-bold text-stone-900">{o.id}</td>
                  <td className="p-4 text-stone-500">{o.date}</td>
                  <td className="p-4 text-stone-800">{o.items}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-stone-900">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}
