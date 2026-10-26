'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import {
  CheckCircle,
  Package,
  Truck,
  Banknote,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowRight,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { orderService, OrderRecord, CourierDeliveryStatus } from '../../../services/orderService';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderSuccessPage() {
  const routeParams = useParams();
  const rawId = (routeParams?.id as string) || '';
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      if (!rawId) {
        setLoading(false);
        return;
      }
      try {
        const found = await orderService.getOrderById(rawId);
        if (isMounted) setOrder(found);
      } catch (err) {
        console.warn('Could not fetch order from backend:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [rawId]);

  const isCod =
    order?.paymentMethod === 'CASH_ON_DELIVERY' ||
    order?.paymentMethod?.toLowerCase().includes('cash');

  const amountToPay =
    order?.amountToCollect !== undefined ? order.amountToCollect : order?.totalAmount || 0;

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber || rawId) {
      navigator.clipboard.writeText(order?.orderNumber || rawId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Header />
      <main className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold tracking-widest uppercase text-brand-600">
              {isCod ? 'Cash on Delivery Order Placed' : 'Order Confirmed & Verified'}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl text-stone-900 font-normal">
              Thank You for Shopping with REXBEBE
            </h1>
          </div>

          <p className="text-stone-600 text-sm max-w-xl mx-auto leading-relaxed">
            Your luxury babywear order{' '}
            <button
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center space-x-1 font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors"
              title="Click to copy order number"
            >
              <span>#{order?.orderNumber || rawId}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
            </button>{' '}
            has been placed and verified by our backend server.
          </p>

          {/* Prominent COD Notice (Mandatory Requirement) */}
          {isCod && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-left max-w-xl mx-auto space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <Banknote className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Pay in cash when your order is delivered to your doorstep.</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Please prepare exact cash of <strong className="font-black text-stone-900">{formatCurrency(amountToPay)}</strong> for the courier agent upon arrival. Our concierge team will phone your mobile to confirm delivery details before dispatch.
              </p>
            </div>
          )}
        </div>

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Details: Status & Address */}
          <div className="md:col-span-7 space-y-6">
            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 text-xs">
              <h3 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-2">
                Order &amp; Payment Status
              </h3>

              <div className={`grid ${isCod ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Order Status
                  </span>
                  <span className="font-bold text-stone-900 text-xs flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-brand-600" />
                    <span>
                      {order?.status === 'PENDING_CONFIRMATION'
                        ? 'Pending Confirmation'
                        : order?.status || 'Pending Confirmation'}
                    </span>
                  </span>
                </div>

                {isCod && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">
                      COD Collection Status
                    </span>
                    <span className="font-bold text-amber-900 text-xs flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {order?.codCollectionStatus === 'COLLECTED' || order?.courierDetails?.codCollectionStatus === 'COLLECTED'
                          ? 'Collected'
                          : 'Collection Pending'}
                      </span>
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Payment Status
                  </span>
                  <span
                    className={`font-bold text-xs flex items-center space-x-1 ${
                      order?.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>
                      {order?.paymentStatus === 'PAID'
                        ? 'PAID'
                        : isCod
                        ? 'COD Pending (Unpaid)'
                        : 'PENDING'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Enhanced Courier & Delivery Logistics Component */}
              {(() => {
                const carrier = order?.carrier || order?.courierDetails?.courierProvider || 'Koombiyo Delivery';
                const trackingNum = order?.trackingNumber || order?.courierDetails?.waybillNumber;
                const rawDeliveryStatus = (order?.courierDetails?.deliveryStatus || 'NOT_BOOKED') as CourierDeliveryStatus;
                const isKoombiyo = carrier.toLowerCase().includes('koombiyo');
                const trackingUrl =
                  order?.courierDetails?.trackingUrl ||
                  (trackingNum && isKoombiyo ? `https://koombiyodelivery.lk/track/${encodeURIComponent(trackingNum)}` : undefined);

                const getStatusInfo = (status: CourierDeliveryStatus) => {
                  switch (status) {
                    case 'READY_FOR_PICKUP':
                      return {
                        label: 'Ready for Courier Pickup',
                        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        desc: 'Your luxury babywear package is packed and awaiting courier driver collection.',
                        step: 1,
                      };
                    case 'PICKED_UP':
                      return {
                        label: 'Picked Up by Courier',
                        badge: 'bg-blue-50 text-blue-700 border-blue-200',
                        desc: `Package picked up from REXBEBE warehouse by ${carrier} rider.`,
                        step: 2,
                      };
                    case 'IN_TRANSIT':
                      return {
                        label: 'In Transit',
                        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                        desc: `Package is travelling through ${carrier}'s sorting and distribution network.`,
                        step: 3,
                      };
                    case 'OUT_FOR_DELIVERY':
                      return {
                        label: 'Out for Delivery',
                        badge: 'bg-amber-50 text-amber-800 border-amber-200',
                        desc: 'Courier rider is en route to your doorstep. Please ensure recipient is available.',
                        step: 4,
                      };
                    case 'DELIVERY_ATTEMPT_FAILED':
                      return {
                        label: 'Delivery Attempted — Rescheduling',
                        badge: 'bg-rose-50 text-rose-700 border-rose-200',
                        desc: 'The courier attempted delivery today. Our dispatch team is rescheduling delivery with you.',
                        step: 3,
                      };
                    case 'DELIVERED':
                      return {
                        label: 'Delivered',
                        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        desc: 'Package successfully delivered and received.',
                        step: 5,
                      };
                    case 'RETURNING_TO_SENDER':
                      return {
                        label: 'Returning to Sender',
                        badge: 'bg-orange-50 text-orange-700 border-orange-200',
                        desc: 'Package is being returned to the REXBEBE fulfillment center.',
                        step: -1,
                      };
                    case 'RETURNED_TO_SENDER':
                      return {
                        label: 'Returned to Warehouse',
                        badge: 'bg-stone-100 text-stone-700 border-stone-200',
                        desc: 'Package has been received back at our warehouse.',
                        step: -1,
                      };
                    case 'NOT_BOOKED':
                    default:
                      return {
                        label: order?.status === 'CONFIRMED' ? 'Confirmed — Booking Courier' : 'Order Confirmed',
                        badge: 'bg-stone-100 text-stone-700 border-stone-200',
                        desc: 'Order verified. Packaging and dispatch booking in progress.',
                        step: 0,
                      };
                  }
                };

                const statusInfo = getStatusInfo(rawDeliveryStatus);

                const steps = [
                  { label: 'Placed', step: 0 },
                  { label: 'Ready for Pickup', step: 1 },
                  { label: 'Picked Up', step: 2 },
                  { label: 'In Transit', step: 3 },
                  { label: 'Out for Delivery', step: 4 },
                  { label: 'Delivered', step: 5 },
                ];

                return (
                  <div className="pt-3 border-t border-stone-100 space-y-4">
                    {/* Header: Carrier & Tracking */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-stone-200 flex items-center justify-center text-brand-600 shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">{carrier}</span>
                            {isKoombiyo && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                                Courier Partner
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {trackingNum ? (
                              <span className="inline-flex items-center space-x-1.5 font-mono text-stone-700">
                                <span>Waybill:</span>
                                <strong className="text-stone-900">#{trackingNum}</strong>
                              </span>
                            ) : (
                              'Waybill will be assigned upon pickup dispatch'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Tracking CTA */}
                      {trackingNum && (
                        <div className="flex items-center space-x-2">
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-brand-700 bg-white hover:bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-200 shadow-xs transition-colors"
                            >
                              <span>Track on {isKoombiyo ? 'Koombiyo' : 'Courier'}</span>
                              <ExternalLink className="w-3 h-3 text-brand-600" />
                            </a>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Prominent Delivery Status Badge & Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          Current Delivery Milestone
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-100">
                        {statusInfo.desc}
                      </p>
                    </div>

                    {/* Progress Pipeline */}
                    {statusInfo.step >= 0 && (
                      <div className="py-2">
                        <div className="grid grid-cols-6 gap-1 text-center">
                          {steps.map((st, i) => {
                            const isCompleted = statusInfo.step >= st.step;
                            const isCurrent = statusInfo.step === st.step;
                            return (
                              <div key={st.label} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full transition-colors ${
                                    isCurrent
                                      ? 'bg-brand-600'
                                      : isCompleted
                                      ? 'bg-emerald-500'
                                      : 'bg-stone-200'
                                  }`}
                                />
                                <span
                                  className={`text-[9px] block leading-tight ${
                                    isCurrent
                                      ? 'font-bold text-brand-700'
                                      : isCompleted
                                      ? 'font-semibold text-stone-800'
                                      : 'text-stone-400'
                                  }`}
                                >
                                  {st.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recorded Dates & Notes */}
                    {(order?.courierDetails?.pickupDate ||
                      order?.courierDetails?.expectedDeliveryDate ||
                      order?.courierDetails?.deliveredDate) && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 bg-stone-50/50 p-2 rounded-lg border border-stone-100">
                        {order.courierDetails.pickupDate && (
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>Pickup: <strong className="text-stone-800">{order.courierDetails.pickupDate}</strong></span>
                          </div>
                        )}
                        {order.courierDetails.expectedDeliveryDate && (
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>Estimated: <strong className="text-stone-800">{order.courierDetails.expectedDeliveryDate}</strong></span>
                          </div>
                        )}
                        {order.courierDetails.deliveredDate && (
                          <div className="flex items-center space-x-1.5 col-span-2 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Delivered on: <strong className="text-emerald-900">{new Date(order.courierDetails.deliveredDate).toLocaleDateString()}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Delivery Address */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3 text-xs">
              <h3 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
                <span>Delivery Address</span>
                <MapPin className="w-4 h-4 text-brand-600" />
              </h3>

              <div className="space-y-1 text-stone-700">
                <p className="font-bold text-stone-900 text-sm">
                  {order?.shippingAddress?.recipientName || order?.customerName || 'Elena Silva'}
                </p>
                <p className="flex items-center space-x-1.5 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{order?.shippingAddress?.phone || order?.phone || '+94 77 123 4567'}</span>
                </p>
                <p className="pt-1">
                  {order?.shippingAddress?.street || '45 Park Avenue, Suite 12'}
                </p>
                <p>
                  {order?.shippingAddress?.city || 'Colombo'},{' '}
                  <strong className="text-stone-900 font-semibold">
                    {order?.shippingAddress?.district || 'Colombo'} District
                  </strong>
                </p>
                <p className="text-stone-500">
                  {order?.shippingAddress?.country || 'Sri Lanka'}
                </p>
                {order?.shippingAddress?.deliveryInstructions && (
                  <p className="pt-2 text-[11px] text-amber-900 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    Note: &ldquo;{order.shippingAddress.deliveryInstructions}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary: Financials & Items */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 text-xs">
              <h3 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-2">
                Payment Summary
              </h3>

              <div className="space-y-2 text-stone-600">
                <div className="flex justify-between">
                  <span>Product Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(order?.subtotal || 13500)}
                  </span>
                </div>

                {order?.discount ? (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>−{formatCurrency(order.discount)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-start">
                  <div>
                    <span>
                      Delivery ({order?.shippingAddress?.district || 'Colombo'})
                    </span>
                    {order?.deliveryZoneSnapshot?.zoneName && (
                      <span className="block text-[10px] text-amber-800 font-bold">
                        {order.deliveryZoneSnapshot.zoneName}
                      </span>
                    )}
                  </div>
                  <div>
                    {order?.requiresDeliveryReview ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Review Pending
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-700">
                        {(order?.shippingFee ?? 500) === 0 ? 'FREE' : formatCurrency(order?.shippingFee ?? 500)}
                      </span>
                    )}
                  </div>
                </div>

                {isCod && (order?.codHandlingFee ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>COD Handling Fee</span>
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(order?.codHandlingFee ?? 0)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
                  <span>{isCod ? 'Payable at Delivery' : 'Total Paid'}</span>
                  <span className="text-base text-brand-700 font-black">
                    {formatCurrency(amountToPay)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              {order?.items && order.items.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Ordered Garments ({order.items.length})
                  </span>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 py-1 text-xs">
                      <div className="relative w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
                        <Image
                          src={item.image || '/images/products/organic-onesie.jpg'}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 truncate">{item.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-stone-500 mt-0.5">
                          {item.size && <span>Size: <strong className="text-stone-700 font-medium">{item.size}</strong></span>}
                          {item.color && <span>Colour: <strong className="text-stone-700 font-medium">{item.color}</strong></span>}
                          <span>Qty: <strong className="text-stone-700 font-medium">{item.quantity}</strong></span>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <Link href="/shop" className="flex-1">
                <Button variant="primary" className="w-full flex items-center justify-center space-x-1 text-xs py-3">
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                title="Print Order Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
