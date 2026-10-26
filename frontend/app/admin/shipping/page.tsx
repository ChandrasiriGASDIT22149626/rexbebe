'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  MapPin,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Send,
  X,
  CreditCard,
  Building,
  Check,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { formatCurrency } from '../../../utils/formatCurrency';
import { OrderRecord } from '../../../services/orderService';
import { deliveryService, DeliverySettingsData } from '../../../services/deliveryService';

export default function AdminShippingPage() {
  const {
    orders,
    refreshOrders,
    confirmCodOrder,
    assignCourier,
    recordDeliveryAndPayment,
    recordCodRemittance,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Delivery settings for courier list & tracking URLs
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettingsData | null>(null);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);

  // Assign Courier form state
  const [assignForm, setAssignForm] = useState({
    courierProvider: 'PromptX',
    waybillNumber: '',
    trackingUrl: '',
    parcelWeight: 0.5,
    deliveryFee: 450,
    expectedDeliveryDate: '',
    notes: '',
  });

  // Delivery form state
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    collectedAmount: 0,
    note: 'Customer paid in cash at doorstep upon delivery.',
  });

  // Remittance form state
  const [remittanceForm, setRemittanceForm] = useState({
    amountRemitted: 0,
    remittanceDate: new Date().toISOString().split('T')[0],
    bankReference: '',
    isReconciled: true,
    note: 'Verified against bank statement deposit.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    deliveryService.getSettings().then(setDeliverySettings).catch(console.error);
  }, []);

  // Update default tracking URL when courier or waybill changes in Assign Form
  const handleCourierChange = (providerName: string) => {
    const courierObj = deliverySettings?.activeCouriers.find((c) => c.name === providerName);
    const pattern = courierObj?.trackingUrlPattern || '';
    const generatedUrl = assignForm.waybillNumber ? pattern.replace('{tracking}', assignForm.waybillNumber) : '';
    setAssignForm((prev) => ({
      ...prev,
      courierProvider: providerName,
      trackingUrl: generatedUrl,
    }));
  };

  const handleWaybillChange = (waybill: string) => {
    const courierObj = deliverySettings?.activeCouriers.find((c) => c.name === assignForm.courierProvider);
    const pattern = courierObj?.trackingUrlPattern || '';
    const generatedUrl = waybill && pattern ? pattern.replace('{tracking}', waybill) : '';
    setAssignForm((prev) => ({
      ...prev,
      waybillNumber: waybill,
      trackingUrl: generatedUrl,
    }));
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.shippingAddress?.district && o.shippingAddress.district.toLowerCase().includes(q)) ||
        (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q)) ||
        (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.toLowerCase().includes(q)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q));

      const courierName = o.courierDetails?.courierProvider || o.carrier || '';
      const matchCourier = courierFilter === 'ALL' || courierName.toLowerCase() === courierFilter.toLowerCase();
      const matchDistrict = districtFilter === 'ALL' || o.shippingAddress?.district === districtFilter;

      let matchTab = true;
      if (activeTab === 'PENDING_CONFIRMATION') {
        matchTab = o.status === 'PENDING_CONFIRMATION';
      } else if (activeTab === 'PENDING_DISPATCH') {
        matchTab = ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(o.status) && (!o.courierDetails?.waybillNumber);
      } else if (activeTab === 'IN_TRANSIT') {
        matchTab = o.status === 'SHIPPED';
      } else if (activeTab === 'DELIVERED_PENDING_REMITTANCE') {
        matchTab = o.status === 'DELIVERED' && o.codSettlementStatus === 'PENDING_REMITTANCE';
      } else if (activeTab === 'RECONCILED') {
        matchTab = o.codSettlementStatus === 'RECONCILED';
      } else if (activeTab === 'RETURNED') {
        matchTab = o.status === 'RETURNED' || o.courierDetails?.deliveryStatus === 'RETURNED';
      }

      return matchSearch && matchCourier && matchDistrict && matchTab;
    });
  }, [orders, searchQuery, courierFilter, districtFilter, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pendingConfirmation: orders.filter((o) => o.status === 'PENDING_CONFIRMATION').length,
      pendingDispatch: orders.filter(
        (o) => ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(o.status) && !o.courierDetails?.waybillNumber
      ).length,
      inTransit: orders.filter((o) => o.status === 'SHIPPED').length,
      pendingRemittance: orders.filter(
        (o) => o.status === 'DELIVERED' && o.codSettlementStatus === 'PENDING_REMITTANCE'
      ).length,
      reconciled: orders.filter((o) => o.codSettlementStatus === 'RECONCILED').length,
      returned: orders.filter((o) => o.status === 'RETURNED').length,
    };
  }, [orders]);

  // 1-Click Copy Courier Summary
  const handleCopyCourierSummary = (order: OrderRecord) => {
    const itemsDesc = order.items.map((i) => `${i.title} (${i.quantity}x)`).join(', ');
    const summary = [
      `--- REXBEBE COURIER BOOKING ---`,
      `Order Ref: ${order.orderNumber}`,
      `Recipient: ${order.shippingAddress?.recipientName || order.customerName}`,
      `Phone: ${order.phone || order.shippingAddress?.phone || 'N/A'}`,
      `Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}`,
      `District: ${order.shippingAddress?.district || 'Colombo'}`,
      `Payment Method: ${order.paymentMethod}`,
      `COD Amount to Collect: LKR ${(order.amountToCollect ?? order.totalAmount).toLocaleString()}`,
      `Weight: ${order.courierDetails?.parcelWeight || 0.5} kg`,
      `Items: ${itemsDesc}`,
      order.shippingAddress?.deliveryInstructions ? `Delivery Note: ${order.shippingAddress.deliveryInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedOrderId(order.id);
    showToast(`Order #${order.orderNumber} summary copied for courier portal! 📋`);
    setTimeout(() => setCopiedOrderId(null), 3000);
  };

  // Open Assign Courier Modal
  const openAssignModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    const courier = order.courierDetails?.courierProvider || deliverySettings?.activeCouriers[0]?.name || 'PromptX';
    const waybill = order.courierDetails?.waybillNumber || order.trackingNumber || '';
    const courierObj = deliverySettings?.activeCouriers.find((c) => c.name === courier);
    const trackingUrl =
      order.courierDetails?.trackingUrl ||
      (courierObj && waybill ? courierObj.trackingUrlPattern.replace('{tracking}', waybill) : '');

    setAssignForm({
      courierProvider: courier,
      waybillNumber: waybill,
      trackingUrl: trackingUrl,
      parcelWeight: order.courierDetails?.parcelWeight || 0.5,
      deliveryFee: order.shippingFee || 450,
      expectedDeliveryDate:
        order.courierDetails?.expectedDeliveryDate ||
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: order.courierDetails?.notes || '',
    });
    setIsAssignModalOpen(true);
  };

  // Submit Courier Assignment
  const handleSaveCourierAssignment = async () => {
    if (!selectedOrder) return;
    if (!assignForm.waybillNumber.trim()) {
      showToast('Please enter a waybill or tracking number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await assignCourier(selectedOrder.id, {
        courierProvider: assignForm.courierProvider,
        waybillNumber: assignForm.waybillNumber.trim(),
        trackingUrl: assignForm.trackingUrl.trim() || undefined,
        parcelWeight: Number(assignForm.parcelWeight),
        deliveryFee: Number(assignForm.deliveryFee),
        expectedDeliveryDate: assignForm.expectedDeliveryDate || undefined,
        notes: assignForm.notes.trim() || undefined,
      });
      showToast(`Waybill assigned to Order #${selectedOrder.orderNumber} & marked Ready to Ship! 🚚`);
      setIsAssignModalOpen(false);
      setSelectedOrder(null);
    } catch (e) {
      showToast('Failed to assign courier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delivery & Payment Modal
  const openDeliveryModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setDeliveryForm({
      deliveryDate: new Date().toISOString().split('T')[0],
      collectedAmount: order.amountToCollect ?? order.totalAmount,
      note: 'Cash collected by courier delivery officer.',
    });
    setIsDeliveryModalOpen(true);
  };

  // Submit Delivery & Payment Collection
  const handleSaveDelivery = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      await recordDeliveryAndPayment(selectedOrder.id, {
        deliveryDate: deliveryForm.deliveryDate,
        collectedAmount: Number(deliveryForm.collectedAmount),
        note: deliveryForm.note,
      });
      showToast(`Delivery recorded for Order #${selectedOrder.orderNumber}. Cash marked as collected! ✅`);
      setIsDeliveryModalOpen(false);
      setSelectedOrder(null);
    } catch (e) {
      showToast('Failed to record delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Remittance Modal
  const openRemittanceModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setRemittanceForm({
      amountRemitted: order.amountToCollect ?? order.totalAmount,
      remittanceDate: new Date().toISOString().split('T')[0],
      bankReference: '',
      isReconciled: true,
      note: `Remittance from ${order.courierDetails?.courierProvider || 'Courier'} received into bank account.`,
    });
    setIsRemittanceModalOpen(true);
  };

  // Submit Bank Remittance
  const handleSaveRemittance = async () => {
    if (!selectedOrder) return;
    if (!remittanceForm.bankReference.trim()) {
      showToast('Please provide a bank reference or transaction ID.');
      return;
    }
    setIsSubmitting(true);
    try {
      await recordCodRemittance(selectedOrder.id, {
        amountRemitted: Number(remittanceForm.amountRemitted),
        remittanceDate: remittanceForm.remittanceDate,
        bankReference: remittanceForm.bankReference.trim(),
        isReconciled: remittanceForm.isReconciled,
        note: remittanceForm.note,
      });
      showToast(`Order #${selectedOrder.orderNumber} COD remitted & reconciled with bank! 💰`);
      setIsRemittanceModalOpen(false);
      setSelectedOrder(null);
    } catch (e) {
      showToast('Failed to record remittance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm COD Order directly
  const handleConfirmOrder = async (order: OrderRecord) => {
    try {
      await confirmCodOrder(order.id, 'COD order confirmed via Shipping Management.');
      showToast(`Order #${order.orderNumber} confirmed & ready for packing!`);
    } catch (e) {
      showToast('Failed to confirm COD order.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Courier & Shipping Management"
          subtitle="Assign Sri Lanka courier waybills, track dispatch, monitor deliveries and reconcile COD remittances."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top KPI Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Awaiting Confirmation
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-600">{tabCounts.pendingConfirmation}</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Ready to Dispatch
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-sky-700">{tabCounts.pendingDispatch}</span>
                <Package className="w-5 h-5 text-sky-400" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                In Transit with Courier
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-700">{tabCounts.inTransit}</span>
                <Truck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                COD Remittance Pending
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-700">{tabCounts.pendingRemittance}</span>
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Search, Courier Filter, District Filter */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by order #, recipient, district, waybill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All Couriers</option>
                  {deliverySettings?.activeCouriers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All 25 Districts</option>
                  {deliverySettings?.districtRates.map((d) => (
                    <option key={d.district} value={d.district}>
                      {d.district} ({d.zone})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => refreshOrders()}
                  className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
                  title="Refresh orders"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
              {[
                { label: 'All Orders', value: 'ALL', count: tabCounts.all },
                { label: 'Pending Confirmation', value: 'PENDING_CONFIRMATION', count: tabCounts.pendingConfirmation },
                { label: 'Pending Dispatch', value: 'PENDING_DISPATCH', count: tabCounts.pendingDispatch },
                { label: 'In Transit', value: 'IN_TRANSIT', count: tabCounts.inTransit },
                { label: 'Delivered (Pending Remittance)', value: 'DELIVERED_PENDING_REMITTANCE', count: tabCounts.pendingRemittance },
                { label: 'Remitted & Reconciled', value: 'RECONCILED', count: tabCounts.reconciled },
                { label: 'Returned', value: 'RETURNED', count: tabCounts.returned },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === tab.value
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeTab === tab.value ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order / Date</th>
                    <th className="p-4">Recipient & District</th>
                    <th className="p-4">Courier & Waybill</th>
                    <th className="p-4">Payment & COD Amount</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4">Remittance Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const isCod = order.paymentMethod === 'Cash on Delivery (COD)';
                      const courierName = order.courierDetails?.courierProvider || order.carrier || 'Unassigned';
                      const waybill = order.courierDetails?.waybillNumber || order.trackingNumber;
                      const trackingUrl = order.courierDetails?.trackingUrl;

                      return (
                        <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* Order / Date */}
                          <td className="p-4">
                            <span className="font-mono font-black text-stone-900 block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(order.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </td>

                          {/* Recipient & District */}
                          <td className="p-4">
                            <p className="font-bold text-stone-900">
                              {order.shippingAddress?.recipientName || order.customerName}
                            </p>
                            <p className="text-[11px] text-stone-500 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>
                                {order.shippingAddress?.city}, <strong>{order.shippingAddress?.district || 'Colombo'}</strong>
                              </span>
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono">
                              {order.phone || order.shippingAddress?.phone || 'No phone'}
                            </p>
                          </td>

                          {/* Courier & Waybill */}
                          <td className="p-4">
                            <div className="flex items-center space-x-1.5">
                              <Truck className="w-3.5 h-3.5 text-stone-400" />
                              <span className="font-bold text-stone-800">{courierName}</span>
                            </div>
                            {waybill ? (
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="font-mono text-[11px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                  {waybill}
                                </span>
                                {trackingUrl && (
                                  <a
                                    href={trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-600 hover:text-amber-700"
                                    title="Open courier tracking portal"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic">No waybill yet</span>
                            )}
                          </td>

                          {/* Payment & COD Amount */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    isCod
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  }`}
                                >
                                  {isCod ? 'COD' : 'Paid Online'}
                                </span>
                                <span
                                  className={`text-[10px] font-black ${
                                    order.paymentStatus === 'PAID'
                                      ? 'text-emerald-600'
                                      : order.paymentStatus === 'COD_PENDING'
                                      ? 'text-amber-600'
                                      : 'text-stone-500'
                                  }`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <p className="font-black text-stone-900 text-xs">
                                LKR {(order.amountToCollect ?? order.totalAmount).toLocaleString()}
                              </p>
                            </div>
                          </td>

                          {/* Order Status */}
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                order.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'SHIPPED'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : order.status === 'READY_TO_SHIP'
                                  ? 'bg-sky-100 text-sky-800'
                                  : order.status === 'CONFIRMED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'PENDING_CONFIRMATION'
                                  ? 'bg-rose-100 text-rose-800'
                                  : order.status === 'CANCELLED'
                                  ? 'bg-stone-200 text-stone-700'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* COD Remittance Status */}
                          <td className="p-4">
                            {isCod ? (
                              order.codSettlementStatus === 'RECONCILED' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>Reconciled</span>
                                </span>
                              ) : order.status === 'DELIVERED' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Remittance Pending</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium">Pending Delivery</span>
                              )
                            ) : (
                              <span className="text-[10px] text-stone-400">N/A (Card Paid)</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* 1-Click Copy Courier Summary */}
                              <button
                                onClick={() => handleCopyCourierSummary(order)}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                  copiedOrderId === order.id
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs'
                                }`}
                                title="Copy 1-Click formatted summary for courier portal"
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* State-specific primary buttons */}
                              {order.status === 'PENDING_CONFIRMATION' && (
                                <button
                                  onClick={() => handleConfirmOrder(order)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
                                >
                                  Confirm
                                </button>
                              )}

                              {['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(order.status) && (
                                <button
                                  onClick={() => openAssignModal(order)}
                                  className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-2xs flex items-center space-x-1"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>{waybill ? 'Edit Waybill' : 'Assign Courier'}</span>
                                </button>
                              )}

                              {order.status === 'SHIPPED' && (
                                <button
                                  onClick={() => openDeliveryModal(order)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Mark Delivered</span>
                                </button>
                              )}

                              {order.status === 'DELIVERED' && order.codSettlementStatus === 'PENDING_REMITTANCE' && (
                                <button
                                  onClick={() => openRemittanceModal(order)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-2xs flex items-center space-x-1"
                                >
                                  <Building className="w-3 h-3" />
                                  <span>Record Remittance</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-stone-400 font-bold">
                        No shipments match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ASSIGN COURIER MODAL */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Assign Courier Waybill
                  </h3>
                  <p className="text-xs text-stone-500">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Delivery recipient info banner */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
                <p className="font-bold text-amber-950">
                  Recipient: {selectedOrder.shippingAddress?.recipientName} ({selectedOrder.phone || 'No phone'})
                </p>
                <p className="text-amber-800">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city} • District: <strong>{selectedOrder.shippingAddress?.district}</strong>
                </p>
                <p className="text-amber-900 font-black">
                  Amount to Collect: LKR {(selectedOrder.amountToCollect ?? selectedOrder.totalAmount).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Select Courier Partner</label>
                <select
                  value={assignForm.courierProvider}
                  onChange={(e) => handleCourierChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 font-bold bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {deliverySettings?.activeCouriers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="PromptX">PromptX Logistics</option>
                  <option value="Domex">Domex Courier</option>
                  <option value="Koombiyo">Koombiyo Delivery</option>
                  <option value="Pronto">Pronto Lanka</option>
                  <option value="Fardar">Fardar Express</option>
                  <option value="Certis">Certis Lanka</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Waybill / Tracking #</label>
                  <input
                    type="text"
                    placeholder="e.g. PX-902341"
                    value={assignForm.waybillNumber}
                    onChange={(e) => handleWaybillChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Parcel Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={assignForm.parcelWeight}
                    onChange={(e) => setAssignForm({ ...assignForm, parcelWeight: parseFloat(e.target.value) || 0.5 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Tracking URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://track.promptx.lk/?tracking=..."
                  value={assignForm.trackingUrl}
                  onChange={(e) => setAssignForm({ ...assignForm, trackingUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Courier Delivery Fee (LKR)</label>
                  <input
                    type="number"
                    value={assignForm.deliveryFee}
                    onChange={(e) => setAssignForm({ ...assignForm, deliveryFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={assignForm.expectedDeliveryDate}
                    onChange={(e) => setAssignForm({ ...assignForm, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Courier Notes (internal)</label>
                <input
                  type="text"
                  placeholder="e.g. fragile baby set packaging, call before delivery"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveCourierAssignment}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Mark Ready to Ship'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD DELIVERY & PAYMENT COLLECTION MODAL */}
      {isDeliveryModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Record Delivery & Cash Collection
                  </h3>
                  <p className="text-xs text-stone-500">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <p className="font-bold text-stone-900">Courier: {selectedOrder.courierDetails?.courierProvider || 'Courier'}</p>
                <p className="text-stone-600 font-mono">Waybill: {selectedOrder.courierDetails?.waybillNumber || 'N/A'}</p>
                <p className="text-stone-600">Expected COD Collection: <strong>LKR {(selectedOrder.amountToCollect ?? selectedOrder.totalAmount).toLocaleString()}</strong></p>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Actual Cash Collected at Doorstep (LKR)</label>
                <input
                  type="number"
                  value={deliveryForm.collectedAmount}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, collectedAmount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryForm.deliveryDate}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Delivery Notes</label>
                <input
                  type="text"
                  value={deliveryForm.note}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <p>
                  Marking delivery records the customer&apos;s cash payment as <strong>PAID</strong>, but courier bank remittance remains <strong>PENDING</strong> until bank deposit confirmation.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDelivery}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording...' : 'Confirm Delivery & Collection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD BANK REMITTANCE MODAL */}
      {isRemittanceModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Record Courier Bank Remittance
                  </h3>
                  <p className="text-xs text-stone-500">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRemittanceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <p className="font-bold text-stone-900">Courier: {selectedOrder.courierDetails?.courierProvider || 'Courier'}</p>
                <p className="text-stone-600 font-mono">Waybill: {selectedOrder.courierDetails?.waybillNumber || 'N/A'}</p>
                <p className="text-stone-600">Doorstep Cash Collected: <strong>LKR {(selectedOrder.amountToCollect ?? selectedOrder.totalAmount).toLocaleString()}</strong></p>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Amount Remitted to Bank (LKR)</label>
                <input
                  type="number"
                  value={remittanceForm.amountRemitted}
                  onChange={(e) => setRemittanceForm({ ...remittanceForm, amountRemitted: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Bank Statement Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. HNB-FT-98421"
                    value={remittanceForm.bankReference}
                    onChange={(e) => setRemittanceForm({ ...remittanceForm, bankReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Deposit Date</label>
                  <input
                    type="date"
                    value={remittanceForm.remittanceDate}
                    onChange={(e) => setRemittanceForm({ ...remittanceForm, remittanceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Reconciliation Notes</label>
                <input
                  type="text"
                  value={remittanceForm.note}
                  onChange={(e) => setRemittanceForm({ ...remittanceForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRemittanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveRemittance}
                className="px-5 py-2 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording...' : 'Reconcile & Settle Remittance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
