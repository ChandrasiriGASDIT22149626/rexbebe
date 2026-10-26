'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Banknote,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Calendar,
  Truck,
  Search,
  RefreshCw,
  X,
  Check,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Settings,
  Plus,
  Trash2,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  BarChart3,
  PieChart,
  Layers,
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Package,
  RotateCcw,
} from 'lucide-react';
import { AdminSidebar } from '../../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../../components/layout/AdminHeader';
import {
  settlementService,
  CodFinancialStatus,
  CourierDeductionItem,
  SettlementRecord,
  CourierMerchantAgreement,
  CodFinancialLedgerResponse,
} from '../../../../services/settlementService';
import { OrderRecord, orderService } from '../../../../services/orderService';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function AdminCodReportsPage() {
  const [ledgerData, setLedgerData] = useState<CodFinancialLedgerResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [notificationConfig, setNotificationConfig] = useState<any>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'PERIODIC' | 'ZONES' | 'FULFILLMENT' | 'COURIER_EXPENSES' | 'NOTIFICATIONS'>('LEDGER');
  const [periodicView, setPeriodicView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Settle Remittance Modal
  const [selectedOrderForSettlement, setSelectedOrderForSettlement] = useState<OrderRecord | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState<{
    settlementBatchRef: string;
    settlementDate: string;
    bankReference: string;
    courierReportedAmount: number;
    documentedDeductions: CourierDeductionItem[];
    actualAmountReceived: number;
    discrepancyReason: string;
    authorizedBy: string;
    notes: string;
  }>({
    settlementBatchRef: '',
    settlementDate: new Date().toISOString().split('T')[0],
    bankReference: '',
    courierReportedAmount: 0,
    documentedDeductions: [],
    actualAmountReceived: 0,
    discrepancyReason: '',
    authorizedBy: 'Authorized Finance Admin',
    notes: '',
  });

  // Courier Collection Modal
  const [selectedOrderForCollection, setSelectedOrderForCollection] = useState<OrderRecord | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState<{
    status: 'COLLECTED_BY_COURIER' | 'COLLECTION_DISPUTED' | 'COLLECTION_PENDING';
    courierReportedAmount: number;
    collectionDate: string;
    disputeReason: string;
    admin: string;
    notes: string;
  }>({
    status: 'COLLECTED_BY_COURIER',
    courierReportedAmount: 0,
    collectionDate: new Date().toISOString().split('T')[0],
    disputeReason: '',
    admin: 'Delivery Ops Admin',
    notes: '',
  });

  // Merchant Agreement Settings Drawer/Modal
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreement, setAgreement] = useState<CourierMerchantAgreement | null>(null);
  const [isSavingAgreement, setIsSavingAgreement] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLedger = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [ledger, analytics, notifStatus, notifs] = await Promise.all([
        settlementService.getCodFinancialLedger({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          courier: courierFilter || undefined,
          financialStatus: financialStatusFilter !== 'ALL' ? (financialStatusFilter as CodFinancialStatus) : undefined,
          search: searchQuery || undefined,
        }),
        orderService.getCodAnalytics({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchQuery || undefined,
        }).catch(() => null),
        orderService.getNotificationStatus().catch(() => null),
        orderService.getRecentNotifications(50).catch(() => []),
      ]);
      setLedgerData(ledger);
      if (analytics) setAnalyticsData(analytics);
      if (notifStatus) setNotificationConfig(notifStatus);
      if (notifs) setRecentNotifications(notifs);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to load COD financial ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgreement = async () => {
    try {
      const agr = await settlementService.getMerchantAgreement();
      setAgreement(agr);
    } catch (e) {
      console.warn('Could not load merchant agreement:', e);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchAgreement();
  }, [startDate, endDate, courierFilter, financialStatusFilter]);

  // Open Settle Remittance Modal
  const openSettlementModal = (order: OrderRecord) => {
    setSelectedOrderForSettlement(order);
    const expected = order.amountToCollect ?? order.totalAmount ?? 0;
    const reported = order.courierReportedAmount ?? expected;

    // Standard deductions from agreement (e.g. delivery fee)
    const initialDeductions: CourierDeductionItem[] = agreement?.standardDeductions && agreement.standardDeductions.length > 0
      ? agreement.standardDeductions.map(d => ({ ...d }))
      : [
          {
            type: 'DELIVERY_FEE',
            amount: order.shippingFee || 400,
            description: 'Contracted parcel delivery fee as per zone rate',
          },
        ];

    const totalDeds = initialDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const expectedRemittance = Math.max(0, reported - totalDeds);

    setSettlementForm({
      settlementBatchRef: order.settlementRecord?.settlementBatchRef || `KMB-SETTL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      settlementDate: order.settlementRecord?.settlementDate || new Date().toISOString().split('T')[0],
      bankReference: order.settlementRecord?.bankReference || order.courierDetails?.bankReference || '',
      courierReportedAmount: reported,
      documentedDeductions: order.settlementRecord?.documentedDeductions || initialDeductions,
      actualAmountReceived: order.settlementRecord?.actualAmountReceived || expectedRemittance,
      discrepancyReason: order.settlementRecord?.discrepancyReason || '',
      authorizedBy: order.settlementRecord?.authorizedBy || 'Authorized Finance Admin',
      notes: order.settlementRecord?.notes || '',
    });
    setErrorMessage(null);
    setIsSettlementModalOpen(true);
  };

  // Open Courier Collection Modal
  const openCollectionModal = (order: OrderRecord) => {
    setSelectedOrderForCollection(order);
    const expected = order.amountToCollect ?? order.totalAmount ?? 0;
    setCollectionForm({
      status: order.codCollectionStatus === 'COLLECTION_DISPUTED' ? 'COLLECTION_DISPUTED' : 'COLLECTED_BY_COURIER',
      courierReportedAmount: order.courierReportedAmount ?? expected,
      collectionDate: order.collectionDate || new Date().toISOString().split('T')[0],
      disputeReason: order.courierDetails?.failureReason || '',
      admin: 'Delivery Ops Admin',
      notes: order.courierDetails?.courierNotes || '',
    });
    setErrorMessage(null);
    setIsCollectionModalOpen(true);
  };

  // Save Settle Remittance
  const handleSaveSettlement = async () => {
    if (!selectedOrderForSettlement) return;
    setErrorMessage(null);

    if (!settlementForm.settlementBatchRef.trim()) {
      setErrorMessage('Settlement batch or reference number is required.');
      return;
    }
    if (!settlementForm.bankReference.trim()) {
      setErrorMessage('Bank deposit or statement reference is required.');
      return;
    }
    if (!settlementForm.authorizedBy.trim()) {
      setErrorMessage('Authorized administrator confirmation is required.');
      return;
    }

    const totalDeds = settlementForm.documentedDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const expectedRemittance = Math.max(0, settlementForm.courierReportedAmount - totalDeds);
    const shortfall = expectedRemittance - Number(settlementForm.actualAmountReceived);

    if (shortfall > 0 && (!settlementForm.discrepancyReason || settlementForm.discrepancyReason.trim().length < 5)) {
      setErrorMessage(`Discrepancy detected (Shortfall of LKR ${shortfall.toLocaleString()}). A specific adjustment reason (minimum 5 characters) is required.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await settlementService.recordSettlement({
        orderId: selectedOrderForSettlement.id,
        orderNumber: selectedOrderForSettlement.orderNumber,
        courierProvider: selectedOrderForSettlement.courierDetails?.courierProvider || 'Koombiyo Delivery',
        expectedCodAmount: selectedOrderForSettlement.amountToCollect ?? selectedOrderForSettlement.totalAmount,
        courierReportedAmount: Number(settlementForm.courierReportedAmount),
        collectionDate: selectedOrderForSettlement.collectionDate,
        settlementBatchRef: settlementForm.settlementBatchRef.trim(),
        settlementDate: settlementForm.settlementDate,
        bankReference: settlementForm.bankReference.trim(),
        documentedDeductions: settlementForm.documentedDeductions,
        actualAmountReceived: Number(settlementForm.actualAmountReceived),
        discrepancyReason: settlementForm.discrepancyReason.trim(),
        authorizedBy: settlementForm.authorizedBy.trim(),
        notes: settlementForm.notes,
      });

      showToast(
        res.isUpdate
          ? `Settlement batch ${res.settlement.settlementBatchRef} updated successfully! 💰`
          : `Settlement confirmed & recorded under batch ${res.settlement.settlementBatchRef}! 💰`
      );
      setIsSettlementModalOpen(false);
      setSelectedOrderForSettlement(null);
      await fetchLedger();
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to record settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Courier Collection Event
  const handleSaveCollection = async () => {
    if (!selectedOrderForCollection) return;
    setErrorMessage(null);

    if (collectionForm.status === 'COLLECTION_DISPUTED') {
      if (!collectionForm.disputeReason || collectionForm.disputeReason.trim().length < 5) {
        setErrorMessage('A specific dispute reason (minimum 5 characters) is required when marking a COD collection as disputed.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await settlementService.recordCodCollection(selectedOrderForCollection.id, {
        status: collectionForm.status,
        courierReportedAmount: Number(collectionForm.courierReportedAmount),
        collectionDate: collectionForm.collectionDate,
        disputeReason: collectionForm.disputeReason.trim(),
        admin: collectionForm.admin.trim(),
        notes: collectionForm.notes,
      });

      showToast(`Collection status updated for Order #${selectedOrderForCollection.orderNumber}! 🚚`);
      setIsCollectionModalOpen(false);
      setSelectedOrderForCollection(null);
      await fetchLedger();
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to record collection status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Agreement Settings
  const handleSaveAgreement = async () => {
    if (!agreement) return;
    setIsSavingAgreement(true);
    try {
      const updated = await settlementService.updateMerchantAgreement(agreement);
      setAgreement(updated);
      showToast('Merchant Agreement & Standard Deduction settings saved! 📋');
      setIsAgreementModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Failed to update agreement.');
    } finally {
      setIsSavingAgreement(false);
    }
  };

  // Add / Remove Deduction Rows in Settlement Form
  const addDeductionRow = () => {
    setSettlementForm((prev) => ({
      ...prev,
      documentedDeductions: [
        ...prev.documentedDeductions,
        {
          type: 'OTHER',
          amount: 0,
          description: '',
        },
      ],
    }));
  };

  const removeDeductionRow = (index: number) => {
    setSettlementForm((prev) => ({
      ...prev,
      documentedDeductions: prev.documentedDeductions.filter((_, idx) => idx !== index),
    }));
  };

  const updateDeductionRow = (index: number, field: keyof CourierDeductionItem, value: any) => {
    setSettlementForm((prev) => {
      const next = [...prev.documentedDeductions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, documentedDeductions: next };
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!ledgerData?.orders.length) {
      showToast('No transaction data to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'District',
      'Courier',
      'Waybill',
      'Expected COD (LKR)',
      'Courier Reported (LKR)',
      'Total Deductions (LKR)',
      'Expected Remittance (LKR)',
      'Actual Bank Received (LKR)',
      'Discrepancy (LKR)',
      'Discrepancy Reason',
      'Batch Reference',
      'Bank Reference',
      'Financial Status',
      'Authorized By',
    ];

    const rows = ledgerData.orders.map((o) => {
      const expected = o.amountToCollect ?? o.totalAmount ?? 0;
      const reported = o.settlementRecord?.courierReportedAmount ?? o.courierReportedAmount ?? expected;
      const deductions = o.settlementRecord?.totalDeductions ?? 0;
      const expectedRemittance = o.settlementRecord?.expectedRemittance ?? Math.max(0, reported - deductions);
      const actualReceived = o.settlementRecord?.actualAmountReceived ?? (o.courierDetails?.amountRemitted || 0);
      const discrepancy = o.settlementRecord?.discrepancyAmount ?? 0;

      return [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        `"${o.customerName}"`,
        `"${o.shippingAddress?.district || ''}"`,
        `"${o.courierDetails?.courierProvider || o.carrier || 'Koombiyo Delivery'}"`,
        `"${o.courierDetails?.waybillNumber || o.trackingNumber || ''}"`,
        expected,
        reported,
        deductions,
        expectedRemittance,
        actualReceived,
        discrepancy,
        `"${o.settlementRecord?.discrepancyReason || ''}"`,
        `"${o.settlementRecord?.settlementBatchRef || ''}"`,
        `"${o.settlementRecord?.bankReference || o.courierDetails?.bankReference || ''}"`,
        o.codFinancialStatus || 'COLLECTION_PENDING',
        `"${o.settlementRecord?.authorizedBy || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rexbebe_cod_settlement_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Authoritative Settlement Ledger exported to CSV! 📊');
  };

  const handleExportPeriodicCSV = () => {
    const list = analyticsData?.periodicBreakdown?.[periodicView] || [];
    if (!list.length) {
      showToast('No periodic data available to export.');
      return;
    }
    const headers = [
      'Period',
      'Order Count',
      'Total Amount (LKR)',
      'Collected Amount (LKR)',
      'Settled Bank Amount (LKR)',
      'Courier Delivery Fees (LKR)',
      'Return Fees (LKR)',
      'Delivered Orders',
      'Failed Attempts',
      'Returned Parcels',
    ];
    const rows = list.map((item: any) => [
      `"${item.label || item.periodKey}"`,
      item.orderCount,
      item.totalAmount,
      item.collectedAmount,
      item.settledAmount,
      item.deliveryFees,
      item.returnFees,
      item.deliveredCount,
      item.failedCount,
      item.returnedCount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `rexbebe_cod_${periodicView}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Periodic ${periodicView.toUpperCase()} report exported to CSV! 📊`);
  };

  const handleExportZonesCSV = () => {
    const list = analyticsData?.deliveryZoneBreakdown || [];
    if (!list.length) {
      showToast('No delivery zone data available to export.');
      return;
    }
    const headers = [
      'Zone ID',
      'Zone Name',
      'Order Count',
      'Total Revenue (LKR)',
      'Shipping Fees Collected (LKR)',
      'Courier Expenses (LKR)',
      'Delivered Count',
      'Failed Attempts',
      'Returned Parcels',
      'Success Rate (%)',
    ];
    const rows = list.map((z: any) => [
      `"${z.zoneId}"`,
      `"${z.zoneName}"`,
      z.orderCount,
      z.totalAmount,
      z.shippingFeesCollected,
      z.courierExpenses,
      z.deliveredCount,
      z.failedCount,
      z.returnedCount,
      `${z.successRatePercent}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `rexbebe_cod_delivery_zones_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Delivery Zones performance report exported to CSV! 📊');
  };

  const handleExportFulfillmentCSV = () => {
    const perf = analyticsData?.fulfillmentPerformance;
    if (!perf) {
      showToast('No fulfillment data available to export.');
      return;
    }
    const headers = ['Category / Reason', 'Count', 'Notes'];
    const rows = [
      ['Total Delivered Orders', perf.totalDelivered, 'Delivered to customer doorstep'],
      ['Total Failed Delivery Attempts', perf.totalFailedAttempts, 'All recorded failed attempts across orders'],
      ['Total Returned Parcels', perf.totalReturned, 'Parcels returned to sender'],
      ['Overall Delivery Success Rate', `${perf.successRatePercent}%`, 'Successful deliveries / Total COD orders'],
    ];
    if (perf.failureReasonsBreakdown) {
      Object.entries(perf.failureReasonsBreakdown).forEach(([key, val]: any) => {
        rows.push([`"Failure: ${val.label}"`, val.count, `Reason Code: ${key}`]);
      });
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `rexbebe_cod_fulfillment_performance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Delivery Fulfillment & Failure Analysis exported to CSV! 📊');
  };

  const handleExportCourierExpensesCSV = () => {
    const rec = analyticsData?.financialReconciliation;
    if (!rec) {
      showToast('No financial reconciliation data available to export.');
      return;
    }
    const headers = ['Financial Category', 'Amount (LKR)', 'Count / Notes'];
    const rows = [
      ['Awaiting Customer Door Collection', rec.awaitingCollectionAmount, `${rec.awaitingCollectionCount} orders with customer`],
      ['Cash in Courier Custody', rec.collectedByCourierAmount, `${rec.collectedByCourierCount} orders collected`],
      ['Pending Bank Remittance (Settlement Pending)', rec.pendingSettlementAmount, `${rec.pendingSettlementCount} orders delivered awaiting deposit`],
      ['Settled in Bank Account', rec.completedSettlementAmount, `${rec.completedSettlementCount} verified deposits`],
      ['Total Courier Delivery Expenses', rec.courierDeliveryExpenses, 'Standard delivery charges incurred'],
      ['Total Return-to-Sender (RTS) Costs', rec.returnToSenderCosts, 'Contracted return handling charges (LKR 300/return)'],
      ['Net Outstanding Balance Courier Owes REXBEBE', rec.outstandingCourierBalance, 'Total cash in courier hands awaiting final remittance'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `rexbebe_courier_expenses_balances_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Courier Expenses & Balances report exported to CSV! 📊');
  };

  const handleExportCurrentTabCSV = () => {
    switch (activeTab) {
      case 'LEDGER':
        return handleExportCSV();
      case 'PERIODIC':
        return handleExportPeriodicCSV();
      case 'ZONES':
        return handleExportZonesCSV();
      case 'FULFILLMENT':
        return handleExportFulfillmentCSV();
      case 'COURIER_EXPENSES':
        return handleExportCourierExpensesCSV();
      default:
        return handleExportCSV();
    }
  };

  const summary = ledgerData?.summary;

  // Computed total deductions in current settlement form
  const formTotalDeductions = useMemo(() => {
    return settlementForm.documentedDeductions.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );
  }, [settlementForm.documentedDeductions]);

  const formExpectedRemittance = useMemo(() => {
    return Math.max(0, Number(settlementForm.courierReportedAmount) - formTotalDeductions);
  }, [settlementForm.courierReportedAmount, formTotalDeductions]);

  const formDiscrepancy = useMemo(() => {
    return formExpectedRemittance - Number(settlementForm.actualAmountReceived);
  }, [formExpectedRemittance, settlementForm.actualAmountReceived]);

  const getStatusBadge = (status?: CodFinancialStatus) => {
    switch (status) {
      case 'COLLECTION_PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
            Collection Pending
          </span>
        );
      case 'COLLECTED_BY_COURIER':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
            Collected by Courier
          </span>
        );
      case 'SETTLEMENT_PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Settlement Pending
          </span>
        );
      case 'PARTIALLY_SETTLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            Partially Settled
          </span>
        );
      case 'SETTLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Settled in Bank
          </span>
        );
      case 'COLLECTION_DISPUTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Collection Disputed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-600">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="COD Collection & Courier Settlement Management"
          subtitle="Reconcile customer doorstep collections against verified Koombiyo bank remittances with documented deductions."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="font-heading font-black text-stone-900 text-lg">COD & Courier Settlement Ledger</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-700 border border-stone-300">
                  Strict Financial Segregation
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Customer doorstep collections are kept strictly separate from Koombiyo bank remittance settlements.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAgreementModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5 transition-colors"
                title="Configure Courier Agreement & Deductions"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Merchant Agreement</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-stone-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={fetchLedger}
                className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
                title="Refresh Ledger Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Policy Banner: No Auto Receipt */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">
                Authoritative Bank Confirmation Required
              </p>
              <p className="text-stone-600 mt-0.5">
                REXBEBE policy prohibits automatically marking funds as received upon order delivery or report generation.
                A delivered order enters <span className="font-bold text-amber-800">Settlement Pending</span> until an authorized administrator verifies the deposit with a bank reference and settlement batch.
              </p>
            </div>
          </div>

          {/* 6 Metric KPI Cards for the 6 Financial Statuses */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Total Expected COD */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Total Expected COD
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-stone-900">
                  LKR {(summary?.totalExpectedCod || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-bold block">
                {summary?.totalCodOrders || 0} Total Orders
              </span>
            </div>

            {/* 2. Collection Pending */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Collection Pending
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-stone-700">
                  LKR {(summary?.collectionPendingAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-bold block">
                {summary?.collectionPendingCount || 0} with customer
              </span>
            </div>

            {/* 3. In Courier Custody */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                In Courier Custody
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-sky-800">
                  LKR {(summary?.inCourierCustodyAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-sky-600 font-bold block">
                {summary?.inCourierCustodyCount || 0} door cash collected
              </span>
            </div>

            {/* 4. Settled in Bank */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Settled in Bank
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-800">
                  LKR {(summary?.settledAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {summary?.settledCount || 0} verified deposits
              </span>
            </div>

            {/* 5. Partially Settled */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
                Partially Settled
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-orange-800">
                  LKR {(summary?.partiallySettledAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-orange-600 font-bold block">
                {summary?.partiallySettledCount || 0} shortfall / review
              </span>
            </div>

            {/* 6. Collection Disputed */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Disputed
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-rose-800">
                  LKR {(summary?.disputedAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-rose-600 font-bold block">
                {summary?.disputedCount || 0} refused / short
              </span>
            </div>
          </div>

          {/* Deductions & Discrepancy Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Documented Courier Deductions
                </span>
                <span className="text-xl font-black text-stone-900 mt-0.5 block">
                  LKR {(summary?.totalDocumentedDeductions || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-stone-500">
                  Itemized shipping fees, return handling, and agreed deductions.
                </span>
              </div>
              <Truck className="w-8 h-8 text-stone-300" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Outstanding Settlement Shortfall
                </span>
                <span className={`text-xl font-black mt-0.5 block ${(summary?.totalDiscrepancyAmount || 0) > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                  LKR {(summary?.totalDiscrepancyAmount || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-stone-500">
                  Requires documented adjustment justification before final sign-off.
                </span>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-300" />
            </div>
          </div>

          {/* MULTI-DIMENSIONAL REPORT NAVIGATION TABS */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-3xl border border-stone-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'LEDGER'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Settlement Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('PERIODIC')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'PERIODIC'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Daily, Weekly &amp; Monthly Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('ZONES')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'ZONES'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Orders by Delivery Zone</span>
            </button>

            <button
              onClick={() => setActiveTab('FULFILLMENT')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'FULFILLMENT'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Success &amp; Failure Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('COURIER_EXPENSES')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'COURIER_EXPENSES'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Balances &amp; Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Notification Gateways &amp; Logs</span>
            </button>
          </div>

          {/* Date & Financial Status Filters */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search order #, customer, batch ref, bank ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500 font-bold">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-stone-800 font-bold focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center space-x-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500 font-bold">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-stone-800 font-bold focus:outline-none text-xs"
                />
              </div>

              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
              >
                <option value="">All Couriers</option>
                <option value="Koombiyo">Koombiyo Delivery</option>
                <option value="PromptX">PromptX</option>
                <option value="Domex">Domex</option>
                <option value="Pronto">Pronto</option>
              </select>

              <select
                value={financialStatusFilter}
                onChange={(e) => setFinancialStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
              >
                <option value="ALL">All Financial Statuses (6)</option>
                <option value="COLLECTION_PENDING">Collection Pending</option>
                <option value="COLLECTED_BY_COURIER">Collected by Courier</option>
                <option value="SETTLEMENT_PENDING">Settlement Pending</option>
                <option value="PARTIALLY_SETTLED">Partially Settled</option>
                <option value="SETTLED">Settled</option>
                <option value="COLLECTION_DISPUTED">Collection Disputed</option>
              </select>

              {(startDate || endDate || courierFilter || financialStatusFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCourierFilter('');
                    setFinancialStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline px-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: SETTLEMENT LEDGER TABLE */}
          {activeTab === 'LEDGER' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Order / Date</th>
                    <th className="p-3.5">Customer & Town</th>
                    <th className="p-3.5">Courier & Tracking</th>
                    <th className="p-3.5 text-right">Expected COD</th>
                    <th className="p-3.5 text-right">Reported Coll.</th>
                    <th className="p-3.5 text-right">Deductions</th>
                    <th className="p-3.5 text-right">Net Remittance</th>
                    <th className="p-3.5 text-right">Bank Received</th>
                    <th className="p-3.5 text-right">Discrepancy</th>
                    <th className="p-3.5">Batch / Bank Ref</th>
                    <th className="p-3.5">Financial Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ledgerData && ledgerData.orders.length > 0 ? (
                    ledgerData.orders.map((order) => {
                      const expected = order.amountToCollect ?? order.totalAmount ?? 0;
                      const reported = order.settlementRecord?.courierReportedAmount ?? order.courierReportedAmount ?? expected;
                      const deductions = order.settlementRecord?.totalDeductions ?? 0;
                      const expectedRemittance = order.settlementRecord?.expectedRemittance ?? Math.max(0, reported - deductions);
                      const actualReceived = order.settlementRecord?.actualAmountReceived ?? (order.courierDetails?.amountRemitted || 0);
                      const discrepancy = order.settlementRecord?.discrepancyAmount ?? 0;
                      const courierName = order.courierDetails?.courierProvider || order.carrier || 'Koombiyo Delivery';
                      const waybill = order.courierDetails?.waybillNumber || order.trackingNumber;

                      return (
                        <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* Order / Date */}
                          <td className="p-3.5 font-mono font-bold text-stone-900">
                            {order.orderNumber}
                            <span className="block text-[10px] font-sans font-normal text-stone-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          {/* Customer & Town */}
                          <td className="p-3.5">
                            <p className="font-bold text-stone-900">{order.customerName}</p>
                            <p className="text-[10px] text-stone-500">
                              {order.shippingAddress?.town || order.shippingAddress?.city || 'Gampaha'}
                              {order.shippingAddress?.district ? ` (${order.shippingAddress.district})` : ''}
                            </p>
                          </td>

                          {/* Courier & Tracking */}
                          <td className="p-3.5">
                            <span className="font-bold text-stone-800">{courierName}</span>
                            {waybill && (
                              <span className="block font-mono text-[10px] text-stone-500">{waybill}</span>
                            )}
                          </td>

                          {/* Expected COD */}
                          <td className="p-3.5 text-right font-black text-stone-900">
                            {formatCurrency(expected)}
                          </td>

                          {/* Courier Reported Collection */}
                          <td className="p-3.5 text-right">
                            {order.codCollectionStatus === 'COLLECTED_BY_COURIER' || order.status === 'DELIVERED' || order.settlementRecord ? (
                              <span className="font-bold text-sky-800">
                                {formatCurrency(reported)}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>

                          {/* Documented Deductions */}
                          <td className="p-3.5 text-right">
                            {deductions > 0 ? (
                              <span
                                className="font-bold text-stone-700 underline decoration-dotted cursor-help"
                                title={order.settlementRecord?.documentedDeductions?.map(d => `${d.description}: LKR ${d.amount}`).join('\n')}
                              >
                                -{formatCurrency(deductions)}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>

                          {/* Expected Remittance */}
                          <td className="p-3.5 text-right font-bold text-stone-900">
                            {order.codCollectionStatus === 'COLLECTED_BY_COURIER' || order.status === 'DELIVERED' || order.settlementRecord ? (
                              formatCurrency(expectedRemittance)
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>

                          {/* Actual Bank Received */}
                          <td className="p-3.5 text-right font-black text-emerald-700">
                            {actualReceived > 0 ? formatCurrency(actualReceived) : '-'}
                          </td>

                          {/* Discrepancy */}
                          <td className="p-3.5 text-right">
                            {order.settlementRecord ? (
                              <span
                                className={`font-black ${discrepancy > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                                title={order.settlementRecord.discrepancyReason || 'Balanced'}
                              >
                                {discrepancy === 0 ? '0.00' : formatCurrency(discrepancy)}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>

                          {/* Batch / Bank Ref */}
                          <td className="p-3.5 font-mono text-[10px]">
                            {order.settlementRecord?.settlementBatchRef ? (
                              <>
                                <span className="font-bold text-stone-800 block">
                                  {order.settlementRecord.settlementBatchRef}
                                </span>
                                <span className="text-stone-500 block">
                                  {order.settlementRecord.bankReference}
                                </span>
                              </>
                            ) : order.courierDetails?.bankReference ? (
                              <span className="text-stone-600">{order.courierDetails.bankReference}</span>
                            ) : (
                              <span className="text-stone-400">Unsettled</span>
                            )}
                          </td>

                          {/* Financial Status Badge */}
                          <td className="p-3.5">
                            {getStatusBadge(order.codFinancialStatus)}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* If not collected, allow recording collection */}
                              {order.codFinancialStatus === 'COLLECTION_PENDING' && (
                                <button
                                  onClick={() => openCollectionModal(order)}
                                  className="px-2.5 py-1 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-[10px] shadow-2xs whitespace-nowrap"
                                >
                                  Record Collection
                                </button>
                              )}

                              {/* Settle Remittance Button */}
                              <button
                                onClick={() => openSettlementModal(order)}
                                className={`px-2.5 py-1 rounded-xl font-bold text-[10px] shadow-2xs whitespace-nowrap ${
                                  order.codFinancialStatus === 'SETTLED'
                                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                                    : 'bg-amber-700 hover:bg-amber-800 text-white'
                                }`}
                              >
                                {order.codFinancialStatus === 'SETTLED' ? 'View/Update Batch' : 'Settle Remittance'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-12 text-center text-stone-400 font-bold">
                        {isLoading ? 'Loading COD financial ledger...' : 'No COD transactions found for the selected filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* TAB 2: PERIODIC ORDERS (DAILY, WEEKLY, MONTHLY) */}
          {activeTab === 'PERIODIC' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Periodic COD Orders &amp; Financial Trajectory
                  </h3>
                  <p className="text-xs text-stone-500">
                    Aggregated volume, customer collections, and bank remittances grouped by time interval.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPeriodicView('daily')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        periodicView === 'daily' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Daily (30D)
                    </button>
                    <button
                      onClick={() => setPeriodicView('weekly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        periodicView === 'weekly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Weekly (16W)
                    </button>
                    <button
                      onClick={() => setPeriodicView('monthly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        periodicView === 'monthly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Monthly (12M)
                    </button>
                  </div>

                  <button
                    onClick={handleExportPeriodicCSV}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4 text-stone-500" />
                    <span>Export Periodic CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Time Interval</th>
                        <th className="p-3.5 text-center">Orders</th>
                        <th className="p-3.5 text-right">Total Payable</th>
                        <th className="p-3.5 text-right">Doorstep Cash Collected</th>
                        <th className="p-3.5 text-right">Bank Settled</th>
                        <th className="p-3.5 text-right">Delivery Fees</th>
                        <th className="p-3.5 text-right">Return Fees</th>
                        <th className="p-3.5 text-center">Delivered</th>
                        <th className="p-3.5 text-center">Failed Attempts</th>
                        <th className="p-3.5 text-center">Returned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {analyticsData?.periodicBreakdown?.[periodicView]?.length > 0 ? (
                        analyticsData.periodicBreakdown[periodicView].map((row: any, idx: number) => (
                          <tr key={`${row.periodKey}-${idx}`} className="hover:bg-amber-50/30">
                            <td className="p-3.5 font-bold text-stone-900 font-mono">
                              {row.label || row.periodKey}
                            </td>
                            <td className="p-3.5 text-center font-black text-stone-800">
                              {row.orderCount}
                            </td>
                            <td className="p-3.5 text-right font-black text-stone-900">
                              {formatCurrency(row.totalAmount)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-sky-800">
                              {formatCurrency(row.collectedAmount)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-800">
                              {formatCurrency(row.settledAmount)}
                            </td>
                            <td className="p-3.5 text-right font-mono text-stone-600">
                              {formatCurrency(row.deliveryFees)}
                            </td>
                            <td className="p-3.5 text-right font-mono text-rose-600">
                              {row.returnFees > 0 ? formatCurrency(row.returnFees) : '-'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {row.deliveredCount}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              {row.failedCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  {row.failedCount}
                                </span>
                              ) : (
                                <span className="text-stone-300">0</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {row.returnedCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  {row.returnedCount}
                                </span>
                              ) : (
                                <span className="text-stone-300">0</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-stone-400 font-bold">
                            No periodic order records found for the selected view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS BY DELIVERY ZONE */}
          {activeTab === 'ZONES' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Orders by Configured Delivery Zone
                  </h3>
                  <p className="text-xs text-stone-500">
                    Geographic distribution across Gampaha Nearby, Gampaha Other, Outstation, and Unmapped addresses with delivery fees and fulfillment success.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/settings/delivery"
                    className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Settings className="w-4 h-4 text-stone-500" />
                    <span>Delivery Zones Settings</span>
                  </Link>
                  <button
                    onClick={handleExportZonesCSV}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Zones CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Zone Name</th>
                        <th className="p-3.5">Zone ID</th>
                        <th className="p-3.5 text-center">Orders</th>
                        <th className="p-3.5 text-right">Total Order Revenue</th>
                        <th className="p-3.5 text-right">Customer Delivery Fees</th>
                        <th className="p-3.5 text-right">Courier Incurred Cost</th>
                        <th className="p-3.5 text-center">Delivered</th>
                        <th className="p-3.5 text-center">Failed Attempts</th>
                        <th className="p-3.5 text-center">Returned</th>
                        <th className="p-3.5 text-right">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {analyticsData?.deliveryZoneBreakdown?.length > 0 ? (
                        analyticsData.deliveryZoneBreakdown.map((z: any) => (
                          <tr key={z.zoneId} className="hover:bg-amber-50/30">
                            <td className="p-3.5 font-black text-stone-900">
                              {z.zoneName}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-stone-500">
                              {z.zoneId}
                            </td>
                            <td className="p-3.5 text-center font-black text-stone-800">
                              {z.orderCount}
                            </td>
                            <td className="p-3.5 text-right font-black text-stone-900">
                              {formatCurrency(z.totalAmount)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-800">
                              {formatCurrency(z.shippingFeesCollected)}
                            </td>
                            <td className="p-3.5 text-right font-mono text-stone-700">
                              {formatCurrency(z.courierExpenses)}
                            </td>
                            <td className="p-3.5 text-center font-bold text-emerald-700">
                              {z.deliveredCount}
                            </td>
                            <td className="p-3.5 text-center font-bold text-rose-700">
                              {z.failedCount}
                            </td>
                            <td className="p-3.5 text-center font-bold text-purple-700">
                              {z.returnedCount}
                            </td>
                            <td className="p-3.5 text-right font-black">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] ${
                                z.successRatePercent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {z.successRatePercent}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-stone-400 font-bold">
                            No delivery zone records found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FULFILLMENT SUCCESS & FAILURE ANALYSIS */}
          {activeTab === 'FULFILLMENT' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Delivery Fulfillment: Success &amp; Failure Analysis
                  </h3>
                  <p className="text-xs text-stone-500">
                    Comprehensive audit of doorstep deliveries, failed delivery attempts, returned parcels, and standardized failure causes.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/returns"
                    className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>Open Returns Center</span>
                  </Link>
                  <button
                    onClick={handleExportFulfillmentCSV}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Fulfillment CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Highlight Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Delivered</span>
                  <p className="text-2xl font-black text-emerald-900">{analyticsData?.fulfillmentPerformance?.totalDelivered || 0}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold block">✓ Verified doorstep deliveries</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">Failed Attempts Recorded</span>
                  <p className="text-2xl font-black text-rose-900">{analyticsData?.fulfillmentPerformance?.totalFailedAttempts || 0}</p>
                  <span className="text-[10px] text-rose-600 font-semibold block">Logged by courier riders</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-800 block">Returned to Sender (RTS)</span>
                  <p className="text-2xl font-black text-purple-900">{analyticsData?.fulfillmentPerformance?.totalReturned || 0}</p>
                  <span className="text-[10px] text-purple-600 font-semibold block">Returned to warehouse</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">Overall Success Rate</span>
                  <p className="text-2xl font-black text-blue-900">{analyticsData?.fulfillmentPerformance?.successRatePercent || 0}%</p>
                  <span className="text-[10px] text-blue-600 font-semibold block">Completion ratio</span>
                </div>
              </div>

              {/* Failure Reasons Breakdown Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                  <h4 className="font-heading font-black text-stone-900 text-sm">
                    Standardized Delivery Failure Reasons Catalog
                  </h4>
                  <span className="text-xs text-stone-500 font-medium">Authoritative Classification</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Reason Code</th>
                        <th className="p-3.5">Human Readable Label</th>
                        <th className="p-3.5 text-center">Documented Incidents</th>
                        <th className="p-3.5">Retry Allowed?</th>
                        <th className="p-3.5">Required Operational Workflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {analyticsData?.fulfillmentPerformance?.failureReasonsBreakdown ? (
                        Object.entries(analyticsData.fulfillmentPerformance.failureReasonsBreakdown).map(([code, item]: any) => (
                          <tr key={code} className="hover:bg-amber-50/30">
                            <td className="p-3.5 font-mono font-bold text-stone-900">
                              {code}
                            </td>
                            <td className="p-3.5 font-black text-stone-800">
                              {item.label}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                                item.count > 0 ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {item.count}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {code === 'CUSTOMER_REFUSED' ? (
                                <span className="text-rose-600 font-bold">No — Direct Return-to-Sender</span>
                              ) : (
                                <span className="text-emerald-700 font-bold">Yes — Retry Supported</span>
                              )}
                            </td>
                            <td className="p-3.5 text-stone-600 text-[11px]">
                              {code === 'CUSTOMER_REFUSED' && 'Initiate immediate Return-to-Sender. Verified LKR 300 charge applies.'}
                              {code === 'CUSTOMER_UNAVAILABLE' && 'Contact customer via phone/WhatsApp and schedule next delivery date.'}
                              {code === 'INCORRECT_ADDRESS' && 'Concierge phone call to obtain corrected landmark/address before retry.'}
                              {code === 'PHONE_UNREACHABLE' && 'Send SMS tracking update and retry next working day.'}
                              {code === 'COURIER_ISSUE' && 'Liaise with Koombiyo dispatch hub for priority redelivery.'}
                              {code === 'OTHER' && 'Mandatory >= 5 character documented notes required in audit log.'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-stone-400 font-bold">
                            Loading failure reasons data...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COURIER FINANCIAL BALANCES & EXPENSES */}
          {activeTab === 'COURIER_EXPENSES' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Courier Financial Reconciliation &amp; Net Balances
                  </h3>
                  <p className="text-xs text-stone-500">
                    Calculates total cash collected by courier, standard delivery expenses, verified return charges, and outstanding remittance liability.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAgreementModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Settings className="w-4 h-4 text-stone-500" />
                    <span>Agreement Settings</span>
                  </button>
                  <button
                    onClick={handleExportCourierExpensesCSV}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Balances CSV</span>
                  </button>
                </div>
              </div>

              {/* Outstanding Net Liability Card */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-3xl text-white shadow-lg space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-100 block">
                  Authoritative Net Courier Balance Owed to REXBEBE
                </span>
                <p className="text-3xl sm:text-4xl font-black">
                  {formatCurrency(analyticsData?.financialReconciliation?.outstandingCourierBalance || 0)}
                </p>
                <p className="text-xs text-amber-100 font-medium">
                  Total cash collected by courier across {analyticsData?.financialReconciliation?.collectedByCourierCount + analyticsData?.financialReconciliation?.pendingSettlementCount || 0} delivered orders awaiting verified bank remittance.
                </p>
              </div>

              {/* Itemized Reconciliation Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Financial Category</th>
                        <th className="p-3.5 text-right">Amount (LKR)</th>
                        <th className="p-3.5 text-center">Orders Involved</th>
                        <th className="p-3.5">Policy &amp; Merchant Agreement Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-stone-900">
                          1. Awaiting Customer Doorstep Collection
                        </td>
                        <td className="p-3.5 text-right font-black text-stone-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.awaitingCollectionAmount || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-stone-600">
                          {analyticsData?.financialReconciliation?.awaitingCollectionCount || 0}
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Parcels in preparation or out for delivery. Money has not yet entered courier hands.
                        </td>
                      </tr>

                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-sky-900">
                          2. Cash in Courier Custody (Collected by Courier)
                        </td>
                        <td className="p-3.5 text-right font-black text-sky-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.collectedByCourierAmount || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-sky-700">
                          {analyticsData?.financialReconciliation?.collectedByCourierCount || 0}
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Doorstep cash successfully collected by riders. Courier is legally holding funds.
                        </td>
                      </tr>

                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-amber-900">
                          3. Settlement Pending (Delivered Awaiting Bank Remittance)
                        </td>
                        <td className="p-3.5 text-right font-black text-amber-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.pendingSettlementAmount || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-amber-700">
                          {analyticsData?.financialReconciliation?.pendingSettlementCount || 0}
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Delivered orders awaiting bank statement matching and authorized batch verification.
                        </td>
                      </tr>

                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-emerald-900">
                          4. Completed Settlements (Deposited in Bank)
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.completedSettlementAmount || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-700">
                          {analyticsData?.financialReconciliation?.completedSettlementCount || 0}
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Verified bank deposit confirmed with bank reference and settlement batch number.
                        </td>
                      </tr>

                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-stone-800">
                          5. Total Courier Delivery Expenses
                        </td>
                        <td className="p-3.5 text-right font-bold text-stone-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.courierDeliveryExpenses || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-stone-600">
                          All COD Orders
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Standard parcel delivery charges incurred as per configured delivery zone rates.
                        </td>
                      </tr>

                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3.5 font-black text-rose-900">
                          6. Total Return-to-Sender (RTS) Costs
                        </td>
                        <td className="p-3.5 text-right font-bold text-rose-800">
                          {formatCurrency(analyticsData?.financialReconciliation?.returnToSenderCosts || 0)}
                        </td>
                        <td className="p-3.5 text-center font-bold text-rose-700">
                          Returned Parcels
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px]">
                          Verified return handling charges (LKR 300 per returned parcel).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATION GATEWAYS & DISPATCH LOGS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Notification Gateway Status &amp; Dispatch Audit
                  </h3>
                  <p className="text-xs text-stone-500">
                    Integrates customer notifications for order confirmation, dispatch, tracking, failed delivery, and completion.
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  Strict Audit: Deliveries claimed ONLY upon verified gateway confirmation
                </div>
              </div>

              {/* 3 Gateway Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Email Gateway */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900 flex items-center space-x-1.5">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <span>Email Gateway</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      notificationConfig?.email?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {notificationConfig?.email?.configured ? 'Active' : 'Unconfigured'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Provider: <span className="font-bold text-stone-900">{notificationConfig?.email?.provider || 'SMTP Relay'}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {notificationConfig?.email?.details || 'Live email notifications active via configured mail server.'}
                  </p>
                </div>

                {/* SMS Gateway */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900 flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>SMS Gateway</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      notificationConfig?.sms?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {notificationConfig?.sms?.configured ? 'Active' : 'Unconfigured'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Provider: <span className="font-bold text-stone-900">{notificationConfig?.sms?.provider || 'Not Configured'}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {notificationConfig?.sms?.details || 'No carrier API key in environment. Tracked as NOT_CONFIGURED.'}
                  </p>
                </div>

                {/* WhatsApp Gateway */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900 flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Business</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      notificationConfig?.whatsapp?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {notificationConfig?.whatsapp?.configured ? 'Active' : 'Unconfigured'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Provider: <span className="font-bold text-stone-900">{notificationConfig?.whatsapp?.provider || 'Not Configured'}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {notificationConfig?.whatsapp?.details || 'No WhatsApp Cloud API token. Tracked as NOT_CONFIGURED.'}
                  </p>
                </div>
              </div>

              {/* Recent Notifications Log Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                  <h4 className="font-heading font-black text-stone-900 text-sm">
                    Recent Customer Notification Dispatches
                  </h4>
                  <span className="text-xs text-stone-500 font-medium">Logged in Audit Trail</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Order Number</th>
                        <th className="p-3.5">Event Type</th>
                        <th className="p-3.5">Channel</th>
                        <th className="p-3.5">Recipient</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Gateway Provider</th>
                        <th className="p-3.5">Verification Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {recentNotifications && recentNotifications.length > 0 ? (
                        recentNotifications.map((notif: any) => (
                          <tr key={notif.id} className="hover:bg-amber-50/30">
                            <td className="p-3.5 font-mono text-[11px] text-stone-500">
                              {new Date(notif.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3.5 font-black text-stone-900">
                              {notif.orderNumber}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[10px]">
                                {notif.eventType}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-stone-800">
                              {notif.channel}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-stone-600">
                              {notif.recipient}
                            </td>
                            <td className="p-3.5">
                              {notif.status === 'DELIVERED' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                  ✓ DELIVERED
                                </span>
                              ) : notif.status === 'NOT_CONFIGURED' ? (
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px]">
                                  NOT CONFIGURED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                                  FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-stone-600">
                              {notif.provider}
                            </td>
                            <td className="p-3.5 text-stone-500 text-[11px]">
                              {notif.confirmedSuccess ? 'Confirmed delivered by carrier server' : (notif.failureReason || 'Gateway unconfigured in environment')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-stone-400 font-bold">
                            No notifications recorded in log. Notifications are logged upon order confirmation, dispatch, failed delivery, and completion.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: AUTHORIZED COURIER SETTLEMENT & BANK RECONCILIATION */}
      {isSettlementModalOpen && selectedOrderForSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Authorized Remittance & Bank Settlement
                  </h3>
                  <p className="text-xs text-stone-500">
                    Order #{selectedOrderForSettlement.orderNumber} • Customer: {selectedOrderForSettlement.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Context */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 grid grid-cols-2 gap-3 text-stone-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Courier Provider</span>
                  <span className="font-bold text-stone-900">
                    {selectedOrderForSettlement.courierDetails?.courierProvider || 'Koombiyo Delivery'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Waybill Number</span>
                  <span className="font-mono font-bold text-stone-900">
                    {selectedOrderForSettlement.courierDetails?.waybillNumber || selectedOrderForSettlement.trackingNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Expected COD Value</span>
                  <span className="font-black text-stone-900">
                    LKR {(selectedOrderForSettlement.amountToCollect ?? selectedOrderForSettlement.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Financial Status</span>
                  <span>{getStatusBadge(selectedOrderForSettlement.codFinancialStatus)}</span>
                </div>
              </div>

              {/* Settlement Batch & Bank Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Settlement Batch / Ref # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KMB-SETTL-2026-W42"
                    value={settlementForm.settlementBatchRef}
                    onChange={(e) => setSettlementForm({ ...settlementForm, settlementBatchRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Bank Deposit Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BOC-TX-9842145"
                    value={settlementForm.bankReference}
                    onChange={(e) => setSettlementForm({ ...settlementForm, bankReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Courier-Reported Collected Amount (LKR)
                  </label>
                  <input
                    type="number"
                    value={settlementForm.courierReportedAmount}
                    onChange={(e) => setSettlementForm({ ...settlementForm, courierReportedAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Deposit Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={settlementForm.settlementDate}
                    onChange={(e) => setSettlementForm({ ...settlementForm, settlementDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Documented Courier Deductions Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800">
                    Documented Courier Deductions Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={addDeductionRow}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deduction Line</span>
                  </button>
                </div>

                {settlementForm.documentedDeductions.length > 0 ? (
                  <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50/50">
                    {settlementForm.documentedDeductions.map((ded, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <select
                          value={ded.type}
                          onChange={(e) => updateDeductionRow(idx, 'type', e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-[11px] font-bold text-stone-800 w-36"
                        >
                          <option value="DELIVERY_FEE">Delivery Fee</option>
                          <option value="RETURN_FEE">Return Fee</option>
                          <option value="COD_HANDLING">COD Handling</option>
                          <option value="WEIGHT_SURCHARGE">Weight Surcharge</option>
                          <option value="TAX_VAT">Tax / VAT</option>
                          <option value="OTHER">Other</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Description (e.g. Standard zone fee)"
                          value={ded.description}
                          onChange={(e) => updateDeductionRow(idx, 'description', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-[11px] text-stone-800 focus:outline-none"
                        />

                        <div className="flex items-center space-x-1 w-28">
                          <span className="text-stone-400 font-bold text-[10px]">LKR</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={ded.amount}
                            onChange={(e) => updateDeductionRow(idx, 'amount', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-[11px] font-bold text-right text-stone-900 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDeductionRow(idx)}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-[11px] text-stone-600">
                      <span>Total Documented Deductions:</span>
                      <span className="text-stone-900 font-black">LKR {formTotalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">No courier deductions applied for this order.</p>
                )}
              </div>

              {/* Net Remittance Calculation & Actual Received */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">Net Expected Remittance (Reported - Deductions):</span>
                  <span className="font-black text-stone-900 text-sm">
                    LKR {formExpectedRemittance.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <div>
                    <label className="font-bold text-stone-800 block">
                      Actual Amount Deposited to Bank (LKR) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-stone-500">Must match company bank statement</span>
                  </div>
                  <input
                    type="number"
                    value={settlementForm.actualAmountReceived}
                    onChange={(e) => setSettlementForm({ ...settlementForm, actualAmountReceived: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-36 px-3 py-1.5 rounded-xl border border-amber-300 bg-white font-black text-right text-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Discrepancy Notice */}
                <div className="pt-1 flex items-center justify-between text-xs font-bold">
                  <span className={formDiscrepancy > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {formDiscrepancy === 0 ? 'Balanced Remittance (Zero Shortfall)' : `Shortfall / Unsettled Discrepancy:`}
                  </span>
                  <span className={formDiscrepancy > 0 ? 'text-rose-700 font-black' : 'text-emerald-700 font-black'}>
                    {formDiscrepancy === 0 ? 'LKR 0.00' : `LKR ${formDiscrepancy.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Mandatory Discrepancy Reason if Shortfall */}
              {formDiscrepancy > 0 && (
                <div className="space-y-1 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl animate-in fade-in">
                  <label className="font-bold text-rose-900 block text-xs">
                    Discrepancy Adjustment Reason <span className="text-rose-600">* (Mandatory for shortfall)</span>
                  </label>
                  <p className="text-[10px] text-rose-700">
                    Explain the documented justification for the shortfall (e.g. courier penalty deduction, damaged parcel claim, or pending tranche).
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Courier deducted LKR 100 for return surcharge on previous parcel."
                    value={settlementForm.discrepancyReason}
                    onChange={(e) => setSettlementForm({ ...settlementForm, discrepancyReason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              )}

              {/* Authorized Administrator & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Authorized Administrator <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settlementForm.authorizedBy}
                    onChange={(e) => setSettlementForm({ ...settlementForm, authorizedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Settlement Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Verified on online banking portal"
                    value={settlementForm.notes}
                    onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Duplicate Prevention Notice */}
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-600 text-[10px] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-stone-500 shrink-0" />
                <span>
                  Anti-fraud guard: duplicate settlement entries for this order under another batch reference are strictly blocked by the database engine.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveSettlement}
                className="px-5 py-2 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Settlement...' : 'Confirm & Reconcile Funds'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD COURIER COLLECTION OR DISPUTE */}
      {isCollectionModalOpen && selectedOrderForCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-sky-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Record Courier Doorstep Collection
                  </h3>
                  <p className="text-xs text-stone-500">Order #{selectedOrderForCollection.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <p className="font-bold text-stone-900">
                  Customer: {selectedOrderForCollection.customerName}
                </p>
                <p className="text-stone-600">
                  Expected Collection: <strong>LKR {(selectedOrderForCollection.amountToCollect ?? selectedOrderForCollection.totalAmount).toLocaleString()}</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Collection Outcome Status</label>
                <select
                  value={collectionForm.status}
                  onChange={(e: any) => setCollectionForm({ ...collectionForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                >
                  <option value="COLLECTED_BY_COURIER">Collected by Courier (Customer paid cash on delivery)</option>
                  <option value="COLLECTION_DISPUTED">Collection Disputed (Refusal, shortage, or issue)</option>
                  <option value="COLLECTION_PENDING">Collection Pending (Not yet collected)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Reported Amount (LKR)</label>
                  <input
                    type="number"
                    value={collectionForm.courierReportedAmount}
                    onChange={(e) => setCollectionForm({ ...collectionForm, courierReportedAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Collection Date</label>
                  <input
                    type="date"
                    value={collectionForm.collectionDate}
                    onChange={(e) => setCollectionForm({ ...collectionForm, collectionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {collectionForm.status === 'COLLECTION_DISPUTED' && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">
                    Dispute Reason <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer claimed shortage or refused damaged package"
                    value={collectionForm.disputeReason}
                    onChange={(e) => setCollectionForm({ ...collectionForm, disputeReason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-stone-900 font-bold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Administrator Notes</label>
                <input
                  type="text"
                  placeholder="Rider doorstep dispatch note"
                  value={collectionForm.notes}
                  onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Important:</strong> Recording this updates courier collection custody. Funds remain pending settlement until bank remittance is confirmed.
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCollectionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveCollection}
                className="px-5 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Collection Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MERCHANT AGREEMENT & CONFIGURABLE DEDUCTIONS */}
      {isAgreementModalOpen && agreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 text-base">
                    Courier Merchant Agreement Settings
                  </h3>
                  <p className="text-xs text-stone-500">{agreement.courierName} ({agreement.courierCode})</p>
                </div>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Contract Agreement Ref</label>
                  <input
                    type="text"
                    value={agreement.agreementReference}
                    onChange={(e) => setAgreement({ ...agreement, agreementReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Standard Delivery Fee (LKR)</label>
                  <input
                    type="number"
                    value={agreement.standardDeliveryCharge}
                    onChange={(e) => setAgreement({ ...agreement, standardDeliveryCharge: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">COD Handling Commission (%)</label>
                  <input
                    type="number"
                    value={agreement.codCommissionRate}
                    onChange={(e) => setAgreement({ ...agreement, codCommissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400">0% according to REXBEBE store policy</span>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Return Parcel Fee (LKR)</label>
                  <input
                    type="number"
                    value={agreement.returnHandlingFee}
                    onChange={(e) => setAgreement({ ...agreement, returnHandlingFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Settlement Cycle Policy Notice</label>
                <textarea
                  rows={2}
                  value={agreement.settlementCycleNotice}
                  onChange={(e) => setAgreement({ ...agreement, settlementCycleNotice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none"
                />
                <span className="text-[10px] text-stone-500">
                  Factual schedule notice: dates and amounts are matched directly to actual statement slips.
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Agreement Notes</label>
                <input
                  type="text"
                  value={agreement.notes || ''}
                  onChange={(e) => setAgreement({ ...agreement, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingAgreement}
                onClick={handleSaveAgreement}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingAgreement ? 'Saving...' : 'Save Agreement Rates'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
