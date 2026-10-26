'use client';

import React from 'react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';

export default function AdminPaymentsPage() {
  const payments = [
    { id: 'pay-1', orderId: 'RXB-2026-9041', method: 'PayHere Gateway', status: 'PAID', amount: 43000, txnId: 'TXN-908123', currency: 'LKR' }
  ];

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Payment Gateway Logs & Transactions" />
        <main className="p-8">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr>
                  <th className="p-4 font-bold">Transaction Ref</th>
                  <th className="p-4 font-bold">Order Number</th>
                  <th className="p-4 font-bold">Payment Gateway</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-stone-900">{p.txnId}</td>
                    <td className="p-4 text-stone-600">{p.orderId}</td>
                    <td className="p-4 text-stone-800 font-semibold">{p.method}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-stone-900">{p.currency} {p.amount.toLocaleString()}</td>
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
