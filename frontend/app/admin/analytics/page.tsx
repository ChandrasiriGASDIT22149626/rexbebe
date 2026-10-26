'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe2,
  Search,
  Filter,
  Download,
  Trash2,
  Sparkles,
  Users,
  Eye,
  Activity,
  ArrowUpRight,
  Laptop,
  Smartphone,
  Tablet,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';

export default function AdminAnalyticsPage() {
  const { visitorLogs, visitorStats, simulateVisitor, clearVisitorLogs } = useAdminData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return visitorLogs.filter((v) => {
      const matchSearch =
        v.ip.includes(searchQuery) ||
        v.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.page.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCountry =
        selectedCountry === 'ALL' || v.countryCode === selectedCountry;

      return matchSearch && matchCountry;
    });
  }, [visitorLogs, searchQuery, selectedCountry]);

  // Country breakdown statistics
  const countryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; flag: string; count: number }> = {};
    const total = visitorLogs.reduce((acc, curr) => acc + curr.visitsCount, 0) || 1;

    visitorLogs.forEach((v) => {
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
  }, [visitorLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['IP Address,Country,City,Device,Browser,Page,Visits,Timestamp\n'];
    const rows = visitorLogs.map(
      (v) =>
        `"${v.ip}","${v.countryName}","${v.city}","${v.device}","${v.browser}","${v.page}","${v.visitsCount}","${v.timestamp}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rexbebe_visitor_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported visitor analytics CSV successfully! 📊');
  };

  const formatTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Visitor IP & Geographic Intelligence"
          subtitle="Real-time monitoring of customer IP addresses, countries, locations, and storefront browsing patterns"
          actions={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-all"
                title="Download visitor log data as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => {
                  simulateVisitor();
                  showToast('Simulated real-time visitor logged from international network! 🌍');
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                title="Add a test visitor to see live analytics in action"
              >
                <Plus className="w-4 h-4" />
                <span>Simulate Visitor IP</span>
              </button>
            </div>
          }
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-stone-900 text-amber-400 border border-amber-500/30 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Page Hits</p>
                <p className="text-2xl font-black text-stone-900 mt-1">{visitorStats.totalVisits}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">● Real-time tracked</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Unique IP Addresses</p>
                <p className="text-2xl font-black text-stone-900 mt-1">{visitorStats.uniqueVisitors}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Distinct client devices</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Top Country</p>
                <p className="text-2xl font-black text-stone-900 mt-1 truncate max-w-[140px]">
                  {visitorStats.topCountry}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {visitorStats.topCountryVisits} visits recorded
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Globe2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online Right Now</span>
                </p>
                <p className="text-2xl font-black text-stone-900 mt-1">{visitorStats.liveVisitors}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Active past 15 mins</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-emerald-800 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Country Distribution Overview */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold font-heading text-stone-900 uppercase tracking-wider flex items-center space-x-2">
                  <Globe2 className="w-4 h-4 text-amber-600" />
                  <span>Traffic by Country & Geographic Origin</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Breakdown of visitors arriving to Rexbebe from around the globe
                </p>
              </div>
              <span className="text-[10px] text-stone-400 font-bold">
                {countryBreakdown.length} Countries Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {countryBreakdown.map((item) => (
                <div
                  key={item.code}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{item.flag}</span>
                      <span className="text-xs font-bold text-stone-900">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-amber-800">{item.percent}%</span>
                  </div>

                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-rose-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percent, 8)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                    <span>{item.count} total hits</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCountry(item.code)}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      Filter IP logs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-3 flex-wrap gap-y-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by IP address, country, city, page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700"
              >
                <option value="ALL">All Countries ({visitorLogs.length} logs)</option>
                {countryBreakdown.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (confirm('Clear all recorded visitor logs?')) {
                    clearVisitorLogs();
                    showToast('Visitor logs cleared.');
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Visitor IP Logs Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Real-Time Visitor IP Log Records
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Every user visit automatically records their IP address, geo-coordinates, and visited path
                </p>
              </div>
              <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                {filteredLogs.length} Records Shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-extrabold select-none">
                  <tr>
                    <th className="p-4">Visitor IP Address</th>
                    <th className="p-4">Country & Location</th>
                    <th className="p-4">Visited Page</th>
                    <th className="p-4">Device & Browser</th>
                    <th className="p-4">Referrer Source</th>
                    <th className="p-4">Hits</th>
                    <th className="p-4 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">
                        No visitor logs match the specified search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                        {/* IP Address */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                log.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                              }`}
                              title={log.isOnline ? 'Active Online' : 'Offline'}
                            />
                            <span className="font-mono font-bold text-stone-900">{log.ip}</span>
                          </div>
                        </td>

                        {/* Country & Location */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-xl">{log.flag}</span>
                            <div>
                              <p className="font-bold text-stone-900">{log.countryName}</p>
                              <p className="text-[10px] text-stone-400">
                                {log.city}
                                {log.region ? `, ${log.region}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Visited Page */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-mono text-stone-800 text-[11px] font-bold border border-stone-200">
                            {log.page}
                          </span>
                        </td>

                        {/* Device & Browser */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2 text-stone-600">
                            {log.device === 'Mobile' ? (
                              <Smartphone className="w-4 h-4 text-amber-600" />
                            ) : log.device === 'Tablet' ? (
                              <Tablet className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Laptop className="w-4 h-4 text-sky-600" />
                            )}
                            <div>
                              <p className="font-bold text-[11px] text-stone-900">{log.device}</p>
                              <p className="text-[10px] text-stone-400">{log.browser}</p>
                            </div>
                          </div>
                        </td>

                        {/* Referrer */}
                        <td className="p-4 text-[11px] text-stone-500 truncate max-w-[140px]">
                          {log.referrer}
                        </td>

                        {/* Hits */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-100 text-stone-800">
                            {log.visitsCount} {log.visitsCount === 1 ? 'visit' : 'visits'}
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td className="p-4 text-right">
                          <span className="text-[11px] text-stone-500 font-semibold">
                            {formatTimeAgo(log.timestamp)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
