'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Settings,
  Store,
  Globe2,
  Truck,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Activity,
  Plus,
  Trash2,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';

function SettingsContent() {
  const { storeSettings, updateStoreSettings, auditLogs } = useAdminData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState<'general' | 'international' | 'shipping' | 'payments' | 'security'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tabParam === 'shipping') setActiveTab('shipping');
    else if (tabParam === 'payments') setActiveTab('payments');
    else if (tabParam === 'security') setActiveTab('security');
    else if (tabParam === 'international') setActiveTab('international');
    else setActiveTab('general');
  }, [tabParam]);

  const handleTabChange = (tab: 'general' | 'international' | 'shipping' | 'payments' | 'security') => {
    setActiveTab(tab);
    router.push(`/admin/settings?tab=${tab}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Local form state
  const [storeName, setStoreName] = useState('REXBEBE Baby Boutique');
  const [tagline, setTagline] = useState('Little Moments, Big Adventures 🦕✨');
  const [businessEmail, setBusinessEmail] = useState('care@rexbebe.com');
  const [orderEmail, setOrderEmail] = useState('orders@rexbebe.com');
  const [phone, setPhone] = useState('+94 77 123 4567');
  const [address, setAddress] = useState('142 Galle Road, Colombo 03, Sri Lanka');
  const [currency, setCurrency] = useState('LKR');
  const [defaultCountry, setDefaultCountry] = useState('Sri Lanka');
  const [storeUrl, setStoreUrl] = useState('https://rexbebe.com');

  // Shipping state
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(10000);
  const [domesticRate, setDomesticRate] = useState(650);
  const [domesticDays, setDomesticDays] = useState('1–3 Business Days');
  const [internationalRate, setInternationalRate] = useState(6500);
  const [internationalDays, setInternationalDays] = useState('3–5 Business Days (DHL Express DDP)');

  // Payments state
  const [payhereEnabled, setPayhereEnabled] = useState(true);
  const [payhereMode, setPayhereMode] = useState('production');
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [stripeMode, setStripeMode] = useState('test');
  const [codEnabled, setCodEnabled] = useState(true);

  // Sync when storeSettings loads from backend
  useEffect(() => {
    if (storeSettings) {
      if (storeSettings.storeInfo) {
        setStoreName(storeSettings.storeInfo.storeName || '');
        setTagline(storeSettings.storeInfo.tagline || '');
        setBusinessEmail(storeSettings.storeInfo.businessEmail || '');
        setOrderEmail(storeSettings.storeInfo.orderEmail || '');
        setPhone(storeSettings.storeInfo.phone || '');
        setAddress(storeSettings.storeInfo.address || '');
        setCurrency(storeSettings.storeInfo.currency || 'LKR');
        setDefaultCountry(storeSettings.storeInfo.defaultCountry || 'Sri Lanka');
        setStoreUrl(storeSettings.storeInfo.storeUrl || 'https://rexbebe.com');
      }
      if (storeSettings.shipping) {
        setFreeShippingThreshold(storeSettings.shipping.freeShippingThreshold || 10000);
        setDomesticRate(storeSettings.shipping.domesticStandardRate || 650);
        setDomesticDays(storeSettings.shipping.domesticEstimatedDays || '1–3 Business Days');
        setInternationalRate(storeSettings.shipping.internationalExpressRate || 6500);
        setInternationalDays(storeSettings.shipping.internationalEstimatedDays || '3–5 Business Days');
      }
      if (storeSettings.payments) {
        setPayhereEnabled(Boolean(storeSettings.payments.payhere?.enabled));
        setPayhereMode(storeSettings.payments.payhere?.mode || 'production');
        setStripeEnabled(Boolean(storeSettings.payments.stripe?.enabled));
        setStripeMode(storeSettings.payments.stripe?.mode || 'test');
        setCodEnabled(Boolean(storeSettings.payments.cod?.enabled));
      }
    }
  }, [storeSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = {
      storeInfo: {
        storeName,
        tagline,
        businessEmail,
        orderEmail,
        phone,
        address,
        currency,
        defaultCountry,
        storeUrl,
      },
      shipping: {
        freeShippingThreshold: Number(freeShippingThreshold),
        domesticStandardRate: Number(domesticRate),
        domesticEstimatedDays: domesticDays,
        internationalExpressRate: Number(internationalRate),
        internationalEstimatedDays: internationalDays,
        supportedCarriers: ['DHL Express', 'FedEx', 'Pronto Courier', 'Royal Mail'],
      },
      payments: {
        payhere: { name: 'PayHere Sri Lanka', enabled: payhereEnabled, mode: payhereMode },
        stripe: { name: 'Stripe Global', enabled: stripeEnabled, mode: stripeMode },
        cod: { name: 'Cash on Delivery', enabled: codEnabled, maxOrderAmount: 50000 },
      },
    };

    try {
      await updateStoreSettings(updated);
      showToast('Changes saved successfully.');
    } catch (e: any) {
      showToast(
        e.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Store Settings"
          subtitle="Configure boutique business information, international delivery zones, payment gateways, and security."
          actions={
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          }
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
            {[
              { id: 'general', label: 'Store Information', icon: Store },
              { id: 'international', label: 'International Markets', icon: Globe2 },
              { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
              { id: 'payments', label: 'Payment Settings', icon: CreditCard },
              { id: 'security', label: 'Security & Activity Logs', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* TAB 1: STORE INFORMATION */}
            {activeTab === 'general' && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-base font-heading font-black text-stone-900">
                    Boutique Store Information
                  </h3>
                  <p className="text-xs text-stone-500">
                    Business name, customer support contacts, address and store currency
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Store Brand Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Brand Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Customer Support Email</label>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Order Notification Email</label>
                    <input
                      type="email"
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Contact Telephone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Base Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-900"
                    >
                      <option value="LKR">LKR — Sri Lankan Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-stone-700">Physical Boutique Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INTERNATIONAL MARKETS */}
            {activeTab === 'international' && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-base font-heading font-black text-stone-900">
                    International Store Markets
                  </h3>
                  <p className="text-xs text-stone-500">
                    Active destinations supported by international checkout and fulfillment
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { flag: '🇱🇰', name: 'Sri Lanka (Domestic)', currency: 'LKR', tax: '0% Vat', status: 'ACTIVE' },
                    { flag: '🇺🇸', name: 'United States', currency: 'USD', tax: 'Duty-Free (DDP)', status: 'ACTIVE' },
                    { flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', tax: 'DDP Handled', status: 'ACTIVE' },
                    { flag: '🇪🇺', name: 'European Union', currency: 'EUR', tax: 'IOSS Compliant', status: 'ACTIVE' },
                    { flag: '🇦🇪', name: 'United Arab Emirates', currency: 'AED', tax: 'Customs Cleared', status: 'ACTIVE' },
                    { flag: '🇦🇺', name: 'Australia', currency: 'AUD', tax: 'GST Included', status: 'ACTIVE' },
                  ].map((market) => (
                    <div key={market.name} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{market.flag}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {market.status}
                        </span>
                      </div>
                      <p className="font-bold text-stone-900 text-xs">{market.name}</p>
                      <p className="text-[10px] text-stone-500">Currency: {market.currency} • {market.tax}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SHIPPING & DELIVERY */}
            {activeTab === 'shipping' && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-base font-heading font-black text-stone-900">
                    Shipping & Delivery Configuration
                  </h3>
                  <p className="text-xs text-stone-500">
                    Domestic islandwide courier and worldwide express courier parameters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Free Shipping Threshold (LKR)</label>
                    <input
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400">Orders above this amount qualify for free shipping</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Domestic Flat Rate (LKR)</label>
                    <input
                      type="number"
                      value={domesticRate}
                      onChange={(e) => setDomesticRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400">Pronto / Domex islandwide delivery fee</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Domestic Estimated Transit Days</label>
                    <input
                      type="text"
                      value={domesticDays}
                      onChange={(e) => setDomesticDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">International Express Rate (LKR)</label>
                    <input
                      type="number"
                      value={internationalRate}
                      onChange={(e) => setInternationalRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-stone-700">International Estimated Transit Time</label>
                    <input
                      type="text"
                      value={internationalDays}
                      onChange={(e) => setInternationalDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENT GATEWAY SETTINGS */}
            {activeTab === 'payments' && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-base font-heading font-black text-stone-900">
                    Payment Gateway Integrations
                  </h3>
                  <p className="text-xs text-stone-500">
                    Secure payment gateways configured on the server. Credentials are never exposed in client code.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* PayHere Card */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        <h4 className="font-bold text-stone-900 text-sm">PayHere Sri Lanka</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {payhereMode.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Accepts Visa, Mastercard, Genie, FriMi, eZ Cash & local Sri Lankan banking.
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payhereEnabled}
                          onChange={(e) => setPayhereEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                  </div>

                  {/* Stripe Card */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-indigo-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Stripe Worldwide</h4>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                          {stripeMode.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Supports worldwide payments, Apple Pay, Google Pay, and multicurrency settlement.
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stripeEnabled}
                          onChange={(e) => setStripeEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                  </div>

                  {/* COD Card */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Cash on Delivery (Islandwide)</h4>
                      </div>
                      <p className="text-xs text-stone-500">
                        Allows customers to pay in cash upon doorstep delivery in Sri Lanka.
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={codEnabled}
                          onChange={(e) => setCodEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY & ACTIVITY LOGS */}
            {activeTab === 'security' && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-heading font-black text-stone-900 flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Security & Action Audit Trail</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Chronological ledger of administrator changes and login sessions
                    </p>
                  </div>
                  <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                    {auditLogs.length} Events Logged
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-white hover:bg-stone-50/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-amber-800 text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              {log.action}
                            </span>
                            <span className="font-bold text-stone-900">{log.userName}</span>
                            <span className="text-[10px] text-stone-400">({log.userEmail})</span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-stone-700 text-xs font-medium">{log.details}</p>
                        <p className="text-[10px] text-stone-400 font-mono">Server IP: {log.ip}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-stone-400 font-bold">
                      No security audit events recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
