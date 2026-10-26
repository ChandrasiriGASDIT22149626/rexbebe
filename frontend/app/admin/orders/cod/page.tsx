'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Banknote,
  Package,
  Truck,
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
  Calendar,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Printer,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminSidebar } from '../../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../../components/layout/AdminHeader';
import { useAdminData } from '../../../../hooks/AdminContext';
import { formatCurrency } from '../../../../utils/formatCurrency';
import {
  OrderRecord,
  OrderStatus,
  CourierDeliveryStatus,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
  orderService,
} from '../../../../services/orderService';
import { SRI_LANKA_DISTRICTS } from '../../../../services/deliveryService';

// Supported COD Order Statuses
const STATUS_OPTIONS: { label: string; value: OrderStatus; color: string }[] = [
  { label: 'Pending Confirmation', value: 'PENDING_CONFIRMATION', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { label: 'Confirmed', value: 'CONFIRMED', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { label: 'Processing', value: 'PROCESSING', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { label: 'Packed', value: 'PACKED', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { label: 'Ready to Ship', value: 'READY_TO_SHIP', color: 'bg-sky-100 text-sky-900 border-sky-300' },
  { label: 'Shipped', value: 'SHIPPED', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  { label: 'Delivered', value: 'DELIVERED', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  { label: 'Cancelled', value: 'CANCELLED', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { label: 'Returned', value: 'RETURNED', color: 'bg-stone-200 text-stone-800 border-stone-400' },
];

// All 9 Required Delivery Statuses
const COURIER_DELIVERY_STATUS_OPTIONS: {
  label: string;
  value: CourierDeliveryStatus;
  color: string;
  badge: string;
  description: string;
}[] = [
  { label: 'Not Booked', value: 'NOT_BOOKED', color: 'bg-stone-100 text-stone-700 border-stone-300', badge: 'bg-stone-100 text-stone-700 border-stone-200', description: 'No courier booking recorded yet' },
  { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Packed & awaiting Koombiyo rider pickup' },
  { label: 'Picked Up', value: 'PICKED_UP', color: 'bg-blue-100 text-blue-900 border-blue-300', badge: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Collected by courier rider from warehouse' },
  { label: 'In Transit', value: 'IN_TRANSIT', color: 'bg-cyan-100 text-cyan-900 border-cyan-300', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', description: 'Travelling between courier distribution hubs' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY', color: 'bg-amber-100 text-amber-900 border-amber-300', badge: 'bg-amber-50 text-amber-800 border-amber-200', description: 'Rider on route to customer doorstep' },
  { label: 'Delivery Attempt Failed', value: 'DELIVERY_ATTEMPT_FAILED', color: 'bg-rose-100 text-rose-900 border-rose-300', badge: 'bg-rose-50 text-rose-700 border-rose-200', description: 'Attempt made but failed (requires reason)' },
  { label: 'Delivered', value: 'DELIVERED', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Delivered to customer & cash collected' },
  { label: 'Returning to Sender', value: 'RETURNING_TO_SENDER', color: 'bg-orange-100 text-orange-900 border-orange-300', badge: 'bg-orange-50 text-orange-700 border-orange-200', description: 'In return transit back to warehouse' },
  { label: 'Returned to Sender', value: 'RETURNED_TO_SENDER', color: 'bg-red-100 text-red-900 border-red-300', badge: 'bg-red-50 text-red-700 border-red-200', description: 'Received back at warehouse & restocked' },
];

const COMMON_DELIVERY_FAILURE_REASONS = [
  'Customer phone unanswered during arrival',
  'Customer requested reschedule to another date',
  'Delivery address closed / gate locked / inaccessible',
  'Customer refused doorstep payment readiness',
  'Recipient was temporarily unavailable at address',
];

const COMMON_RETURN_TO_SENDER_REASONS = [
  'Recipient unreachable after multiple delivery attempts',
  'Customer cancelled order at doorstep',
  'Incorrect / non-existent address provided',
  'Parcel damaged or packaging compromised in transit',
  'Customer refused acceptance and cash payment',
];

const COMMON_CANCELLATION_REASONS = [
  'Customer cancelled via phone call',
  'Customer unreachable after multiple call attempts',
  'Delivery address invalid or outside courier service area',
  'Customer ordered wrong size / duplicate order',
  'Customer refuses doorstep cash payment readiness',
];

const COMMON_RETURN_REASONS = [
  'Customer rejected parcel at doorstep',
  'Customer unable to provide exact cash on delivery',
  'Recipient unavailable after 3 courier delivery attempts',
  'Incorrect item or damaged in courier transit',
  'Wrong delivery address / customer relocated',
];

export default function AdminCodOrdersPage() {
  const { orders, refreshOrders, updateOrderStatus, confirmCodOrder, adminUsers } = useAdminData();

  // Search, Filters & Date Range
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('ALL');
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');
  const [remittanceFilter, setRemittanceFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dedicated Koombiyo Courier Management Modal State
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierModalTab, setCourierModalTab] = useState<'BOOKING' | 'STATUS' | 'LOGS'>('BOOKING');
  const [courierProvider, setCourierProvider] = useState('Koombiyo Delivery');
  const [courierWaybill, setCourierWaybill] = useState('');
  const [courierBookingDate, setCourierBookingDate] = useState('');
  const [courierPickupDate, setCourierPickupDate] = useState('');
  const [courierExpectedDelivery, setCourierExpectedDelivery] = useState('');
  const [courierWeight, setCourierWeight] = useState(0.5);
  const [courierFee, setCourierFee] = useState(450);
  const [courierCodAmount, setCourierCodAmount] = useState(0);
  const [courierNotes, setCourierNotes] = useState('');

  // Status update tab state in courier modal
  const [courierDeliveryStatus, setCourierDeliveryStatus] = useState<CourierDeliveryStatus>('READY_FOR_PICKUP');
  const [courierAttemptNumber, setCourierAttemptNumber] = useState(1);
  const [courierFailureReason, setCourierFailureReason] = useState('');
  const [courierReturnReason, setCourierReturnReason] = useState('');
  const [courierCollectedAmount, setCourierCollectedAmount] = useState(0);
  const [courierStatusNotes, setCourierStatusNotes] = useState('');
  const [courierNewInternalNote, setCourierNewInternalNote] = useState('');
  const [courierValidationError, setCourierValidationError] = useState<string | null>(null);

  // Status update form state
  const [modalStatus, setModalStatus] = useState<OrderStatus>('CONFIRMED');
  const [modalCarrier, setModalCarrier] = useState('');
  const [modalTracking, setModalTracking] = useState('');
  const [modalAdmin, setModalAdmin] = useState('Admin Staff');
  const [modalNote, setModalNote] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Set default admin name when adminUsers load
  useEffect(() => {
    if (adminUsers && adminUsers.length > 0 && modalAdmin === 'Admin Staff') {
      setModalAdmin(adminUsers[0].name || adminUsers[0].email || 'Admin Staff');
    }
  }, [adminUsers, modalAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Filter exclusively for Cash on Delivery (COD) orders
  const allCodOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.paymentMethod === 'CASH_ON_DELIVERY' ||
        o.paymentMethod?.toLowerCase().includes('cash') ||
        o.paymentMethod?.toLowerCase().includes('cod')
    );
  }, [orders]);

  // 2. Multi-parameter filtering (Search, Status, Collection, Remittance, Courier, District, Date)
  const filteredOrders = useMemo(() => {
    return allCodOrders.filter((order) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerEmail.toLowerCase().includes(q) ||
          (order.phone && order.phone.toLowerCase().includes(q)) ||
          (order.shippingAddress?.phone && order.shippingAddress.phone.toLowerCase().includes(q)) ||
          (order.shippingAddress?.recipientName && order.shippingAddress.recipientName.toLowerCase().includes(q)) ||
          (order.shippingAddress?.street && order.shippingAddress.street.toLowerCase().includes(q)) ||
          (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(q)) ||
          (order.shippingAddress?.district && order.shippingAddress.district.toLowerCase().includes(q)) ||
          (order.carrier && order.carrier.toLowerCase().includes(q)) ||
          (order.courierDetails?.courierProvider && order.courierDetails.courierProvider.toLowerCase().includes(q)) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
          (order.courierDetails?.waybillNumber && order.courierDetails.waybillNumber.toLowerCase().includes(q)) ||
          order.items.some((i) => i.title.toLowerCase().includes(q));

        if (!matchSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // COD Collection Status Filter
      if (collectionFilter !== 'ALL') {
        const col = order.codCollectionStatus || order.courierDetails?.codCollectionStatus || 'COLLECTION_PENDING';
        if (col !== collectionFilter) return false;
      }

      // COD Remittance Status Filter
      if (remittanceFilter !== 'ALL') {
        const rem = order.codSettlementStatus || order.courierDetails?.codRemittanceStatus || 'PENDING_REMITTANCE';
        if (rem !== remittanceFilter) return false;
      }

      // Courier Provider Filter
      if (courierFilter !== 'ALL') {
        const c = (order.carrier || order.courierDetails?.courierProvider || '').toLowerCase();
        if (!c.includes(courierFilter.toLowerCase())) return false;
      }

      // District Filter
      if (districtFilter !== 'ALL') {
        const d = (order.shippingAddress?.district || '').toLowerCase();
        if (d !== districtFilter.toLowerCase()) return false;
      }

      // Date Range Filtering
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (new Date(order.createdAt).getTime() < start) return false;
      }

      if (endDate) {
        let endStr = endDate;
        if (endStr.length === 10) endStr += 'T23:59:59.999Z';
        const end = new Date(endStr).getTime();
        if (new Date(order.createdAt).getTime() > end) return false;
      }

      // Delivery Status Filter
      if (deliveryFilter !== 'ALL') {
        const del = order.courierDetails?.deliveryStatus || 'NOT_BOOKED';
        if (del !== deliveryFilter) return false;
      }

      return true;
    });
  }, [
    allCodOrders,
    searchQuery,
    statusFilter,
    deliveryFilter,
    collectionFilter,
    remittanceFilter,
    courierFilter,
    districtFilter,
    startDate,
    endDate,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, deliveryFilter, collectionFilter, remittanceFilter, courierFilter, districtFilter, startDate, endDate]);

  // Pagination calculation
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCodAmount = allCodOrders.reduce((sum, o) => sum + (o.amountToCollect ?? o.totalAmount), 0);
    const pendingConfirmationCount = allCodOrders.filter((o) => o.status === 'PENDING_CONFIRMATION').length;
    const readyOrShippedCount = allCodOrders.filter((o) => o.status === 'READY_TO_SHIP' || o.status === 'SHIPPED').length;
    const deliveredCount = allCodOrders.filter((o) => o.status === 'DELIVERED').length;
    const collectedAmount = allCodOrders
      .filter((o) => o.codCollectionStatus === 'COLLECTED' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.amountToCollect ?? o.totalAmount), 0);

    return {
      totalCodOrders: allCodOrders.length,
      totalCodAmount,
      pendingConfirmationCount,
      readyOrShippedCount,
      deliveredCount,
      collectedAmount,
    };
  }, [allCodOrders]);

  // Open Detailed Order Modal
  const handleOpenDetails = (order: OrderRecord) => {
    setSelectedOrder(order);
  };

  // Open Status Update Modal with validation prep
  const handleOpenStatusModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setModalStatus(order.status);
    setModalCarrier(order.carrier || order.courierDetails?.courierProvider || 'PromptX Courier');
    setModalTracking(order.trackingNumber || order.courierDetails?.waybillNumber || '');
    setModalNote('');
    setModalReason('');
    setFormValidationError(null);
    setIsUpdateModalOpen(true);
  };

  // Save Status Update with Strict Validation
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setFormValidationError(null);

    // Validation 1: Require reason for cancellation
    if (modalStatus === 'CANCELLED') {
      const reason = modalReason.trim() || modalNote.trim();
      if (!reason || reason.length < 5) {
        setFormValidationError('Please provide a specific cancellation reason (minimum 5 characters).');
        return;
      }
    }

    // Validation 2: Require reason for returned parcel
    if (modalStatus === 'RETURNED') {
      const reason = modalReason.trim() || modalNote.trim();
      if (!reason || reason.length < 5) {
        setFormValidationError('Please provide a specific return reason (minimum 5 characters).');
        return;
      }
    }

    // Validation 3: When marked shipped, require carrier
    if (modalStatus === 'SHIPPED' && !modalCarrier.trim()) {
      setFormValidationError('Please specify a courier provider name before marking an order as shipped.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateOrderStatus(
        selectedOrder.id,
        modalStatus,
        modalCarrier.trim(),
        modalTracking.trim(),
        modalNote.trim(),
        modalAdmin.trim(),
        modalReason.trim()
      );

      if (updated) {
        setSelectedOrder(updated as OrderRecord);
      }
      showToast(`Order #${selectedOrder.orderNumber} status updated to ${modalStatus}!`);
      setIsUpdateModalOpen(false);
      await refreshOrders();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setFormValidationError(err.message || 'Failed to update order status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Phone Confirmation for Pending Orders
  const handleQuickConfirm = async (order: OrderRecord) => {
    setIsSubmitting(true);
    try {
      const updated = await confirmCodOrder(order.id, `Phone confirmation verified by ${modalAdmin || 'Admin Staff'}.`);
      showToast(`Order #${order.orderNumber} confirmed! Ready for packing.`);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updated);
      }
      await refreshOrders();
    } catch (err: any) {
      showToast(err.message || 'Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Copy Courier Delivery Slip
  const handleCopyCourierSlip = (order: OrderRecord) => {
    const itemsList = order.items.map((i) => `${i.title} (${i.size || 'Standard'} / ${i.color || 'Standard'}) x${i.quantity}`).join(' + ');
    const slipText = [
      `--- REXBEBE DOORSTEP COD BOOKING ---`,
      `Order Ref: ${order.orderNumber}`,
      `Recipient: ${order.shippingAddress?.recipientName || order.customerName}`,
      `Phone: ${order.shippingAddress?.phone || order.phone || 'N/A'}`,
      `Delivery Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}`,
      `District: ${order.shippingAddress?.district || 'Colombo'}`,
      `Postal Code: ${order.shippingAddress?.postalCode || 'N/A'}`,
      `COD Amount to Collect: LKR ${(order.amountToCollect ?? order.totalAmount).toLocaleString()}`,
      `Items: ${itemsList}`,
      order.shippingAddress?.deliveryInstructions ? `Delivery Notes: ${order.shippingAddress.deliveryInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(slipText);
    setCopiedOrderId(order.id);
    showToast(`Order #${order.orderNumber} courier booking slip copied to clipboard! 📋`);
    setTimeout(() => setCopiedOrderId(null), 3000);
  };

  // Open Koombiyo Courier Management Modal
  const handleOpenCourierModal = (order: OrderRecord, defaultTab: 'BOOKING' | 'STATUS' | 'LOGS' = 'BOOKING') => {
    setSelectedOrder(order);
    setCourierModalTab(defaultTab);
    setCourierValidationError(null);

    const c = order.courierDetails;
    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const plus3DaysIso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    setCourierProvider(c?.courierProvider || order.carrier || 'Koombiyo Delivery');
    setCourierWaybill(c?.waybillNumber || order.trackingNumber || '');
    setCourierBookingDate(c?.bookingDate || todayIso);
    setCourierPickupDate(c?.pickupDate || tomorrowIso);
    setCourierExpectedDelivery(c?.expectedDeliveryDate || plus3DaysIso);
    setCourierWeight(c?.parcelWeight || 0.5);
    setCourierFee(c?.deliveryFee || order.shippingFee || 450);
    setCourierCodAmount(c?.codAmountToCollect || order.amountToCollect || order.totalAmount);
    setCourierNotes(c?.courierNotes || '');

    // Status Tab defaults
    setCourierDeliveryStatus((c?.deliveryStatus as CourierDeliveryStatus) || 'READY_FOR_PICKUP');
    setCourierAttemptNumber((c?.deliveryAttempts?.length || 0) + 1);
    setCourierFailureReason(c?.failureReason || '');
    setCourierReturnReason(c?.returnReason || '');
    setCourierCollectedAmount(order.amountToCollect || order.totalAmount);
    setCourierStatusNotes('');
    setCourierNewInternalNote('');

    setIsCourierModalOpen(true);
  };

  // Save Courier Booking Details (Manual Workflow)
  const handleSaveCourierBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setCourierValidationError(null);

    if (!courierProvider.trim()) {
      setCourierValidationError('Please select or specify a courier provider (e.g. Koombiyo Delivery).');
      return;
    }

    if (!courierWaybill.trim()) {
      setCourierValidationError('Please enter a tracking / waybill number (or consignment code).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ManualCourierBookingPayload = {
        courierProvider: courierProvider.trim(),
        trackingNumber: courierWaybill.trim(),
        waybillNumber: courierWaybill.trim(),
        bookingDate: courierBookingDate,
        pickupDate: courierPickupDate,
        expectedDeliveryDate: courierExpectedDelivery,
        parcelWeight: Number(courierWeight),
        deliveryFee: Number(courierFee),
        codAmountToCollect: Number(courierCodAmount),
        courierNotes: courierNotes.trim(),
        admin: modalAdmin,
      };

      const updated = await orderService.bookCourierManual(selectedOrder.id, payload);
      if (updated) {
        setSelectedOrder(updated);
      }
      showToast(`Manual booking recorded with ${courierProvider}! Tracking #${courierWaybill}`);
      setIsCourierModalOpen(false);
      await refreshOrders();
    } catch (err: any) {
      console.error('Failed to book courier:', err);
      setCourierValidationError(err.message || 'Failed to save courier booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Courier Delivery Status with Validation
  const handleUpdateCourierDeliveryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setCourierValidationError(null);

    // Strict validation for exceptional events
    if (courierDeliveryStatus === 'DELIVERY_ATTEMPT_FAILED') {
      const reason = courierFailureReason.trim();
      if (!reason || reason.length < 5) {
        setCourierValidationError('A specific failure reason (minimum 5 characters) is required for delivery attempt failures.');
        return;
      }
    }

    if (courierDeliveryStatus === 'RETURNING_TO_SENDER' || courierDeliveryStatus === 'RETURNED_TO_SENDER') {
      const reason = courierReturnReason.trim();
      if (!reason || reason.length < 5) {
        setCourierValidationError('A specific return reason (minimum 5 characters) is required when parcel is returning/returned to sender.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: DeliveryStatusUpdatePayload = {
        deliveryStatus: courierDeliveryStatus,
        date: new Date().toISOString(),
        admin: modalAdmin,
        reason:
          courierDeliveryStatus === 'DELIVERY_ATTEMPT_FAILED'
            ? courierFailureReason.trim()
            : courierDeliveryStatus === 'RETURNING_TO_SENDER' || courierDeliveryStatus === 'RETURNED_TO_SENDER'
            ? courierReturnReason.trim()
            : undefined,
        attemptNumber: courierAttemptNumber,
        courierNotes: courierStatusNotes.trim(),
        collectedAmount: courierDeliveryStatus === 'DELIVERED' ? Number(courierCollectedAmount) : undefined,
      };

      const updated = await orderService.updateCourierDeliveryStatus(selectedOrder.id, payload);
      if (updated) {
        setSelectedOrder(updated);
      }
      showToast(`Delivery status updated to '${courierDeliveryStatus}'!`);
      setIsCourierModalOpen(false);
      await refreshOrders();
    } catch (err: any) {
      console.error('Failed to update delivery status:', err);
      setCourierValidationError(err.message || 'Failed to update courier delivery status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Internal Courier Note
  const handleAddCourierNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !courierNewInternalNote.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await orderService.addCourierNote(selectedOrder.id, courierNewInternalNote.trim(), modalAdmin);
      if (updated) {
        setSelectedOrder(updated);
      }
      setCourierNewInternalNote('');
      showToast('Courier note logged successfully! 📝');
      await refreshOrders();
    } catch (err: any) {
      showToast(err.message || 'Could not add note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Koombiyo Portal Booking Payload
  const handleCopyKoombiyoPortalPayload = async (order: OrderRecord) => {
    try {
      const res = await orderService.getKoombiyoPortalPayload(order.id);
      if (res?.text) {
        navigator.clipboard.writeText(res.text);
        setCopiedOrderId(order.id);
        showToast(`Koombiyo portal booking payload copied for #${order.orderNumber}! 📋`);
        setTimeout(() => setCopiedOrderId(null), 3000);
      }
    } catch (err) {
      handleCopyCourierSlip(order);
    }
  };

  // Date Presets
  const handleSetDatePreset = (preset: 'today' | '7days' | 'month' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (preset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      return;
    }
    if (preset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past7);
      setEndDate(now.toISOString().split('T')[0]);
      return;
    }
    if (preset === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(monthStart);
      setEndDate(now.toISOString().split('T')[0]);
      return;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Cash on Delivery (COD) Orders"
          subtitle="Manage doorstep cash collections, customer confirmations, packaging, delivery dispatch, and status verification."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total COD Orders</span>
                <Banknote className="w-4 h-4 text-brand-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 font-mono">{metrics.totalCodOrders}</p>
              <p className="text-[11px] text-stone-500">
                Payable Volume: <strong className="text-stone-800">{formatCurrency(metrics.totalCodAmount)}</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[10px] uppercase font-bold tracking-wider">Awaiting Confirmation</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900 font-mono">{metrics.pendingConfirmationCount}</p>
              <p className="text-[11px] text-amber-700">Phone address verification required</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[10px] uppercase font-bold tracking-wider">Active Logistics</span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-900 font-mono">{metrics.readyOrShippedCount}</p>
              <p className="text-[11px] text-blue-700">Ready to ship &amp; in transit</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[10px] uppercase font-bold tracking-wider">Delivered &amp; Collected</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-900 font-mono">{metrics.deliveredCount}</p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Collected: <strong className="text-emerald-900">{formatCurrency(metrics.collectedAmount)}</strong>
              </p>
            </div>
          </div>

          {/* Search, Filter & Date Bar */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            {/* Row 1: Search & Quick Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by order #, recipient, phone, address, tracking #, item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => refreshOrders()}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Refresh from Database"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                {(searchQuery || statusFilter !== 'ALL' || deliveryFilter !== 'ALL' || collectionFilter !== 'ALL' || remittanceFilter !== 'ALL' || courierFilter !== 'ALL' || districtFilter !== 'ALL' || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setDeliveryFilter('ALL');
                      setCollectionFilter('ALL');
                      setRemittanceFilter('ALL');
                      setCourierFilter('ALL');
                      setDistrictFilter('ALL');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                }`}
              >
                All COD ({allCodOrders.length})
              </button>

              {STATUS_OPTIONS.map((st) => {
                const count = allCodOrders.filter((o) => o.status === st.value).length;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setStatusFilter(st.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      statusFilter === st.value
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        statusFilter === st.value ? 'bg-amber-900/60 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 3: Dropdown Filters & Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-stone-100 text-xs">
              {/* Courier Delivery Status Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Delivery Status
                </label>
                <select
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  {COURIER_DELIVERY_STATUS_OPTIONS.map((ds) => (
                    <option key={ds.value} value={ds.value}>
                      {ds.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Courier Provider Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Courier Partner
                </label>
                <select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Couriers</option>
                  <option value="Koombiyo">Koombiyo Delivery</option>
                  <option value="PromptX">PromptX Courier</option>
                  <option value="Domex">Domex Express</option>
                </select>
              </div>

              {/* COD Collection Status */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Collection Status
                </label>
                <select
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Collection Statuses</option>
                  <option value="COLLECTION_PENDING">Collection Pending</option>
                  <option value="COLLECTED">Collected</option>
                  <option value="NOT_COLLECTED">Not Collected</option>
                </select>
              </div>

              {/* Courier Remittance Status */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Remittance Status
                </label>
                <select
                  value={remittanceFilter}
                  onChange={(e) => setRemittanceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Remittance Statuses</option>
                  <option value="PENDING_REMITTANCE">Pending Remittance</option>
                  <option value="REMITTED">Remitted to Bank</option>
                  <option value="RECONCILED">Reconciled</option>
                </select>
              </div>

              {/* District Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Delivery District
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Districts</option>
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter: Start & End */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400">Order Date Range</label>
                  <div className="flex space-x-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('today')}
                      className="text-amber-800 hover:underline font-bold"
                    >
                      Today
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('7days')}
                      className="text-amber-800 hover:underline font-bold"
                    >
                      Last 7D
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('month')}
                      className="text-amber-800 hover:underline font-bold"
                    >
                      This Month
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('all')}
                      className="text-stone-500 hover:underline"
                    >
                      All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table Card */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center space-x-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">COD Orders Register</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} found
                </span>
              </div>

              {/* Rows per page selector */}
              <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order # &amp; Date</th>
                    <th className="p-4">Customer &amp; Phone</th>
                    <th className="p-4">Delivery Address</th>
                    <th className="p-4">Garment Items</th>
                    <th className="p-4">Subtotal / Total Payable</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4">Logistics &amp; Tracking</th>
                    <th className="p-4">COD Collection</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => {
                      const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const amountToPay = order.amountToCollect ?? order.totalAmount;
                      const statusDef = STATUS_OPTIONS.find((s) => s.value === order.status);

                      return (
                        <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* Order Number & Date */}
                          <td className="p-4 align-top">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(order)}
                              className="font-mono font-bold text-stone-900 hover:text-amber-800 hover:underline block text-left"
                            >
                              {order.orderNumber}
                            </button>
                            <span className="text-[11px] text-stone-500 block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Customer Name & Phone Number */}
                          <td className="p-4 align-top">
                            <p className="font-bold text-stone-900">
                              {order.shippingAddress?.recipientName || order.customerName}
                            </p>
                            <a
                              href={`tel:${order.shippingAddress?.phone || order.phone || ''}`}
                              className="text-[11px] text-stone-600 font-semibold hover:text-amber-800 flex items-center space-x-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{order.shippingAddress?.phone || order.phone || 'N/A'}</span>
                            </a>
                            <span className="text-[10px] text-stone-400 block truncate max-w-[140px]">
                              {order.customerEmail}
                            </span>
                          </td>

                          {/* Full Delivery Address */}
                          <td className="p-4 align-top max-w-[200px]">
                            <div className="flex items-start space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <p className="font-bold text-stone-900 text-xs">
                                  {order.shippingAddress?.district || 'Colombo'} District
                                </p>
                                <p className="text-[11px] text-stone-600 leading-tight">
                                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                </p>
                                {order.shippingAddress?.postalCode && (
                                  <span className="text-[10px] text-stone-400 font-mono block">
                                    Postal: {order.shippingAddress.postalCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Products, Sizes, Colours, Quantities */}
                          <td className="p-4 align-top">
                            <div className="space-y-1.5 max-w-[220px]">
                              {order.items.map((it) => (
                                <div key={it.id} className="text-[11px] leading-tight">
                                  <p className="font-semibold text-stone-900 truncate">{it.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-stone-500">
                                    {it.size && <span>Size: <strong className="text-stone-700">{it.size}</strong></span>}
                                    {it.color && <span>Col: <strong className="text-stone-700">{it.color}</strong></span>}
                                    <span>Qty: <strong className="text-stone-700">{it.quantity}</strong></span>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <span className="text-[10px] font-bold text-amber-800">
                                  Total: {totalQty} items
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Subtotal, Discount, Delivery Fee, Final Payable Amount */}
                          <td className="p-4 align-top">
                            <div className="space-y-0.5 text-[11px]">
                              <div className="flex justify-between text-stone-500 space-x-2">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-medium space-x-2">
                                  <span>Discount:</span>
                                  <span>−{formatCurrency(order.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-stone-500 space-x-2">
                                <span>Delivery:</span>
                                <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
                              </div>
                              <div className="pt-1 border-t border-stone-200 flex justify-between items-baseline font-black text-xs text-brand-900">
                                <span className="text-[10px] font-bold uppercase text-stone-700">Collect:</span>
                                <span className="text-stone-900 font-black">{formatCurrency(amountToPay)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Order Status */}
                          <td className="p-4 align-top">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-block ${
                                statusDef?.color || 'bg-stone-100 text-stone-800 border-stone-200'
                              }`}
                            >
                              {order.status === 'PENDING_CONFIRMATION'
                                ? 'Pending Confirm'
                                : statusDef?.label || order.status}
                            </span>

                            {order.status === 'PENDING_CONFIRMATION' && (
                              <button
                                type="button"
                                onClick={() => handleQuickConfirm(order)}
                                disabled={isSubmitting}
                                className="mt-2 w-full px-2 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Confirm COD</span>
                              </button>
                            )}
                          </td>

                          {/* Logistics, Courier & Tracking */}
                          <td className="p-4 align-top">
                            {(() => {
                              const carrier = order.carrier || order.courierDetails?.courierProvider || 'Unassigned';
                              const isKoombiyo = carrier.toLowerCase().includes('koombiyo');
                              const trackingNum = order.trackingNumber || order.courierDetails?.waybillNumber;
                              const delStatus = (order.courierDetails?.deliveryStatus || 'NOT_BOOKED') as CourierDeliveryStatus;
                              const statusConfig = COURIER_DELIVERY_STATUS_OPTIONS.find((s) => s.value === delStatus) || {
                                label: delStatus,
                                badge: 'bg-stone-100 text-stone-700 border-stone-200',
                              };
                              const trackingUrl =
                                order.courierDetails?.trackingUrl ||
                                (trackingNum && isKoombiyo ? `https://koombiyodelivery.lk/track/${encodeURIComponent(trackingNum)}` : undefined);

                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                    <span className="font-bold text-stone-900 text-xs">{carrier}</span>
                                    {isKoombiyo && (
                                      <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                        Koombiyo
                                      </span>
                                    )}
                                  </div>

                                  {trackingNum ? (
                                    <div className="flex items-center space-x-1 text-[11px] font-mono text-stone-700">
                                      <span>#{trackingNum}</span>
                                      {trackingUrl && (
                                        <a
                                          href={trackingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-brand-600 hover:text-brand-800 p-0.5"
                                          title="Track on Courier Portal"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-stone-400 italic">No waybill recorded</p>
                                  )}

                                  {/* Delivery Status Badge */}
                                  <div>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center space-x-1 ${statusConfig.badge}`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                      <span>{statusConfig.label}</span>
                                      {delStatus === 'DELIVERY_ATTEMPT_FAILED' && order.courierDetails?.deliveryAttempts && (
                                        <span className="ml-1 text-[9px] opacity-80">
                                          (#{order.courierDetails.deliveryAttempts.length})
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Quick Courier Action */}
                                  <div className="pt-1 flex items-center space-x-1.5 flex-wrap gap-y-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCourierModal(order)}
                                      className="px-2 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 rounded-lg text-[10px] font-bold transition-colors flex items-center space-x-1 cursor-pointer border border-stone-200"
                                      title="Manage Koombiyo Courier Booking"
                                    >
                                      <Truck className="w-3 h-3 text-amber-700" />
                                      <span>Manage Courier</span>
                                    </button>

                                    {(delStatus === 'DELIVERY_ATTEMPT_FAILED' ||
                                      delStatus === 'RETURNING_TO_SENDER' ||
                                      delStatus === 'RETURNED_TO_SENDER' ||
                                      order.status === 'RETURNED') && (
                                      <Link
                                        href="/admin/returns"
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center space-x-1"
                                        title="Open Returns & RTS Center"
                                      >
                                        <RotateCcw className="w-3 h-3 text-rose-700" />
                                        <span>Returns Center</span>
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* COD Financial Status */}
                          <td className="p-4 align-top">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider block text-center mb-1 ${
                                order.codCollectionStatus === 'COLLECTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.codCollectionStatus === 'COLLECTED'
                                ? 'Collected'
                                : 'Collection Pending'}
                            </span>
                            <span className="text-[10px] text-stone-500 block text-center">
                              {order.codSettlementStatus || order.courierDetails?.codRemittanceStatus || 'PENDING_REMITTANCE'}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-4 align-top text-right">
                            <div className="flex flex-col items-end space-y-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(order)}
                                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenCourierModal(order, 'STATUS')}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                                title="Update Delivery Milestones & Attempts"
                              >
                                <Truck className="w-3.5 h-3.5 text-amber-700" />
                                <span>Delivery</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(order)}
                                className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Status</span>
                              </button>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyKoombiyoPortalPayload(order)}
                                  className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                                  title="Copy Koombiyo Merchant Portal Slip"
                                >
                                  {copiedOrderId === order.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-500">
                        <Banknote className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-stone-700">No Cash on Delivery orders found</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Try adjusting your search query, status tabs, district, or date range.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 bg-stone-50/40">
                <p>
                  Showing <strong className="text-stone-900">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-stone-900">{Math.min(currentPage * pageSize, totalOrders)}</strong> of{' '}
                  <strong className="text-stone-900">{totalOrders}</strong> COD orders
                </p>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 rounded-xl font-bold transition-colors cursor-pointer ${
                        currentPage === pg
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 1. ORDER DETAILS SLIDE-OVER / MODAL                        */}
      {/* ========================================================= */}
      {selectedOrder && !isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    COD Order #{selectedOrder.orderNumber}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      STATUS_OPTIONS.find((s) => s.value === selectedOrder.status)?.color || 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Method: Cash on Delivery
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Delivery Address Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Customer Recipient</span>
                <p className="font-bold text-stone-900 text-sm">
                  {selectedOrder.shippingAddress?.recipientName || selectedOrder.customerName}
                </p>
                <p className="flex items-center space-x-1.5 text-stone-700 font-medium">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <a href={`tel:${selectedOrder.shippingAddress?.phone || selectedOrder.phone || ''}`} className="hover:underline">
                    {selectedOrder.shippingAddress?.phone || selectedOrder.phone || 'N/A'}
                  </a>
                </p>
                <p className="flex items-center space-x-1.5 text-stone-500">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedOrder.customerEmail}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Full Delivery Address</span>
                <p className="font-bold text-stone-900">
                  {selectedOrder.shippingAddress?.district || 'Colombo'} District
                </p>
                <p className="text-stone-700">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}
                </p>
                <p className="text-stone-500">
                  {selectedOrder.shippingAddress?.postalCode ? `Postal Code: ${selectedOrder.shippingAddress.postalCode} • ` : ''}
                  {selectedOrder.shippingAddress?.country || 'Sri Lanka'}
                </p>
                {selectedOrder.shippingAddress?.deliveryInstructions && (
                  <p className="text-[11px] text-amber-900 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Note: &ldquo;{selectedOrder.shippingAddress.deliveryInstructions}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Products Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                Ordered Products &amp; Variants ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                        <Image
                          src={item.image || '/images/products/organic-onesie.jpg'}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{item.title}</p>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-0.5">
                          {item.size && <span>Size: <strong className="text-stone-700">{item.size}</strong></span>}
                          {item.color && <span>Colour: <strong className="text-stone-700">{item.color}</strong></span>}
                          <span>Qty: <strong className="text-stone-700">{item.quantity}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-[10px] text-stone-400">@{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown & Courier Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Courier Card */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Courier &amp; Logistics</span>
                  <button
                    type="button"
                    onClick={() => handleOpenCourierModal(selectedOrder)}
                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline flex items-center space-x-1"
                  >
                    <span>Manage Courier</span>
                    <Truck className="w-3 h-3 text-amber-700" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-stone-900 text-sm">
                    {selectedOrder.carrier || selectedOrder.courierDetails?.courierProvider || 'Koombiyo Delivery'}
                  </p>
                  {(selectedOrder.carrier || selectedOrder.courierDetails?.courierProvider || '').toLowerCase().includes('koombiyo') && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      Partner
                    </span>
                  )}
                </div>
                <p className="text-stone-600 flex items-center space-x-1.5">
                  <span>Tracking:</span>
                  <strong className="font-mono text-stone-900">
                    {selectedOrder.trackingNumber || selectedOrder.courierDetails?.waybillNumber || 'Pending Waybill'}
                  </strong>
                  {(selectedOrder.trackingNumber || selectedOrder.courierDetails?.waybillNumber) && (
                    <a
                      href={`https://koombiyodelivery.lk/track/${encodeURIComponent(selectedOrder.trackingNumber || selectedOrder.courierDetails?.waybillNumber || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold uppercase text-[9px]">
                    Delivery: {selectedOrder.courierDetails?.deliveryStatus || 'NOT_BOOKED'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold uppercase text-[9px]">
                    Collection: {selectedOrder.codCollectionStatus || 'PENDING'}
                  </span>
                  {selectedOrder.courierDetails?.pickupDate && (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[9px]">
                      Pickup: {selectedOrder.courierDetails.pickupDate}
                    </span>
                  )}
                </div>
                {selectedOrder.courierDetails?.deliveryAttempts && selectedOrder.courierDetails.deliveryAttempts.length > 0 && (
                  <p className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                    ⚠️ {selectedOrder.courierDetails.deliveryAttempts.length} Delivery Attempt(s) recorded. Latest: &ldquo;{selectedOrder.courierDetails.deliveryAttempts[selectedOrder.courierDetails.deliveryAttempts.length - 1].reason}&rdquo;
                  </p>
                )}
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Product Subtotal:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span>−{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee ({selectedOrder.shippingAddress?.district || 'Colombo'}):</span>
                  <span className="font-semibold text-stone-900">
                    {selectedOrder.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
                  <span>Payable at Delivery (COD):</span>
                  <span className="text-base text-brand-700 font-black">
                    {formatCurrency(selectedOrder.amountToCollect ?? selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                Status Change Audit History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                  selectedOrder.timeline.map((event, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{event.status}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(event.time).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-stone-600 text-[11px] mt-0.5">{event.note}</p>
                        {event.admin && (
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            Logged by: <strong className="text-stone-600">{event.admin}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic">No historical status records logged yet.</p>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyCourierSlip(selectedOrder)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Courier Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  title="Print Order Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {selectedOrder.status === 'PENDING_CONFIRMATION' && (
                  <button
                    type="button"
                    onClick={() => handleQuickConfirm(selectedOrder)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Order</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedOrder)}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Update Status &amp; Logistics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. UPDATE STATUS & LOGISTICS DIALOG WITH STRICT VALIDATION */}
      {/* ========================================================= */}
      {isUpdateModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveStatus}
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Update COD Status
                </h3>
                <p className="text-xs text-stone-500">Order #{selectedOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formValidationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{formValidationError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Order Status Select */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Target Order Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => {
                    setModalStatus(e.target.value as OrderStatus);
                    setFormValidationError(null);
                  }}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  required
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exceptional Action: Required Cancellation Reason */}
              {modalStatus === 'CANCELLED' && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="block text-rose-900 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Cancellation Reason (Required) <span className="text-rose-600">*</span></span>
                  </label>
                  <p className="text-[11px] text-rose-800 leading-tight">
                    State the clear operational reason for cancellation. Inventory will be automatically restocked.
                  </p>
                  <textarea
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="e.g. Customer requested cancellation via phone call on Oct 23..."
                    className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    rows={2}
                    required
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {COMMON_CANCELLATION_REASONS.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalReason(r)}
                        className="text-[10px] bg-white hover:bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200 transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exceptional Action: Required Return Reason */}
              {modalStatus === 'RETURNED' && (
                <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 space-y-2">
                  <label className="block text-stone-900 font-bold flex items-center space-x-1">
                    <RotateCcw className="w-4 h-4 text-stone-600" />
                    <span>Parcel Return Reason (Required) <span className="text-rose-600">*</span></span>
                  </label>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Document why the courier returned this parcel. Stock will be restored to warehouse.
                  </p>
                  <textarea
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="e.g. Courier returned parcel - customer refused doorstep acceptance..."
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
                    rows={2}
                    required
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {COMMON_RETURN_REASONS.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalReason(r)}
                        className="text-[10px] bg-white hover:bg-stone-200 text-stone-800 px-2 py-0.5 rounded-md border border-stone-300 transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Courier Provider & Waybill Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Courier Provider
                  </label>
                  <input
                    type="text"
                    value={modalCarrier}
                    onChange={(e) => setModalCarrier(e.target.value)}
                    placeholder="e.g. PromptX / Domex"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Waybill / Tracking #
                  </label>
                  <input
                    type="text"
                    value={modalTracking}
                    onChange={(e) => setModalTracking(e.target.value)}
                    placeholder="e.g. PRX-982341"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Acting Administrator Name */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Responsible Administrator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalAdmin}
                  onChange={(e) => setModalAdmin(e.target.value)}
                  placeholder="e.g. manager@rexbebe.com"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium focus:outline-none"
                  required
                />
              </div>

              {/* Operational Audit Notes */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Timeline Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="e.g. Customer verified delivery address via morning phone call"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Status Change'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. KOOMBIYO COURIER MANAGEMENT MODAL (MANUAL / API READY) */}
      {/* ========================================================= */}
      {isCourierModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-start justify-between bg-stone-50/50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-800 text-white flex items-center justify-center shadow-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
                      <span>Koombiyo Courier Management</span>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Manual Workflow [API Ready]
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Order #{selectedOrder.orderNumber} • {selectedOrder.shippingAddress?.recipientName || selectedOrder.customerName} ({selectedOrder.shippingAddress?.district || 'Colombo'})
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {courierValidationError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{courierValidationError}</span>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="px-6 pt-4 border-b border-stone-100 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCourierModalTab('BOOKING');
                  setCourierValidationError(null);
                }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  courierModalTab === 'BOOKING'
                    ? 'border-amber-800 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>1. Courier Booking &amp; Waybill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCourierModalTab('STATUS');
                  setCourierValidationError(null);
                }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  courierModalTab === 'STATUS'
                    ? 'border-amber-800 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>2. Update Delivery Status</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCourierModalTab('LOGS');
                  setCourierValidationError(null);
                }}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  courierModalTab === 'LOGS'
                    ? 'border-amber-800 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>3. Attempts &amp; Notes Log</span>
                {selectedOrder.courierDetails?.deliveryAttempts && selectedOrder.courierDetails.deliveryAttempts.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-mono">
                    {selectedOrder.courierDetails.deliveryAttempts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: BOOKING & WAYBILL */}
              {courierModalTab === 'BOOKING' && (
                <form onSubmit={handleSaveCourierBooking} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                        <Truck className="w-4 h-4 text-amber-700" />
                        <span>Koombiyo Merchant Booking Helper</span>
                      </div>
                      <a
                        href="https://koombiyo.lk/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline"
                      >
                        <span>Open Koombiyo Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Copy the pre-formatted booking payload below, create the order inside the Koombiyo Merchant Portal, and record the assigned waybill code here.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyKoombiyoPortalPayload(selectedOrder)}
                      className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Koombiyo Portal Booking Slip</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Courier Partner <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={courierProvider}
                        onChange={(e) => setCourierProvider(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold"
                        required
                      >
                        <option value="Koombiyo Delivery">Koombiyo Delivery (Primary COD Partner)</option>
                        <option value="PromptX Courier">PromptX Courier</option>
                        <option value="Domex Express">Domex Express</option>
                        <option value="Pronto Lanka">Pronto Lanka</option>
                        <option value="Fardar Express">Fardar Express</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Tracking / Waybill Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courierWaybill}
                        onChange={(e) => setCourierWaybill(e.target.value)}
                        placeholder="e.g. KMB-908231 or scanned barcode"
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono font-bold focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Booking Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={courierBookingDate}
                        onChange={(e) => setCourierBookingDate(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Scheduled Pickup Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={courierPickupDate}
                        onChange={(e) => setCourierPickupDate(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Estimated Delivery Date
                      </label>
                      <input
                        type="date"
                        value={courierExpectedDelivery}
                        onChange={(e) => setCourierExpectedDelivery(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Parcel Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={courierWeight}
                        onChange={(e) => setCourierWeight(Number(e.target.value))}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Delivery Charge (LKR)
                      </label>
                      <input
                        type="number"
                        value={courierFee}
                        onChange={(e) => setCourierFee(Number(e.target.value))}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Doorstep COD Amount to Collect (LKR)
                      </label>
                      <input
                        type="number"
                        value={courierCodAmount}
                        onChange={(e) => setCourierCodAmount(Number(e.target.value))}
                        className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-brand-700 font-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Courier / Driver Dispatch Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={courierNotes}
                      onChange={(e) => setCourierNotes(e.target.value)}
                      placeholder="e.g. Call customer 15 minutes before arrival; handle luxury packaging with care"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsCourierModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? 'Saving...' : 'Save Booking & Mark Ready for Pickup'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: UPDATE DELIVERY STATUS & RECORD ATTEMPTS */}
              {courierModalTab === 'STATUS' && (
                <form onSubmit={handleUpdateCourierDeliveryStatus} className="space-y-4">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Delivery Status</span>
                      <span className="font-bold text-stone-900 text-xs">
                        {selectedOrder.courierDetails?.deliveryStatus || 'NOT_BOOKED'}
                      </span>
                    </div>
                    {selectedOrder.courierDetails?.waybillNumber && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Waybill</span>
                        <span className="font-mono font-bold text-stone-800 text-xs">
                          #{selectedOrder.courierDetails.waybillNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      New Delivery Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={courierDeliveryStatus}
                      onChange={(e) => {
                        setCourierDeliveryStatus(e.target.value as CourierDeliveryStatus);
                        setCourierValidationError(null);
                      }}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:bg-white cursor-pointer"
                      required
                    >
                      {COURIER_DELIVERY_STATUS_OPTIONS.map((ds) => (
                        <option key={ds.value} value={ds.value}>
                          {ds.label} — {ds.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CONDITIONAL: Delivery Attempt Failed */}
                  {courierDeliveryStatus === 'DELIVERY_ATTEMPT_FAILED' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                      <div className="flex items-center space-x-2 text-rose-800 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Record Delivery Attempt Failure</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-rose-900 font-bold mb-1">
                            Attempt Number <span className="text-rose-600">*</span>
                          </label>
                          <select
                            value={courierAttemptNumber}
                            onChange={(e) => setCourierAttemptNumber(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-stone-900 font-bold"
                          >
                            <option value={1}>Attempt 1</option>
                            <option value={2}>Attempt 2</option>
                            <option value={3}>Attempt 3 (Final Attempt before Return)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-rose-900 font-bold mb-1">
                          Failure Reason <span className="text-rose-600">* (Min 5 chars)</span>
                        </label>
                        <input
                          type="text"
                          value={courierFailureReason}
                          onChange={(e) => setCourierFailureReason(e.target.value)}
                          placeholder="e.g. Customer mobile unanswered when courier arrived"
                          className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-stone-900 font-medium"
                          required
                        />

                        {/* Preset Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {COMMON_DELIVERY_FAILURE_REASONS.map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setCourierFailureReason(reason)}
                              className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-[10px] text-rose-800 border border-rose-200/80 transition-colors"
                            >
                              + {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONDITIONAL: Returning to Sender or Returned to Sender */}
                  {(courierDeliveryStatus === 'RETURNING_TO_SENDER' || courierDeliveryStatus === 'RETURNED_TO_SENDER') && (
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
                      <div className="flex items-center space-x-2 text-orange-900 font-bold">
                        <RotateCcw className="w-4 h-4 text-orange-700 shrink-0" />
                        <span>Return to Sender Notice</span>
                      </div>

                      <p className="text-[11px] text-orange-800">
                        {courierDeliveryStatus === 'RETURNED_TO_SENDER'
                          ? 'Parcel returned to warehouse. Ordered garments will be safely restocked into inventory.'
                          : 'Parcel could not be delivered and is currently in transit back to the warehouse.'}
                      </p>

                      <div>
                        <label className="block text-orange-900 font-bold mb-1">
                          Mandatory Return Reason <span className="text-rose-600">* (Min 5 chars)</span>
                        </label>
                        <input
                          type="text"
                          value={courierReturnReason}
                          onChange={(e) => setCourierReturnReason(e.target.value)}
                          placeholder="e.g. Recipient unreachable after 3 delivery attempts"
                          className="w-full p-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 font-medium"
                          required
                        />

                        {/* Preset Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {COMMON_RETURN_TO_SENDER_REASONS.map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setCourierReturnReason(reason)}
                              className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-[10px] text-orange-800 border border-orange-200/80 transition-colors"
                            >
                              + {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONDITIONAL: Delivered */}
                  {courierDeliveryStatus === 'DELIVERED' && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Delivery &amp; COD Cash Collection Confirmation</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Marking as Delivered will automatically update COD Collection Status to <strong>COLLECTED</strong> and Payment Status to <strong>PAID</strong>.
                      </p>
                      <div>
                        <label className="block text-emerald-900 font-bold mb-1">
                          Cash Amount Collected by Courier (LKR)
                        </label>
                        <input
                          type="number"
                          value={courierCollectedAmount}
                          onChange={(e) => setCourierCollectedAmount(Number(e.target.value))}
                          className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-900 font-black text-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Acting Administrator <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalAdmin}
                      onChange={(e) => setModalAdmin(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Courier Status Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={courierStatusNotes}
                      onChange={(e) => setCourierStatusNotes(e.target.value)}
                      placeholder="e.g. Courier confirmed delivery via driver phone call"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsCourierModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? 'Updating...' : 'Update Delivery Status'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: ATTEMPTS & COURIER NOTES LOG */}
              {courierModalTab === 'LOGS' && (
                <div className="space-y-4">
                  {/* Recorded Delivery Attempts */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                      Delivery Attempts Log
                    </h4>
                    {selectedOrder.courierDetails?.deliveryAttempts && selectedOrder.courierDetails.deliveryAttempts.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.courierDetails.deliveryAttempts.map((att, idx) => (
                          <div key={idx} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-900">
                                Attempt #{att.attemptNumber}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {new Date(att.date).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-rose-800">
                              Reason: <strong>{att.reason}</strong>
                            </p>
                            {att.notes && <p className="text-stone-600 text-[11px] italic">&ldquo;{att.notes}&rdquo;</p>}
                            {att.admin && (
                              <span className="text-[10px] text-stone-400 block">
                                Logged by: {att.admin}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-100">
                        No failed delivery attempts recorded.
                      </p>
                    )}
                  </div>

                  {/* Add Internal Courier Note Form */}
                  <form onSubmit={handleAddCourierNote} className="space-y-2 pt-3 border-t border-stone-100">
                    <label className="block text-stone-700 font-bold">
                      Add Courier Communication Note
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={courierNewInternalNote}
                        onChange={(e) => setCourierNewInternalNote(e.target.value)}
                        placeholder="e.g. Spoke to Koombiyo Colombo hub driver Saman (077 1234567)"
                        className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !courierNewInternalNote.trim()}
                        className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0 flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Add Note</span>
                      </button>
                    </div>
                  </form>

                  {/* Courier Notes Log */}
                  {selectedOrder.courierDetails?.courierNotes && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Courier Notes History
                      </span>
                      <pre className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-700 whitespace-pre-wrap font-sans">
                        {selectedOrder.courierDetails.courierNotes}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

