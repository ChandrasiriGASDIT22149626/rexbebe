'use client';

import React, { useState, useEffect } from 'react';
import { Globe, X, Check, Truck, ShieldCheck } from 'lucide-react';
import { SupportedCurrency, CURRENCY_CONFIGS } from '../../utils/formatCurrency';

interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: SupportedCurrency;
  shippingEst: string;
}

const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', shippingEst: '3 - 5 Business Days via DHL Express' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', shippingEst: '3 - 5 Business Days via DHL Express' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', currency: 'EUR', shippingEst: '4 - 6 Business Days via FedEx Air' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', shippingEst: '4 - 7 Business Days via DHL Express' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', shippingEst: '2 - 4 Business Days Express' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', shippingEst: '1 - 2 Business Days via Express Courier' },
];

export function InternationalGeoBanner() {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rexbebe_country');
    if (saved) {
      const found = COUNTRIES.find((c) => c.code === saved);
      if (found) setSelectedCountry(found);
    }
  }, []);

  const handleSelectCountry = (country: CountryOption) => {
    setSelectedCountry(country);
    localStorage.setItem('rexbebe_country', country.code);
    localStorage.setItem('rexbebe_currency', country.currency);
    window.dispatchEvent(new CustomEvent('rexbebe_currency_changed', { detail: country.currency }));
    setIsModalOpen(false);
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Top Smart International Banner */}
      <div className="bg-purple-950 text-white py-1.5 px-4 text-xs relative z-40 border-b border-purple-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2 text-[11px] font-medium tracking-wide">
            <span className="text-base">{selectedCountry.flag}</span>
            <span>
              Shipping to <strong className="text-pink-300 font-extrabold">{selectedCountry.name}</strong> <span className="hidden sm:inline">({selectedCountry.shippingEst})</span>
            </span>
            <span className="hidden md:inline-block text-purple-400">|</span>
            <span className="hidden md:inline-flex items-center text-emerald-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Guaranteed Duty-Free (DDP)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setIsModalOpen(true)}
              className="underline hover:text-pink-300 transition-colors font-bold flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-pink-400" />
              <span className="hidden sm:inline">Change Destination / Currency</span>
              <span className="sm:hidden">Change Country</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-purple-400 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Country Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 border border-white/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-pink-600" />
                <h3 className="font-extrabold text-stone-900 text-lg">Select Shipping Country</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Prices will be displayed in your local currency and shipping costs calculated for your destination.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {COUNTRIES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleSelectCountry(item)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                    selectedCountry.code === item.code
                      ? 'bg-pink-50 border-pink-400 text-pink-900 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.flag}</span>
                    <div className="text-left">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] text-stone-400">{item.shippingEst}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-[10px] font-extrabold text-purple-900">
                      {item.currency}
                    </span>
                    {selectedCountry.code === item.code && (
                      <Check className="w-4 h-4 text-pink-600 stroke-[3]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-xs"
              >
                Confirm Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
