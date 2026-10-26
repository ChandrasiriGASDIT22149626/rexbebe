'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe2,
  Calendar,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  Eye,
  Activity,
  ArrowUpRight,
  Info,
  Clock,
  MapPin,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';

export default function GlobalVisitorInsightsPage() {
  const { visitorLogs, visitorStats, clearVisitorLogs } = useAdminData();

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'custom'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [showPrivacyInspector, setShowPrivacyInspector] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Period filter
  const periodFilteredLogs = useMemo(() => {
    const now = Date.now();
    return visitorLogs.filter((v) => {
      const vTime = new Date(v.timestamp).getTime();
      if (selectedPeriod === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        return v.timestamp.slice(0, 10) === todayStr;
      }
      if (selectedPeriod === '7d') return now - vTime <= 7 * 86400000;
      if (selectedPeriod === '30d') return now - vTime <= 30 * 86400000;
      if (selectedPeriod === '90d') return now - vTime <= 90 * 86400000;
      return true;
    });
  }, [visitorLogs, selectedPeriod]);

  // Search & country filter
  const filteredLogs = useMemo(() => {
    return periodFilteredLogs.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        v.ip.includes(q) ||
        v.countryName.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.page.toLowerCase().includes(q) ||
        (v.referrer && v.referrer.toLowerCase().includes(q));

      const matchCountry = selectedCountry === 'ALL' || v.countryCode === selectedCountry;
      return matchSearch && matchCountry;
    });
  }, [periodFilteredLogs, searchQuery, selectedCountry]);

  // Country breakdown statistics
  const countryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; flag: string; count: number }> = {};
    const total = periodFilteredLogs.reduce((acc, curr) => acc + curr.visitsCount, 0) || 1;

    periodFilteredLogs.forEach((v) => {
      if (!map[v.countryCode]) {
        map[v.countryCode] = { name: v.countryName, flag: v.flag, count: 0 };
      }
      map[v.countryCode].count += v.visitsCount;
    });

    return Object.entries(map)
      .map(([code, data]) => ({
        code,
        name: data.name,
        flag: data.flag,
        count: data.count,
        percent: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [periodFilteredLogs]);

  // Most Visited Pages
  const topPages = useMemo(() => {
    const map: Record<string, number> = {};
    periodFilteredLogs.forEach((v) => {
      map[v.page] = (map[v.page] || 0) + v.visitsCount;
    });
    return Object.entries(map)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [periodFilteredLogs]);

  // Referrers
  const topReferrers = useMemo(() => {
    const map: Record<string, number> = {};
    periodFilteredLogs.forEach((v) => {
      const ref = v.referrer || 'Direct Visit';
      map[ref] = (map[ref] || 0) + v.visitsCount;
    });
    return Object.entries(map)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);
  }, [periodFilteredLogs]);

  // Devices
  const deviceCounts = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;
    periodFilteredLogs.forEach((v) => {
      if (v.device === 'Mobile') mobile += v.visitsCount;
      else if (v.device === 'Tablet') tablet += v.visitsCount;
      else desktop += v.visitsCount;
    });
    const total = (mobile + desktop + tablet) || 1;
    return {
      mobile,
      desktop,
      tablet,
      mobilePct: Math.round((mobile / total) * 100),
      desktopPct: Math.round((desktop / total) * 100),
      tabletPct: Math.round((tablet / total) * 100),
    };
  }, [periodFilteredLogs]);

  const uniqueVisitorsCount = useMemo(() => new Set(periodFilteredLogs.map(v => v.ip)).size, [periodFilteredLogs]);

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Global Visitor Insights"
          subtitle="See which countries visit your website and understand where your customers are coming from."
          actions={
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPrivacyInspector(!showPrivacyInspector)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  showPrivacyInspector
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-2xs'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>{showPrivacyInspector ? 'Hide Privacy Inspector' : 'IP & Privacy Inspector'}</span>
              </button>
            </div>
          }
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Privacy Notice Banner */}
          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-4 flex items-start space-x-3 text-sky-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold">Privacy & Responsible IP Geolocation Notice</p>
              <p className="text-sky-800 leading-relaxed">
                All visitor locations shown are approximate regional estimates determined from trusted server request headers.
                REXBEBE respects international privacy standards (GDPR/ePrivacy): no invasive device fingerprinting is used,
                individual exact physical coordinates are never collected, and raw IP data is strictly restricted to authorized administrators.
              </p>
            </div>
          </div>

          {/* Period Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-stone-700">Filter Range:</span>
              <span className="text-xs text-stone-500 font-medium">
                {selectedPeriod === 'today' && 'Today'}
                {selectedPeriod === '7d' && 'Last 7 Days'}
                {selectedPeriod === '30d' && 'Last 30 Days'}
                {selectedPeriod === '90d' && 'Last 90 Days'}
                {selectedPeriod === 'custom' && 'All Historic Data'}
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedPeriod('7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === '7d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setSelectedPeriod('30d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === '30d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setSelectedPeriod('90d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === '90d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Total Visits
              </span>
              <p className="text-3xl font-black text-stone-900">{periodFilteredLogs.length}</p>
              <span className="text-[10px] text-stone-500">Page views in period</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Unique Shoppers
              </span>
              <p className="text-3xl font-black text-emerald-800">{uniqueVisitorsCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Reliably unique IPs</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Countries Reached
              </span>
              <p className="text-3xl font-black text-amber-800">{countryBreakdown.length}</p>
              <span className="text-[10px] text-stone-500">Worldwide distribution</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Mobile vs Desktop
              </span>
              <p className="text-3xl font-black text-purple-800">{deviceCounts.mobilePct}%</p>
              <span className="text-[10px] text-purple-600 font-semibold">Mobile audience share</span>
            </div>
          </div>

          {/* Worldwide Distribution & Country Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Country Breakdown Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-heading font-black text-stone-900">
                    Visitors by Country
                  </h3>
                  <p className="text-xs text-stone-500">
                    Calculated from genuine international visitor traffic
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                  {countryBreakdown.length} Countries Active
                </span>
              </div>

              {countryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {countryBreakdown.map((c) => (
                    <div key={c.code} className="space-y-1.5 p-3 rounded-2xl bg-stone-50/70 border border-stone-100">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">{c.flag}</span>
                          <span>{c.name}</span>
                          <span className="text-[10px] font-normal text-stone-500">({c.code})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-stone-700">{c.count} visits</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                            {c.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${c.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50 rounded-2xl">
                  <p className="text-sm font-bold text-stone-500">No country data collected yet for this period.</p>
                </div>
              )}
            </div>

            {/* Device & Referrer Breakdown */}
            <div className="space-y-6">
              {/* Device breakdown card */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
                <h3 className="text-base font-heading font-black text-stone-900">
                  Device Types
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-stone-800">Mobile Phones</span>
                    </div>
                    <span className="font-black text-stone-900">{deviceCounts.mobilePct}% ({deviceCounts.mobile})</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs">
                    <div className="flex items-center space-x-2">
                      <Laptop className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-stone-800">Desktop & Laptop</span>
                    </div>
                    <span className="font-black text-stone-900">{deviceCounts.desktopPct}% ({deviceCounts.desktop})</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs">
                    <div className="flex items-center space-x-2">
                      <Tablet className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-stone-800">Tablets</span>
                    </div>
                    <span className="font-black text-stone-900">{deviceCounts.tabletPct}% ({deviceCounts.tablet})</span>
                  </div>
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
                <h3 className="text-base font-heading font-black text-stone-900">
                  Referral Sources
                </h3>
                <div className="space-y-2">
                  {topReferrers.map((r) => (
                    <div key={r.referrer} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
                      <span className="font-bold text-stone-800 truncate max-w-[180px]">{r.referrer}</span>
                      <span className="font-black text-amber-700">{r.count} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Viewed Pages */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-base font-heading font-black text-stone-900">
              Most Visited Product Pages & Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topPages.map((p, idx) => (
                <div key={p.page} className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-amber-600">Rank #{idx + 1}</span>
                    <p className="text-xs font-bold text-stone-900 truncate max-w-[200px]">{p.page}</p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-800 shadow-2xs">
                    {p.count} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* IP Address & Privacy Inspector (Authorized Staff Only) */}
          {showPrivacyInspector && (
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-md space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-heading font-black text-stone-900">
                      Authorized IP & Request Inspector
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Trusted server request IP information, estimated regional data and session timestamps.
                  </p>
                </div>

                {/* Search & Country Filter */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search IP, city, or page..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="border border-stone-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <tr>
                      <th className="p-3">IP Address (Server)</th>
                      <th className="p-3">Estimated Country</th>
                      <th className="p-3">City / Region</th>
                      <th className="p-3">Page Requested</th>
                      <th className="p-3">Device / Browser</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-amber-50/40">
                        <td className="p-3 font-mono font-bold text-stone-900">{log.ip}</td>
                        <td className="p-3 font-medium text-stone-800">
                          <span className="mr-1.5">{log.flag}</span>
                          {log.countryName}
                        </td>
                        <td className="p-3 text-stone-600">{log.city || 'Regional'}</td>
                        <td className="p-3 font-mono text-stone-700">{log.page}</td>
                        <td className="p-3 text-stone-600">{log.device} • {log.browser}</td>
                        <td className="p-3 text-stone-500 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
