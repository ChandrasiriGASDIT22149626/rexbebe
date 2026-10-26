'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface TrackingResult {
  orderNumber: string;
  orderDate: string;
  recipientName: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentStep: number; // 0 to 4
  statusLabel: string;
  items: { name: string; quantity: number; price: string; image: string }[];
}

const DEMO_TRACKING_DATA: Record<string, TrackingResult> = {
  'REX-84920': {
    orderNumber: 'REX-84920',
    orderDate: 'October 6, 2026',
    recipientName: 'Amasha Perera',
    destination: 'Colombo 07, Western Province, Sri Lanka',
    carrier: 'DHL Express International',
    trackingNumber: 'DHL-9284710492',
    estimatedDelivery: 'October 10, 2026',
    currentStep: 3,
    statusLabel: 'In Transit — Out for Regional Delivery',
    items: [
      {
        name: 'Aurelia Organic Cashmere Romper',
        quantity: 1,
        price: 'Rs. 18,500',
        image: '/images/products/organic-onesie.jpg',
      },
      {
        name: 'Nordic Artisan Wooden Play Gym',
        quantity: 1,
        price: 'Rs. 24,900',
        image: '/images/products/wooden-gym.jpg',
      },
    ],
  },
};

export default function OrderTrackingPage() {
  const [queryOrder, setQueryOrder] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [activeResult, setActiveResult] = useState<TrackingResult | null>(DEMO_TRACKING_DATA['REX-84920']);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      const cleanOrder = queryOrder.trim().toUpperCase();
      if (DEMO_TRACKING_DATA[cleanOrder]) {
        setActiveResult(DEMO_TRACKING_DATA[cleanOrder]);
      } else {
        setActiveResult(null);
        setErrorMsg(`Order "${queryOrder}" was not found. Please verify your order number (e.g. REX-84920) or contact support.`);
      }
    }, 600);
  };

  const steps = [
    { title: 'Order Placed', icon: Clock, desc: 'Payment verified & order confirmed' },
    { title: 'Processing', icon: Package, desc: 'Knitted & packed at REXBEBE atelier' },
    { title: 'In Transit', icon: Truck, desc: 'Dispatched via international air express' },
    { title: 'Delivered', icon: CheckCircle2, desc: 'Handed over to customer' },
  ];

  return (
    <>
      <Header />
      
      <CategoryHeaderBanner
        badge="GLOBAL PARCEL FULFILLMENT 🚚"
        title="LIVE ORDER TRACKING"
        highlightWord="STATUS"
        description="Track your international REXBEBE order in real time. Enter your order number and email address to view parcel progress."
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        
        {/* Search Tracking Form Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)] max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1.5 font-heading">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={queryOrder}
                  onChange={(e) => setQueryOrder(e.target.value)}
                  placeholder="e.g. REX-84920"
                  className="w-full px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 bg-white placeholder-slate-400 rounded-2xl border-2 border-pink-100 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1.5 font-heading">
                  Email / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={queryEmail}
                  onChange={(e) => setQueryEmail(e.target.value)}
                  placeholder="e.g. hello@rexbebe.com"
                  className="w-full px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 bg-white placeholder-slate-400 rounded-2xl border-2 border-pink-100 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="btn-rexbebe-3d btn-3d-pink w-full py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'SEARCHING PARCEL STATUS...' : 'TRACK PARCEL STATUS'}</span>
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 font-semibold">
              💡 Demo Order Lookup: Try typing <button onClick={() => { setQueryOrder('REX-84920'); setQueryEmail('customer@rexbebe.com'); }} className="text-pink-600 underline font-extrabold">REX-84920</button>
            </span>
          </div>
        </div>

        {/* Live Active Tracking Result Card */}
        {activeResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.08)] space-y-8"
          >
            {/* Header Details */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-extrabold tracking-wider uppercase mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{activeResult.statusLabel}</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                  Order #{activeResult.orderNumber}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Placed on {activeResult.orderDate} for <strong className="text-slate-800">{activeResult.recipientName}</strong>
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-right space-y-1">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase font-heading block">
                  ESTIMATED DELIVERY
                </span>
                <span className="text-sm font-extrabold text-pink-600 block">
                  {activeResult.estimatedDelivery}
                </span>
                <span className="text-[11px] font-bold text-slate-600 flex items-center justify-end gap-1">
                  <span>Carrier: {activeResult.carrier}</span>
                </span>
              </div>
            </div>

            {/* Visual Step-by-Step Progress Timeline */}
            <div className="pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {steps.map((step, idx) => {
                  const isPassed = idx <= activeResult.currentStep;
                  const isCurrent = idx === activeResult.currentStep;
                  const Icon = step.icon;

                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-pink-50/70 border-pink-300 ring-2 ring-pink-200/60 shadow-xs'
                          : isPassed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-xs ${
                          isCurrent
                            ? 'bg-pink-500 text-white animate-bounce'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <span className={`font-heading text-xs font-black tracking-wider uppercase ${isCurrent ? 'text-pink-700' : 'text-slate-800'}`}>
                        {step.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Destination & Tracking Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-heading flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  <span>SHIPPING ADDRESS</span>
                </span>
                <p className="text-xs font-extrabold text-slate-800 leading-relaxed pt-1">
                  {activeResult.destination}
                </p>
              </div>

              <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-heading flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                  <span>WAYBILL TRACKING CODE</span>
                </span>
                <div className="pt-1 flex items-center justify-between">
                  <code className="text-xs font-black tracking-wider text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                    {activeResult.trackingNumber}
                  </code>
                  <a
                    href="https://www.dhl.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                  >
                    <span>Carrier Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Itemized Order Breakdown */}
            <div className="space-y-3">
              <h3 className="font-heading text-xs font-black tracking-widest uppercase text-slate-800 border-b border-slate-100 pb-2">
                ITEMS IN THIS PARCEL
              </h3>
              <div className="space-y-3">
                {activeResult.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-heading text-xs font-bold text-slate-900">{item.name}</h4>
                        <span className="text-[11px] font-semibold text-slate-500">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs text-slate-900">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help & Support Footer Actions */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Need help with your shipment? Contact our 24/7 Concierge Team.
              </span>
              <div className="flex items-center space-x-3">
                <Link href="/contact">
                  <button className="btn-rexbebe-3d btn-3d-sky px-5 py-2.5 text-xs">
                    CONTACT SUPPORT
                  </button>
                </Link>
              </div>
            </div>

          </motion.div>
        )}

      </main>

      <Footer />
    </>
  );
}
