'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  CreditCard,
  User,
  MapPin,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  FileText,
  Calendar,
  Send,
  X,
  XCircle,
  Banknote,
  Copy,
  Check,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { formatCurrency } from '../../../utils/formatCurrency';
import { OrderRecord } from '../../../services/orderService';

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, confirmCodOrder, addOrderNote, refundOrder, refreshOrders } = useAdminData();

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState<OrderRecord['status']>('PROCESSING');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.country && o.country.toLowerCase().includes(q)) ||
        (o.shippingAddress?.district && o.shippingAddress.district.toLowerCase().includes(q)) ||
        (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q)) ||
        (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.toLowerCase().includes(q)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Open order detail
  const handleOpenOrder = (order: OrderRecord) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCarrier(order.courierDetails?.courierProvider || order.carrier || '');
    setTrackingNumber(order.courierDetails?.waybillNumber || order.trackingNumber || '');
    setStatusNote('');
  };

  // Update order status
  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus, carrier, trackingNumber, statusNote);
      showToast('Changes saved successfully.');
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              carrier: carrier || prev.carrier,
              trackingNumber: trackingNumber || prev.trackingNumber,
            }
          : null
      );
    } catch (e) {
      showToast('Could not update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm COD Order
  const handleConfirmCodOrder = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const updated = await confirmCodOrder(selectedOrder.id, 'COD order phone confirmed with customer.');
      showToast(`Order #${selectedOrder.orderNumber} confirmed & ready to pack! ✅`);
      setSelectedOrder(updated);
    } catch (e) {
      showToast('Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !internalNoteInput.trim()) return;
    try {
      await addOrderNote(selectedOrder.id, internalNoteInput.trim());
      showToast('Internal note saved to order record. ✍️');
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              internalNotes: prev.internalNotes
                ? `${prev.internalNotes}\n${internalNoteInput.trim()}`
                : internalNoteInput.trim(),
            }
          : null
      );
      setInternalNoteInput('');
    } catch (e) {
      showToast('Could not save internal note.');
    }
  };

  // Refund Order
  const handleRefund = async () => {
    if (!selectedOrder) return;
    if (confirm(`Are you sure you want to process a full refund / cancellation for Order #${selectedOrder.orderNumber}?`)) {
      try {
        await refundOrder(selectedOrder.id, 'Staff authorized cancellation / refund via Admin Suite');
        showToast(`Order #${selectedOrder.orderNumber} has been refunded/cancelled and stock restored.`);
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED', paymentStatus: 'REFUNDED' } : null));
      } catch (e) {
        showToast('Refund processing failed.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Order Management"
          subtitle="View customer orders, check payment status, manage fulfillment and confirm Cash on Delivery orders."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by order #, customer, email, district or waybill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Status Pills Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-500">Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All Payments</option>
                  <option value="COD_PENDING">COD Pending</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PENDING">Pending Payment</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>

                <button
                  onClick={() => refreshOrders()}
                  className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
                  title="Refresh orders"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
              {[
                { label: 'All Orders', value: 'ALL' },
                { label: 'Awaiting Confirmation', value: 'PENDING_CONFIRMATION' },
                { label: 'Confirmed', value: 'CONFIRMED' },
                { label: 'Processing', value: 'PROCESSING' },
                { label: 'Ready to Ship', value: 'READY_TO_SHIP' },
                { label: 'Shipped', value: 'SHIPPED' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === tab.value
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <Link
                href="/admin/orders/cod"
                className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center space-x-1.5 transition-all shadow-2xs"
              >
                <Banknote className="w-3.5 h-3.5 text-amber-700" />
                <span>COD Management Suite →</span>
              </Link>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order Number</th>
                    <th className="p-4">Order Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">District / Area</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Order Total / COD</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const totalItemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
                      const isCod =
                        order.paymentMethod === 'CASH_ON_DELIVERY' ||
                        order.paymentMethod === 'Cash on Delivery (COD)' ||
                        order.paymentMethod?.toLowerCase().includes('cash');
                      return (
                        <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-4 font-mono font-bold text-stone-900">
                            {order.orderNumber}
                          </td>
                          <td className="p-4 text-stone-500 font-medium">
                            {new Date(order.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-stone-900">{order.customerName}</p>
                            <p className="text-[10px] text-stone-500">{order.customerEmail}</p>
                          </td>
                          <td className="p-4 text-stone-700 font-medium">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-bold text-stone-900">
                                {order.shippingAddress?.district || order.country || 'Colombo'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 block truncate max-w-[120px]">
                              {order.shippingAddress?.city || ''}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-stone-800">
                            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-stone-900">{formatCurrency(order.totalAmount)}</p>
                            {isCod && (
                              <p className="text-[10px] font-bold text-amber-700">
                                COD: {formatCurrency(order.amountToCollect ?? order.totalAmount)}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 ${
                                order.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.paymentStatus === 'COD_PENDING'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                  : order.paymentStatus === 'REFUNDED'
                                  ? 'bg-stone-100 text-stone-600 border border-stone-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span>{order.paymentStatus === 'COD_PENDING' ? 'COD Pending' : order.paymentStatus}</span>
                            </span>
                          </td>
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
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : order.status === 'PROCESSING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'CANCELLED'
                                  ? 'bg-stone-200 text-stone-700'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {order.status === 'PENDING_CONFIRMATION' ? 'Awaiting Confirm' : order.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleCopyCourierSummary(order)}
                                className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600"
                                title="Copy courier booking format"
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenOrder(order)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400 font-bold">
                        No orders match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ORDER DETAILS & FULFILLMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-heading font-black text-stone-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.paymentStatus === 'COD_PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Method: {selectedOrder.paymentMethod}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* COD Confirmation Alert if PENDING_CONFIRMATION */}
              {selectedOrder.status === 'PENDING_CONFIRMATION' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 text-xs">
                        Cash on Delivery Order Awaiting Confirmation
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Verify customer contact number ({selectedOrder.phone || selectedOrder.shippingAddress?.phone || 'No phone'}) before packing and assigning to courier.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmCodOrder}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md shrink-0 flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Order</span>
                  </button>
                </div>
              )}

              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Details</span>
                  </span>
                  <p className="font-bold text-stone-900 text-sm">{selectedOrder.customerName}</p>
                  <p className="text-xs text-stone-600">{selectedOrder.customerEmail}</p>
                  <p className="text-xs text-stone-800 font-mono font-bold">
                    Phone: {selectedOrder.phone || selectedOrder.shippingAddress?.phone || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Address</span>
                  </span>
                  <p className="font-bold text-stone-900 text-sm">{selectedOrder.shippingAddress.recipientName}</p>
                  <p className="text-xs text-stone-600">{selectedOrder.shippingAddress.street}</p>
                  <p className="text-xs text-stone-800 font-bold">
                    {selectedOrder.shippingAddress.city}, District: {selectedOrder.shippingAddress.district || 'Colombo'}
                  </p>
                  {selectedOrder.shippingAddress.deliveryInstructions && (
                    <p className="text-[11px] text-amber-800 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Note: {selectedOrder.shippingAddress.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Courier Information Card */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">
                      Courier Logistics
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {selectedOrder.courierDetails?.courierProvider || selectedOrder.carrier || 'Unassigned'}
                    </p>
                    {selectedOrder.courierDetails?.waybillNumber || selectedOrder.trackingNumber ? (
                      <p className="text-xs font-mono text-stone-600 flex items-center space-x-1">
                        <span>Waybill: {selectedOrder.courierDetails?.waybillNumber || selectedOrder.trackingNumber}</span>
                        {selectedOrder.courierDetails?.trackingUrl && (
                          <a
                            href={selectedOrder.courierDetails.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 italic">No waybill assigned yet</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyCourierSummary(selectedOrder)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-2xs flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy Summary</span>
                  </button>
                  <Link
                    href="/admin/shipping"
                    className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-2xs"
                  >
                    Manage in Shipping
                  </Link>
                </div>
              </div>

              {/* Ordered Products Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
                  Purchased Items ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between bg-white hover:bg-stone-50/50">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <Image
                            src={item.image || '/images/products/organic-onesie.jpg'}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs">{item.title}</p>
                          <p className="text-[10px] text-stone-500">
                            Color: <span className="font-semibold text-stone-700">{item.color || 'Standard'}</span> • Size:{' '}
                            <span className="font-semibold text-stone-700">{item.size || 'Regular'}</span>
                          </p>
                          <p className="text-[10px] text-stone-400">Unit Price: {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-600">Qty: {item.quantity}</span>
                        <p className="text-sm font-black text-stone-900">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown with COD details */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200/80 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Shipping Fee:</span>
                  <span className="font-bold">
                    {selectedOrder.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                {(selectedOrder.codHandlingFee ?? 0) > 0 && (
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>COD Handling Fee:</span>
                    <span className="font-bold">{formatCurrency(selectedOrder.codHandlingFee!)}</span>
                  </div>
                )}
                {(selectedOrder.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Discount:</span>
                    <span className="font-bold text-emerald-600">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="border-t border-stone-200 pt-2 flex justify-between text-xs text-stone-700 font-bold">
                  <span>Order Total:</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>

                {selectedOrder.paymentMethod === 'Cash on Delivery (COD)' && (
                  <div className="border-t-2 border-dashed border-amber-300 pt-2 mt-2 flex justify-between text-sm font-black text-amber-950 bg-amber-50/80 p-2 rounded-xl">
                    <span>Amount to Collect at Doorstep:</span>
                    <span className="text-amber-800">
                      {formatCurrency(selectedOrder.amountToCollect ?? selectedOrder.totalAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status & Fulfillment Management */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>Update Order Fulfilment</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-600 block mb-1">Order Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-900"
                    >
                      <option value="PENDING_CONFIRMATION">PENDING CONFIRMATION</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="READY_TO_SHIP">READY TO SHIP</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="RETURNED">RETURNED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-600 block mb-1">Carrier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. PromptX, Domex, Koombiyo"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-600 block mb-1">Tracking / Waybill #</label>
                    <input
                      type="text"
                      placeholder="e.g. PX-9842104"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleRefund}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                  >
                    Cancel / Refund Order
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveStatus}
                    className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Fulfilment Status'}
                  </button>
                </div>
              </div>

              {/* Order Timeline History */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
                    Order Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-amber-300 pl-4 ml-2">
                    {selectedOrder.timeline.map((t, idx) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900">{t.status}</span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(t.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-stone-600 text-[11px]">{t.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Internal Staff Notes</span>
                </h4>
                {selectedOrder.internalNotes && (
                  <div className="p-3 rounded-xl bg-stone-100 text-xs text-stone-700 whitespace-pre-line font-mono">
                    {selectedOrder.internalNotes}
                  </div>
                )}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note for staff..."
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-all"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
