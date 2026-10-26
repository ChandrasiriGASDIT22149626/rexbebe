'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  RotateCcw,
  Truck,
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  Phone,
  MapPin,
  X,
  SlidersHorizontal,
  ArrowRight,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { formatCurrency } from '../../../utils/formatCurrency';
import {
  returnService,
  DeliveryFailureReason,
  FailureReasonOption,
  DEFAULT_FAILURE_REASONS,
  ParcelCondition,
  RestockDecision,
  UnresolvedReturnCase,
} from '../../../services/returnService';
import { OrderRecord } from '../../../services/orderService';

export default function AdminReturnsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [unresolvedCases, setUnresolvedCases] = useState<UnresolvedReturnCase[]>([]);
  const [failureReasons, setFailureReasons] = useState<FailureReasonOption[]>(DEFAULT_FAILURE_REASONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);

  // Modal states
  const [attemptModalOrder, setAttemptModalOrder] = useState<OrderRecord | null>(null);
  const [rtsModalOrder, setRtsModalOrder] = useState<OrderRecord | null>(null);
  const [inspectionModalOrder, setInspectionModalOrder] = useState<OrderRecord | null>(null);
  const [historyModalOrder, setHistoryModalOrder] = useState<OrderRecord | null>(null);

  // Form states for Delivery Attempt
  const [attemptReasonCode, setAttemptReasonCode] = useState<DeliveryFailureReason>('CUSTOMER_UNAVAILABLE');
  const [attemptDate, setAttemptDate] = useState(new Date().toISOString().slice(0, 16));
  const [attemptNotes, setAttemptNotes] = useState('');
  const [attemptNextAction, setAttemptNextAction] = useState<'SCHEDULE_RETRY' | 'INITIATE_RETURN' | 'PENDING_CUSTOMER_CONTACT'>('SCHEDULE_RETRY');
  const [attemptRetryDate, setAttemptRetryDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [attemptAdmin, setAttemptAdmin] = useState('Logistics Lead');

  // Form states for RTS Initiation
  const [rtsReason, setRtsReason] = useState('Multiple failed delivery attempts - customer unreachable');
  const [rtsVerifiedCharge, setRtsVerifiedCharge] = useState<number>(300);
  const [rtsNotes, setRtsNotes] = useState('');
  const [rtsAdmin, setRtsAdmin] = useState('Logistics Supervisor Nuwan');

  // Form states for Return Inspection
  const [inspectionReturnDate, setInspectionReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspectionParcelCondition, setInspectionParcelCondition] = useState<ParcelCondition>('INTACT_SEALED');
  const [inspectionDecision, setInspectionDecision] = useState<RestockDecision>('RESTOCK_APPROVED');
  const [inspectionVerifiedCharge, setInspectionVerifiedCharge] = useState<number>(300);
  const [inspectionInspector, setInspectionInspector] = useState('QC Inspector Shanika');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionItemDecisions, setInspectionItemDecisions] = useState<{
    [variantId: string]: {
      condition: 'INTACT' | 'DAMAGED' | 'MISSING';
      restockApproved: boolean;
      quantityToRestock: number;
      notes: string;
    };
  }>({});

  // Feedback banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [fetchedOrders, fetchedUnresolved, fetchedReasons] = await Promise.all([
        returnService.getAllReturns(),
        returnService.getUnresolvedCases(),
        returnService.getFailureReasons(),
      ]);
      setOrders(fetchedOrders || []);
      setUnresolvedCases(fetchedUnresolved || []);
      if (fetchedReasons && fetchedReasons.length > 0) {
        setFailureReasons(fetchedReasons);
      }
    } catch (err: any) {
      console.error('Failed to load return data:', err);
      setActionErrorMessage('Failed to connect to backend return endpoints. Please ensure backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearNotifications = () => {
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
  };

  // KPI Computations
  const stats = useMemo(() => {
    const total = orders.length;
    const failedDeliveries = orders.filter(
      (o) => o.courierDetails?.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED'
    ).length;
    const returningToSender = orders.filter(
      (o) => o.courierDetails?.deliveryStatus === 'RETURNING_TO_SENDER'
    ).length;
    const pendingInspection = orders.filter(
      (o) =>
        (o.courierDetails?.deliveryStatus === 'RETURNED_TO_SENDER' || o.status === 'RETURNED') &&
        !o.returnInspection
    ).length;
    const inspectedAndRestocked = orders.filter((o) => !!o.returnInspection).length;
    const unresolvedAlertsCount = unresolvedCases.length;

    return {
      total,
      failedDeliveries,
      returningToSender,
      pendingInspection,
      inspectedAndRestocked,
      unresolvedAlertsCount,
    };
  }, [orders, unresolvedCases]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const courier = order.courierDetails;
      const deliveryStatus = courier?.deliveryStatus || order.status;

      // Unresolved filter
      if (unresolvedOnly) {
        const isCase = unresolvedCases.some((c) => c.orderId === order.id || c.orderNumber === order.orderNumber);
        if (!isCase && !order.unresolvedReturnAlert) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (deliveryStatus !== statusFilter && order.status !== statusFilter) return false;
      }

      // Reason filter
      if (reasonFilter !== 'ALL') {
        const lastAttempt = courier?.deliveryAttempts?.[courier.deliveryAttempts.length - 1];
        const reasonMatch =
          courier?.failureReason?.toLowerCase().includes(reasonFilter.toLowerCase()) ||
          courier?.returnReason?.toLowerCase().includes(reasonFilter.toLowerCase()) ||
          lastAttempt?.reason?.toLowerCase().includes(reasonFilter.toLowerCase()) ||
          lastAttempt?.reasonCode === reasonFilter;
        if (!reasonMatch) return false;
      }

      // Condition filter
      if (conditionFilter !== 'ALL') {
        if (order.returnInspection?.parcelCondition !== conditionFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          (order.phone && order.phone.toLowerCase().includes(q)) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
          (courier?.waybillNumber && courier.waybillNumber.toLowerCase().includes(q)) ||
          (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, statusFilter, reasonFilter, conditionFilter, unresolvedOnly, searchQuery, unresolvedCases]);

  // Open modals with prefilled values
  const openAttemptModal = (order: OrderRecord) => {
    setAttemptModalOrder(order);
    const attempts = order.courierDetails?.deliveryAttempts || [];
    const nextNum = attempts.length + 1;
    setAttemptReasonCode('CUSTOMER_UNAVAILABLE');
    setAttemptDate(new Date().toISOString().slice(0, 16));
    setAttemptNotes('');
    setAttemptNextAction(nextNum >= 3 ? 'INITIATE_RETURN' : 'SCHEDULE_RETRY');
    setAttemptRetryDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setAttemptAdmin('Logistics Lead Nuwan');
    clearNotifications();
  };

  const openRtsModal = (order: OrderRecord) => {
    setRtsModalOrder(order);
    const courier = order.courierDetails;
    const defaultReason = courier?.failureReason
      ? `Failed attempts: ${courier.failureReason}`
      : 'Customer unreachable after multiple delivery attempts';
    setRtsReason(defaultReason);
    setRtsVerifiedCharge(order.verifiedReturnCharges || 300);
    setRtsNotes('');
    setRtsAdmin('Logistics Supervisor Nuwan');
    clearNotifications();
  };

  const openInspectionModal = (order: OrderRecord) => {
    setInspectionModalOrder(order);
    setInspectionReturnDate(new Date().toISOString().slice(0, 10));
    setInspectionParcelCondition('INTACT_SEALED');
    setInspectionDecision('RESTOCK_APPROVED');
    setInspectionVerifiedCharge(order.verifiedReturnCharges || 300);
    setInspectionInspector('QC Inspector Shanika');
    setInspectionNotes('');

    // Prepopulate item inspection decisions
    const initialDecisions: any = {};
    for (const item of order.items) {
      initialDecisions[item.variantId] = {
        condition: 'INTACT',
        restockApproved: true,
        quantityToRestock: item.quantity,
        notes: 'Original sealed factory packaging intact',
      };
    }
    setInspectionItemDecisions(initialDecisions);
    clearNotifications();
  };

  // Submit Handlers
  const handleRecordAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptModalOrder) return;

    if (attemptReasonCode === 'OTHER' && (!attemptNotes || attemptNotes.trim().length < 5)) {
      setActionErrorMessage('Documented explanation (minimum 5 characters in notes) is required for reason Other.');
      return;
    }

    setSubmitting(true);
    clearNotifications();
    try {
      const selectedReasonObj = failureReasons.find((r) => r.code === attemptReasonCode);
      const updated = await returnService.recordDeliveryAttempt(attemptModalOrder.id, {
        reasonCode: attemptReasonCode,
        reason: selectedReasonObj ? selectedReasonObj.label : attemptReasonCode,
        date: attemptDate,
        admin: attemptAdmin,
        notes: attemptNotes,
        nextAction: attemptNextAction,
        scheduledRetryDate: attemptNextAction === 'SCHEDULE_RETRY' ? attemptRetryDate : undefined,
      });
      setActionSuccessMessage(
        `Delivery attempt recorded for Order #${updated.orderNumber}. Next action: ${attemptNextAction}. COD collection remains pending.`
      );
      setAttemptModalOrder(null);
      await loadData(true);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to record delivery attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateRts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtsModalOrder) return;

    if (!rtsReason || rtsReason.trim().length < 5) {
      setActionErrorMessage('A documented return reason (minimum 5 characters) is required.');
      return;
    }

    setSubmitting(true);
    clearNotifications();
    try {
      const updated = await returnService.initiateReturnToSender(rtsModalOrder.id, {
        reason: rtsReason.trim(),
        verifiedReturnCharge: Number(rtsVerifiedCharge) || 300,
        admin: rtsAdmin,
        notes: rtsNotes,
      });
      setActionSuccessMessage(
        `Return-to-Sender initiated for Order #${updated.orderNumber}. Verified return charge: LKR ${Number(rtsVerifiedCharge).toLocaleString()}.`
      );
      setRtsModalOrder(null);
      await loadData(true);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to initiate Return-to-Sender.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionModalOrder) return;

    setSubmitting(true);
    clearNotifications();
    try {
      const itemsPayload = inspectionModalOrder.items.map((item) => {
        const decision = inspectionItemDecisions[item.variantId] || {
          condition: 'INTACT',
          restockApproved: true,
          quantityToRestock: item.quantity,
          notes: '',
        };
        return {
          variantId: item.variantId,
          condition: decision.condition,
          quantityReturned: item.quantity,
          quantityToRestock: decision.restockApproved ? Number(decision.quantityToRestock) || 0 : 0,
          restockApproved: Boolean(decision.restockApproved),
          notes: decision.notes,
        };
      });

      const updated = await returnService.processReturnInspection(inspectionModalOrder.id, {
        returnDate: inspectionReturnDate,
        parcelCondition: inspectionParcelCondition,
        decision: inspectionDecision,
        inspector: inspectionInspector,
        verifiedReturnCharge: Number(inspectionVerifiedCharge) || 300,
        notes: inspectionNotes,
        items: itemsPayload,
      });

      const totalRestocked = itemsPayload.reduce((sum, it) => sum + (it.restockApproved ? it.quantityToRestock : 0), 0);

      setActionSuccessMessage(
        `Warehouse Return Inspection completed for Order #${updated.orderNumber}! Condition: ${inspectionParcelCondition}, Decision: ${inspectionDecision}. Exactly ${totalRestocked} undamaged units restored to inventory.`
      );
      setInspectionModalOrder(null);
      await loadData(true);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to process return inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 font-sans text-stone-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Failed Delivery & Return-to-Sender Center" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Feedback Banners */}
          {actionSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3 shadow-sm animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium">{actionSuccessMessage}</div>
              <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {actionErrorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3 shadow-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium">{actionErrorMessage}</div>
              <button onClick={() => setActionErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Unresolved Cases High-Priority Notification Banner */}
          {unresolvedCases.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-rose-500/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center space-x-2">
                      <span>{unresolvedCases.length} Unresolved Failed Delivery / Return Cases Require Review</span>
                      <span className="px-2.5 py-0.5 bg-white text-rose-700 rounded-full text-xs font-black uppercase">
                        Action Needed
                      </span>
                    </h3>
                    <p className="text-white/90 text-xs sm:text-sm">
                      Deliveries with repeated failures, customer refusals, or parcels received at the warehouse pending inspection.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setUnresolvedOnly(!unresolvedOnly)}
                  className="px-4 py-2 bg-white text-rose-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {unresolvedOnly ? 'Show All Orders' : 'Filter Unresolved Only'}
                </button>
              </div>

              {/* Quick triage carousel/list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {unresolvedCases.slice(0, 3).map((c) => (
                  <div key={c.orderId} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-xs border border-white/20 space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-white">#{c.orderNumber}</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] uppercase font-black">
                        {c.unresolvedType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-white/90 text-[11px] line-clamp-1">{c.summary}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[11px]">
                      <span>{c.customerName} ({c.phone || 'No phone'})</span>
                      <button
                        onClick={() => {
                          const matched = orders.find((o) => o.id === c.orderId || o.orderNumber === c.orderNumber);
                          if (matched) {
                            if (c.unresolvedType === 'PENDING_WAREHOUSE_INSPECTION') openInspectionModal(matched);
                            else openAttemptModal(matched);
                          }
                        }}
                        className="underline font-bold text-white hover:text-white/80"
                      >
                        Resolve →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs uppercase font-bold text-stone-500 tracking-wider">Total Return Cases</span>
              <div className="text-2xl font-black text-stone-900">{stats.total}</div>
              <div className="text-[11px] text-stone-500">Recorded across COD orders</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">Failed Attempts</span>
              <div className="text-2xl font-black text-amber-600">{stats.failedDeliveries}</div>
              <div className="text-[11px] text-amber-700">Doorstep delivery failed</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs uppercase font-bold text-orange-700 tracking-wider">Returning to Sender</span>
              <div className="text-2xl font-black text-orange-600">{stats.returningToSender}</div>
              <div className="text-[11px] text-orange-700">In courier transit back</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs uppercase font-bold text-rose-700 tracking-wider">Pending Inspection</span>
              <div className="text-2xl font-black text-rose-600">{stats.pendingInspection}</div>
              <div className="text-[11px] text-rose-700">Awaiting QC inspection</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Restocked / Settled</span>
              <div className="text-2xl font-black text-emerald-600">{stats.inspectedAndRestocked}</div>
              <div className="text-[11px] text-emerald-700">Inspected with audit record</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order #, customer, tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setUnresolvedOnly(!unresolvedOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    unresolvedOnly
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Unresolved Only ({unresolvedCases.length})</span>
                </button>

                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center space-x-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Delivery / RTS Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  <option value="DELIVERY_ATTEMPT_FAILED">Delivery Attempt Failed</option>
                  <option value="RETURNING_TO_SENDER">Returning to Sender (In Transit)</option>
                  <option value="RETURNED_TO_SENDER">Returned to Warehouse</option>
                  <option value="RETURNED">Order Status Returned</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Failure Reason</label>
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Failure Reasons</option>
                  {failureReasons.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Parcel Condition (Inspected)</label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Parcel Conditions</option>
                  <option value="INTACT_SEALED">Intact & Sealed</option>
                  <option value="PACKAGING_OPENED">Packaging Opened</option>
                  <option value="DAMAGED_TRANSIT">Damaged in Transit</option>
                  <option value="MISSING_ITEMS">Missing Items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Returns & Failed Delivery Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">Failed Deliveries &amp; Return Orders</h2>
                <p className="text-xs text-stone-500">
                  Showing {filteredOrders.length} records matching current criteria.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-stone-100 text-stone-700 font-bold rounded-lg">
                Koombiyo Verified Return Rate: LKR 300
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center text-stone-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-stone-300" />
                <p className="text-xs">Loading returns from backend ledger...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-16 text-center text-stone-400 space-y-2">
                <RotateCcw className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-sm font-bold text-stone-600">No Failed Deliveries or Returns Found</p>
                <p className="text-xs text-stone-400">
                  {unresolvedOnly
                    ? 'No unresolved cases require immediate action right now.'
                    : 'No orders match your active filter settings.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Order &amp; Date</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Delivery Status &amp; Attempts</th>
                      <th className="p-4">Failure / Return Reason</th>
                      <th className="p-4">COD Status</th>
                      <th className="p-4">Inspection &amp; Restock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {filteredOrders.map((order) => {
                      const courier = order.courierDetails;
                      const attempts = courier?.deliveryAttempts || [];
                      const isUnresolved = Boolean(
                        order.unresolvedReturnAlert ||
                          unresolvedCases.some((c) => c.orderId === order.id || c.orderNumber === order.orderNumber)
                      );
                      const isReturned =
                        courier?.deliveryStatus === 'RETURNED_TO_SENDER' || order.status === 'RETURNED';

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-stone-50/80 transition-colors ${
                            isUnresolved ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Order & Date */}
                          <td className="p-4 space-y-1">
                            <div className="font-bold text-stone-900 text-sm flex items-center space-x-1.5">
                              <span>#{order.orderNumber}</span>
                              {isUnresolved && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Unresolved Case" />
                              )}
                            </div>
                            <div className="text-stone-400 text-[11px]">
                              {new Date(order.createdAt).toLocaleDateString('en-LK', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="font-medium text-stone-600">
                              LKR {order.totalAmount.toLocaleString()}
                            </div>
                          </td>

                          {/* Customer Details */}
                          <td className="p-4 space-y-0.5">
                            <div className="font-bold text-stone-900">{order.customerName}</div>
                            <div className="text-stone-500 text-[11px] flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{order.phone || order.shippingAddress?.phone || 'No phone'}</span>
                            </div>
                            <div className="text-stone-500 text-[11px] flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span>
                                {order.shippingAddress?.city || 'Colombo'}, {order.shippingAddress?.district || 'Gampaha'}
                              </span>
                            </div>
                          </td>

                          {/* Delivery Status & Attempts */}
                          <td className="p-4 space-y-1.5">
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  courier?.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : courier?.deliveryStatus === 'RETURNING_TO_SENDER'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : courier?.deliveryStatus === 'RETURNED_TO_SENDER' || order.status === 'RETURNED'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {courier?.deliveryStatus || order.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-stone-600 font-medium">
                              {attempts.length > 0 ? (
                                <span className="font-bold text-stone-900">
                                  Attempt {attempts.length} logged
                                </span>
                              ) : (
                                <span className="text-stone-400">No attempts logged</span>
                              )}
                              {attempts.length > 0 && attempts[attempts.length - 1]?.date && (
                                <div className="text-[10px] text-stone-400">
                                  Last: {new Date(attempts[attempts.length - 1].date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Failure / Return Reason */}
                          <td className="p-4 space-y-1 max-w-[220px]">
                            {courier?.failureReason || courier?.returnReason ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-stone-900 block truncate" title={courier?.failureReason || courier?.returnReason}>
                                  {courier?.failureReason || courier?.returnReason}
                                </span>
                                {attempts[attempts.length - 1]?.notes && (
                                  <p className="text-stone-500 text-[11px] italic line-clamp-2" title={attempts[attempts.length - 1]?.notes}>
                                    &ldquo;{attempts[attempts.length - 1]?.notes}&rdquo;
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">None documented</span>
                            )}
                          </td>

                          {/* COD Status */}
                          <td className="p-4 space-y-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                order.codCollectionStatus === 'COLLECTED_BY_COURIER'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {order.codCollectionStatus === 'COLLECTED_BY_COURIER'
                                ? 'Collected'
                                : 'Collection Pending'}
                            </span>
                            <div className="text-[10px] text-stone-400">
                              Payment: {order.paymentStatus}
                            </div>
                            {order.verifiedReturnCharges !== undefined && order.verifiedReturnCharges > 0 && (
                              <div className="text-[10px] text-rose-700 font-bold">
                                Return Fee: LKR {order.verifiedReturnCharges}
                              </div>
                            )}
                          </td>

                          {/* Inspection & Restock Decision */}
                          <td className="p-4 space-y-1">
                            {order.returnInspection ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] block w-fit">
                                  {order.returnInspection.decision.replace(/_/g, ' ')}
                                </span>
                                <div className="text-[10px] text-stone-600 font-medium">
                                  Condition: <strong className="font-bold">{order.returnInspection.parcelCondition}</strong>
                                </div>
                                <div className="text-[10px] text-stone-400">
                                  By {order.returnInspection.inspector} on {order.returnInspection.returnDate}
                                </div>
                              </div>
                            ) : isReturned ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded text-[10px] inline-block animate-pulse">
                                Inspection Pending
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right space-y-1.5">
                            <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
                              {/* Record Delivery Attempt */}
                              <button
                                onClick={() => openAttemptModal(order)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                                title="Record delivery attempt, failure reason & next retry"
                              >
                                <Truck className="w-3 h-3 text-amber-700" />
                                <span>Record Attempt</span>
                              </button>

                              {/* Initiate RTS if not already returning/returned */}
                              {courier?.deliveryStatus !== 'RETURNING_TO_SENDER' &&
                                courier?.deliveryStatus !== 'RETURNED_TO_SENDER' &&
                                order.status !== 'RETURNED' && (
                                  <button
                                    onClick={() => openRtsModal(order)}
                                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                                    title="Initiate Return to Sender"
                                  >
                                    <RotateCcw className="w-3 h-3 text-orange-700" />
                                    <span>Initiate RTS</span>
                                  </button>
                                )}

                              {/* Warehouse Inspection & Restock */}
                              {isReturned && (
                                <button
                                  onClick={() => openInspectionModal(order)}
                                  className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-sm"
                                  title="Inspect parcel & make conditional restocking decisions"
                                >
                                  <ShieldCheck className="w-3 h-3 text-brand-700" />
                                  <span>{order.returnInspection ? 'Re-inspect' : 'Inspect & Restock'}</span>
                                </button>
                              )}

                              {/* View Complete History */}
                              <button
                                onClick={() => setHistoryModalOrder(order)}
                                className="p-1 text-stone-400 hover:text-stone-900 rounded"
                                title="View Complete Audit History"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: Record Delivery Attempt */}
      {attemptModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Doorstep Logistics</span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Record Delivery Attempt — #{attemptModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Customer: {attemptModalOrder.customerName} ({attemptModalOrder.phone})
                </p>
              </div>
              <button onClick={() => setAttemptModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAttempt} className="space-y-4 text-xs">
              {/* Attempt Number & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Attempt Number</label>
                  <input
                    type="text"
                    disabled
                    value={`Attempt #${(attemptModalOrder.courierDetails?.deliveryAttempts?.length || 0) + 1}`}
                    className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Attempt Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={attemptDate}
                    onChange={(e) => setAttemptDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Standardized Failure Reason */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Delivery Failure Reason *</label>
                <select
                  required
                  value={attemptReasonCode}
                  onChange={(e) => setAttemptReasonCode(e.target.value as DeliveryFailureReason)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-brand-500 font-bold"
                >
                  {failureReasons.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  {failureReasons.find((r) => r.code === attemptReasonCode)?.description}
                </p>
              </div>

              {/* Documented Notes (Mandatory if OTHER) */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Documented Notes {attemptReasonCode === 'OTHER' ? <span className="text-rose-600">* (Min 5 chars)</span> : '(Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={attemptNotes}
                  onChange={(e) => setAttemptNotes(e.target.value)}
                  placeholder="Record rider observations, call attempts, or doorstep details..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Next Action Selection */}
              <div>
                <label className="block font-bold text-stone-700 mb-2">Next Recommended Action *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      attemptNextAction === 'SCHEDULE_RETRY'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <input
                        type="radio"
                        name="nextAction"
                        checked={attemptNextAction === 'SCHEDULE_RETRY'}
                        onChange={() => setAttemptNextAction('SCHEDULE_RETRY')}
                      />
                      <span className="text-xs">Schedule Retry</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal">Next delivery attempt</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      attemptNextAction === 'INITIATE_RETURN'
                        ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <input
                        type="radio"
                        name="nextAction"
                        checked={attemptNextAction === 'INITIATE_RETURN'}
                        onChange={() => setAttemptNextAction('INITIATE_RETURN')}
                      />
                      <span className="text-xs">Initiate RTS</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal">Return parcel to warehouse</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      attemptNextAction === 'PENDING_CUSTOMER_CONTACT'
                        ? 'bg-stone-100 border-stone-300 text-stone-900 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <input
                        type="radio"
                        name="nextAction"
                        checked={attemptNextAction === 'PENDING_CUSTOMER_CONTACT'}
                        onChange={() => setAttemptNextAction('PENDING_CUSTOMER_CONTACT')}
                      />
                      <span className="text-xs">Contact First</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal">Call customer before retry</span>
                  </label>
                </div>
              </div>

              {/* Scheduled Retry Date if SCHEDULE_RETRY */}
              {attemptNextAction === 'SCHEDULE_RETRY' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <label className="block font-bold text-amber-900">Scheduled Re-delivery Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={attemptRetryDate}
                    onChange={(e) => setAttemptRetryDate(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Admin attribution */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Acting Administrator *</label>
                <input
                  type="text"
                  required
                  value={attemptAdmin}
                  onChange={(e) => setAttemptAdmin(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              {/* Strict Notice */}
              <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600 flex items-center space-x-2">
                <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Strict Business Rule:</strong> COD collection will strictly remain <em>Pending</em> and stock is NOT restored until physically received.
                </span>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAttemptModalOrder(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Recording Attempt...' : 'Save Attempt Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Initiate Return-to-Sender (RTS) */}
      {rtsModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Logistics Reverse Workflow</span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Initiate Return-to-Sender — #{rtsModalOrder.orderNumber}
                </h3>
              </div>
              <button onClick={() => setRtsModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateRts} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Documented Return Reason * (Min 5 chars)</label>
                <textarea
                  required
                  rows={3}
                  value={rtsReason}
                  onChange={(e) => setRtsReason(e.target.value)}
                  placeholder="Specify why parcel is returning (e.g. repeated failure, customer refused, unreachable phone)..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Verified Return Charge (Koombiyo Rate) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">LKR</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={rtsVerifiedCharge}
                    onChange={(e) => setRtsVerifiedCharge(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Contracted Koombiyo reverse logistics handling fee is LKR 300.
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Administrator Authorizing RTS *</label>
                <input
                  type="text"
                  required
                  value={rtsAdmin}
                  onChange={(e) => setRtsAdmin(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 space-y-1 border border-amber-200">
                <span className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Important Constraint:</span>
                </span>
                <p>
                  Setting status to <strong>Returning to Sender</strong> flags an unresolved alert for warehouse inspection. Inventory will <strong>NOT</strong> be restored until physical reception and inspection.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRtsModalOrder(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Initiating RTS...' : 'Confirm Return-to-Sender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Warehouse Physical Reception & Conditional Return Inspection */}
      {inspectionModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Warehouse Reception &amp; Quality Control</span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Return Inspection — Order #{inspectionModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Perform physical parcel condition verification and itemized restocking evaluation.
                </p>
              </div>
              <button onClick={() => setInspectionModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessInspection} className="space-y-5 text-xs">
              {/* Return Date & Parcel Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Physical Parcel Return Date *</label>
                  <input
                    type="date"
                    required
                    value={inspectionReturnDate}
                    onChange={(e) => setInspectionReturnDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Overall Parcel Condition *</label>
                  <select
                    required
                    value={inspectionParcelCondition}
                    onChange={(e) => setInspectionParcelCondition(e.target.value as ParcelCondition)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800"
                  >
                    <option value="INTACT_SEALED">Intact &amp; Sealed (Original State)</option>
                    <option value="PACKAGING_OPENED">Packaging Opened (Garment Intact)</option>
                    <option value="DAMAGED_TRANSIT">Damaged in Courier Transit</option>
                    <option value="MISSING_ITEMS">Missing Items / Shortage</option>
                  </select>
                </div>
              </div>

              {/* Itemized Restocking Checklist */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-stone-800 uppercase text-[11px] tracking-wider">
                    Itemized Returned Goods Evaluation
                  </label>
                  <span className="text-[11px] text-stone-500 italic">
                    Restock stock ONLY for approved undamaged garments
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                  {inspectionModalOrder.items.map((item) => {
                    const currentDecision = inspectionItemDecisions[item.variantId] || {
                      condition: 'INTACT',
                      restockApproved: true,
                      quantityToRestock: item.quantity,
                      notes: '',
                    };

                    return (
                      <div key={item.variantId} className="p-3.5 space-y-2 bg-stone-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-stone-900">{item.title}</div>
                            <div className="text-stone-500 text-[11px]">
                              {item.color ? `Color: ${item.color}` : ''} {item.size ? `| Size: ${item.size}` : ''} | Returned Qty: <strong className="text-stone-900 font-bold">{item.quantity}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-stone-900">LKR {item.price.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                          {/* Unit Condition */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">Condition</label>
                            <select
                              value={currentDecision.condition}
                              onChange={(e) => {
                                const newCond = e.target.value as 'INTACT' | 'DAMAGED' | 'MISSING';
                                setInspectionItemDecisions({
                                  ...inspectionItemDecisions,
                                  [item.variantId]: {
                                    ...currentDecision,
                                    condition: newCond,
                                    restockApproved: newCond === 'INTACT',
                                    quantityToRestock: newCond === 'INTACT' ? item.quantity : 0,
                                  },
                                });
                              }}
                              className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                            >
                              <option value="INTACT">Intact (Saleable)</option>
                              <option value="DAMAGED">Damaged (Unsellable)</option>
                              <option value="MISSING">Missing Item</option>
                            </select>
                          </div>

                          {/* Restock Approval Toggle */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">Restock Approval</label>
                            <select
                              value={currentDecision.restockApproved ? 'YES' : 'NO'}
                              onChange={(e) => {
                                const isApproved = e.target.value === 'YES';
                                setInspectionItemDecisions({
                                  ...inspectionItemDecisions,
                                  [item.variantId]: {
                                    ...currentDecision,
                                    restockApproved: isApproved,
                                    quantityToRestock: isApproved ? item.quantity : 0,
                                  },
                                });
                              }}
                              className={`w-full p-1.5 border rounded-lg text-xs font-bold ${
                                currentDecision.restockApproved
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              <option value="YES">Approve Restock</option>
                              <option value="NO">Reject Restock (Loss/Damage)</option>
                            </select>
                          </div>

                          {/* Qty to Restock */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">Quantity to Add</label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity}
                              disabled={!currentDecision.restockApproved}
                              value={currentDecision.quantityToRestock}
                              onChange={(e) => {
                                setInspectionItemDecisions({
                                  ...inspectionItemDecisions,
                                  [item.variantId]: {
                                    ...currentDecision,
                                    quantityToRestock: Math.min(item.quantity, Math.max(0, Number(e.target.value))),
                                  },
                                });
                              }}
                              className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 disabled:bg-stone-100 disabled:text-stone-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall Restocking Decision & Verified Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Overall Inspection Decision *</label>
                  <select
                    required
                    value={inspectionDecision}
                    onChange={(e) => setInspectionDecision(e.target.value as RestockDecision)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  >
                    <option value="RESTOCK_APPROVED">Full Restock Approved</option>
                    <option value="PARTIAL_RESTOCK">Partial Restock (Mixed Goods)</option>
                    <option value="RESTOCK_REJECTED">Restock Rejected (Damaged / Unusable)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Verified Return Courier Fee (LKR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={inspectionVerifiedCharge}
                    onChange={(e) => setInspectionVerifiedCharge(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* Inspector Name & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Quality Inspector Name *</label>
                  <input
                    type="text"
                    required
                    value={inspectionInspector}
                    onChange={(e) => setInspectionInspector(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Inspection Notes</label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="E.g., Original garment tags intact, repackaged"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Strict Notice */}
              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 border border-emerald-200 space-y-1">
                <span className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Guaranteed Inventory Integrity:</span>
                </span>
                <p>
                  Only items and quantities marked with <em>Approve Restock</em> will be incremented in the central inventory catalog. Damaged or missing units will be recorded in the audit trail without inflating saleable stock.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setInspectionModalOrder(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Applying Inspection...' : 'Confirm Inspection & Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Complete Timeline & Tracking History */}
      {historyModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Audit History &amp; Courier Logistics</span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Tracking Trail — #{historyModalOrder.orderNumber}
                </h3>
              </div>
              <button onClick={() => setHistoryModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Delivery Attempts Summary */}
              {historyModalOrder.courierDetails?.deliveryAttempts &&
                historyModalOrder.courierDetails.deliveryAttempts.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-900 block">
                      Delivery Attempts Summary ({historyModalOrder.courierDetails.deliveryAttempts.length})
                    </span>
                    <div className="space-y-2 text-xs divide-y divide-amber-200/60">
                      {historyModalOrder.courierDetails.deliveryAttempts.map((att, idx) => (
                        <div key={idx} className="pt-2 first:pt-0 space-y-0.5">
                          <div className="flex justify-between items-center font-bold text-amber-900">
                            <span>Attempt #{att.attemptNumber}</span>
                            <span className="text-[10px] text-amber-700">{new Date(att.date).toLocaleString()}</span>
                          </div>
                          <div className="text-stone-700 font-medium">Reason: {att.reason}</div>
                          {att.notes && <div className="text-stone-500 text-[11px] italic">Note: {att.notes}</div>}
                          {att.scheduledRetryDate && (
                            <div className="text-[11px] text-amber-800 font-bold">
                              Retry Scheduled: {new Date(att.scheduledRetryDate).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Inspection Summary */}
              {historyModalOrder.returnInspection && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 uppercase tracking-wider block">
                    Warehouse Inspection Summary
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-stone-700">
                    <div>
                      Condition: <strong>{historyModalOrder.returnInspection.parcelCondition}</strong>
                    </div>
                    <div>
                      Decision: <strong>{historyModalOrder.returnInspection.decision}</strong>
                    </div>
                    <div>
                      Inspector: <strong>{historyModalOrder.returnInspection.inspector}</strong>
                    </div>
                    <div>
                      Return Fee: <strong>LKR {historyModalOrder.returnInspection.returnCharges}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Chronological Timeline */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-stone-600 uppercase tracking-wider block">
                  Chronological Audit Timeline
                </span>
                <div className="space-y-3 relative pl-4 border-l-2 border-stone-200 text-xs">
                  {(historyModalOrder.timeline || []).map((t, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-600 border-2 border-white" />
                      <div className="flex justify-between items-center font-bold text-stone-900">
                        <span>{t.status}</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(t.time).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-stone-600 leading-relaxed text-[11px]">{t.note}</p>
                      {t.admin && <span className="text-[10px] text-stone-400 block">By: {t.admin}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setHistoryModalOrder(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
