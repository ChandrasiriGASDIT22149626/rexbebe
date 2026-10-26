'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { SupportedCurrency, CURRENCY_CONFIGS } from '../../utils/formatCurrency';

const CURRENCIES: { code: SupportedCurrency; label: string; flag: string }[] = [
  { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  { code: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
  { code: 'AUD', label: 'AUD (A$)', flag: '🇦🇺' },
  { code: 'AED', label: 'AED (AED)', flag: '🇦🇪' },
  { code: 'LKR', label: 'LKR (Rs.)', flag: '🇱🇰' },
];

export function CurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rexbebe_currency') as SupportedCurrency;
    if (saved && CURRENCY_CONFIGS[saved]) {
      setSelectedCurrency(saved);
    }
  }, []);

  const handleSelect = (code: SupportedCurrency) => {
    setSelectedCurrency(code);
    localStorage.setItem('rexbebe_currency', code);
    window.dispatchEvent(new CustomEvent('rexbebe_currency_changed', { detail: code }));
    setIsOpen(false);
  };

  const currentConfig = CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 xl:space-x-1.5 px-2 py-1 xl:px-3 xl:py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 text-[11px] xl:text-xs font-semibold border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all duration-200"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-pink-600" />
        <span>{currentConfig.flag} {currentConfig.code}</span>
        <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white shadow-xl border border-stone-100 z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 border-b border-stone-100">
              Select Currency
            </div>
            {CURRENCIES.map((item) => (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors ${
                  selectedCurrency === item.code
                    ? 'bg-pink-50 text-pink-700 font-bold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{item.flag} {item.code}</span>
                <span className="text-[11px] text-stone-400 font-normal">{CURRENCY_CONFIGS[item.code].symbol}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
