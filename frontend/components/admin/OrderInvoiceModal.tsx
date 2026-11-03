'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Printer,
  Download,
  ArrowLeft,
  Check,
  Copy,
  Sparkles,
  Heart,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Truck,
  CreditCard,
  Building,
  Loader2,
} from 'lucide-react';
import type { OrderRecord } from '../../services/orderService';

interface OrderInvoiceModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(false);

  if (!isOpen || !order) return null;

  const invoiceNumber = `INV-${order.orderNumber}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const printDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formatLKR = (val: number | undefined | null) => {
    return `LKR ${(val ?? 0).toLocaleString('en-US')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FCFBF7',
        logging: false,
        windowWidth: 794, // Standard A4 96dpi pixel width
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`REXBEBE-Invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF invoice:', err);
      // Fallback to native print if canvas fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceNumber);
      setCopiedInvoiceNo(true);
      setTimeout(() => setCopiedInvoiceNo(false), 2000);
    }
  };

  const isCod = order.paymentMethod?.toLowerCase().includes('cash on delivery') ||
    order.paymentMethod?.toLowerCase().includes('cod');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Container */}
      <div className="relative w-full max-w-4xl flex flex-col my-auto">
        {/* ========================================================= */}
        {/* TOP ADMIN ACTION TOOLBAR (Hidden during print)            */}
        {/* ========================================================= */}
        <div className="no-print bg-white/95 backdrop-blur-md rounded-2xl p-4 mb-4 shadow-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-2 min-h-[46px] px-5 py-2.5 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Order</span>
            </button>
            <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-stone-200">
              <span className="text-xs font-bold text-stone-500">Invoice:</span>
              <button
                onClick={handleCopyInvoiceNumber}
                className="inline-flex items-center space-x-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#E8EFEA] text-[#2C5242] hover:bg-[#D5E4DB] transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>{invoiceNumber}</span>
                {copiedInvoiceNo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center space-x-2 min-h-[48px] px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5B7B6D] hover:bg-[#4A685B] shadow-md hover:shadow-lg disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 min-h-[48px] px-6 py-2.5 rounded-xl text-sm font-bold text-[#2C5242] bg-[#E8EFEA] hover:bg-[#D5E4DB] border border-[#BACFC2] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* A4 INVOICE SHEET (#rexbebe-printable-invoice)             */}
        {/* Follows Pastel Baby-Themed Palette:                       */}
        {/* Sage Green (#5B7B6D), Cream (#FCFBF7), Pink (#F7D6D8),   */}
        {/* Warm Oatmeal (#8C8275 / #F3EFEA)                         */}
        {/* ========================================================= */}
        <div className="overflow-x-auto flex justify-center pb-8">
          <div
            id="rexbebe-printable-invoice"
            ref={invoiceRef}
            className="w-[210mm] min-h-[297mm] bg-[#FCFBF7] text-[#2C3E35] p-8 sm:p-10 shadow-2xl rounded-2xl sm:rounded-3xl border border-[#E9E4DC] relative flex flex-col justify-between font-sans selection:bg-[#E8EFEA]"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Soft decorative top ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7A9A8B] via-[#EAA6B0] to-[#7A9A8B] rounded-t-2xl sm:rounded-t-3xl" />

            <div>
              {/* ---------------------------------------------------- */}
              {/* 1. INVOICE HEADER & BRAND DETAILS                    */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col sm:flex-row items-start justify-between pb-6 border-b-2 border-dashed border-[#DCD6CA] gap-6">
                {/* Brand & Boutique Identity */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-14 rounded-2xl bg-white p-1 border border-[#E0D9CE] shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/images/logo_clean.png"
                        alt="REXBEBE Boutique"
                        width={48}
                        height={48}
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-black tracking-tight text-[#284B3D] font-serif">REXBEBE</h1>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8EFEA] text-[#284B3D] border border-[#C5D8CC]">
                          Luxury Baby Boutique
                        </span>
                      </div>
                      <p className="text-[11px] text-[#697E73] font-medium">Classen Holdings (Pvt) Ltd</p>
                    </div>
                  </div>

                  {/* Store Details */}
                  <div className="text-[11px] text-[#55695F] space-y-0.5 pt-1">
                    <p className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-[#7A9A8B] shrink-0" />
                      <span>62B Meniklanda, Pepiliyawala, Sri Lanka</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-[#7A9A8B] shrink-0" />
                      <span>+94 70 530 1642 • WhatsApp Official</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Mail className="w-3 h-3 text-[#7A9A8B] shrink-0" />
                      <span>info@classen.lk • www.rexbebe.com</span>
                    </p>
                  </div>
                </div>

                {/* Invoice Meta Box (Pastel Pill Card) */}
                <div className="bg-[#F4F1EA] rounded-2xl p-4 border border-[#E2DDD3] space-y-2 text-right self-stretch sm:self-auto sm:min-w-[220px]">
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7A9A8B]">TAX INVOICE</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#7A9A8B]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-black font-mono text-[#284B3D]">{invoiceNumber}</p>
                    <p className="text-xs text-[#55695F] font-medium">Order Ref: #{order.orderNumber}</p>
                    <div className="pt-1 text-[11px] text-[#697E73] space-y-0.5">
                      <p>
                        <span className="font-semibold text-[#3C5045]">Order Date:</span> {orderDate}
                      </p>
                      <p>
                        <span className="font-semibold text-[#3C5045]">Issued Date:</span> {printDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 2. CUSTOMER & DELIVERY ADDRESS CARDS                */}
              {/* ---------------------------------------------------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                {/* Billed To */}
                <div className="bg-white/80 rounded-2xl p-4 border border-[#E9E4DC] shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#F0EBE3] pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A9A8B] flex items-center space-x-1">
                      <span>🌸 Billed To / Customer</span>
                    </span>
                    <span className="text-[10px] text-[#8C8275] font-semibold">Verified Shopper</span>
                  </div>
                  <div className="text-xs space-y-1 text-[#33463C]">
                    <p className="font-bold text-[#1F332A] text-sm">{order.customerName}</p>
                    <p className="text-[#55695F] flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-[#7A9A8B]" />
                      <span>{order.phone || order.shippingAddress?.phone || 'N/A'}</span>
                    </p>
                    <p className="text-[#55695F] flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-[#7A9A8B]" />
                      <span>{order.customerEmail}</span>
                    </p>
                  </div>
                </div>

                {/* Delivery / Shipping Destination */}
                <div className="bg-white/80 rounded-2xl p-4 border border-[#E9E4DC] shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#F0EBE3] pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A9A8B] flex items-center space-x-1">
                      <span>📦 Deliver To / Parcel Recipient</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#5B7B6D] bg-[#E8EFEA] px-2 py-0.5 rounded-full">
                      {order.shippingAddress?.district || 'Sri Lanka'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-[#33463C]">
                    <p className="font-bold text-[#1F332A]">
                      {order.shippingAddress?.recipientName || order.customerName}
                    </p>
                    <p className="text-[#55695F]">{order.shippingAddress?.street}</p>
                    <p className="text-[#55695F] font-medium">
                      {order.shippingAddress?.city}
                      {order.shippingAddress?.postalCode ? ` (${order.shippingAddress.postalCode})` : ''},{' '}
                      {order.shippingAddress?.district || 'Western Province'}
                    </p>
                    {order.courierDetails?.waybillNumber && (
                      <p className="text-[11px] font-mono font-bold text-[#284B3D] pt-0.5">
                        🚚 Waybill #{order.courierDetails.waybillNumber} ({order.courierDetails.courierProvider || 'Koombiyo'})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 3. PURCHASED BOUTIQUE ITEMS TABLE                    */}
              {/* ---------------------------------------------------- */}
              <div className="rounded-2xl border border-[#E2DDD3] overflow-hidden bg-white shadow-xs mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3EFE8] text-[#33463C] text-[10px] font-black uppercase tracking-wider border-b border-[#E2DDD3]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Item Details</th>
                      <th className="py-2.5 px-3 text-center">Size & Color</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE3] text-xs text-[#2C3E35]">
                    {order.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[#FCFBF7] transition-colors">
                        <td className="py-3 px-3 text-center text-[#8C8275] font-bold text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            {item.image && (
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#F3EFE8] border border-[#E2DDD3] shrink-0 relative">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#1F332A] text-xs leading-snug">{item.title}</p>
                              {item.partName && (
                                <p className="text-[10px] text-[#7A9A8B] font-medium">{item.partName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-[11px]">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#4A5D52] font-semibold">
                            {item.size || 'Regular'} / {item.color || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-xs">{item.quantity}</td>
                        <td className="py-3 px-3 text-right text-xs text-[#4A5D52] font-mono">
                          {formatLKR(item.price)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-xs text-[#1F332A] font-mono">
                          {formatLKR(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 4. PAYMENT STATUS & FINANCIAL SUMMARY BREAKDOWN     */}
              {/* ---------------------------------------------------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mb-6">
                {/* Left: Payment Method & Terms Card */}
                <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#E9E4DC] space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A9A8B]">
                      Payment & Fulfilment
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#33463C]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#697E73]">Payment Method:</span>
                      <span className="font-bold text-[#1F332A]">{order.paymentMethod}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#697E73]">Payment Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? '✓ PAID' : 'COD - PENDING PAYMENT'}
                      </span>
                    </div>

                    {isCod && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
                        <p className="font-bold flex items-center space-x-1">
                          <span>💵 Cash on Delivery Notice:</span>
                        </p>
                        <p className="mt-0.5">
                          Please collect exact cash amount of{' '}
                          <span className="font-black underline">
                            {formatLKR(order.amountToCollect ?? order.totalAmount)}
                          </span>{' '}
                          from recipient at doorstep.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Calculations Breakdown */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2DDD3] shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between text-[#55695F]">
                    <span>Item Subtotal:</span>
                    <span className="font-mono font-bold text-[#2C3E35]">{formatLKR(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#55695F]">
                    <span>Delivery Fee:</span>
                    <span className="font-mono font-bold text-[#2C3E35]">
                      {order.shippingFee === 0 ? 'FREE' : formatLKR(order.shippingFee)}
                    </span>
                  </div>

                  {(order.codHandlingFee ?? 0) > 0 && (
                    <div className="flex justify-between text-[#55695F]">
                      <span>COD Handling Fee:</span>
                      <span className="font-mono font-bold text-[#2C3E35]">{formatLKR(order.codHandlingFee!)}</span>
                    </div>
                  )}

                  {(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Boutique Discount:</span>
                      <span className="font-mono font-bold">-{formatLKR(order.discount)}</span>
                    </div>
                  )}

                  {/* Final Total Amount */}
                  <div className="border-t-2 border-dashed border-[#DCD6CA] pt-2 mt-2 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-black text-[#1F332A] uppercase tracking-wider block">
                        Final Total Amount
                      </span>
                      <span className="text-[10px] text-[#7A9A8B] font-medium">All local taxes included</span>
                    </div>
                    <span className="text-xl font-black font-mono text-[#284B3D]">
                      {formatLKR(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 5. CUTE TEDDY BEAR ILLUSTRATIONS & FOOTER THANK YOU  */}
            {/* ---------------------------------------------------- */}
            <div className="pt-6 border-t-2 border-dashed border-[#DCD6CA] space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Cute Teddy Bear & Boutique Greeting */}
                <div className="flex items-center space-x-3 text-center sm:text-left">
                  {/* Cute SVG Teddy Bear Illustration */}
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-[#F4F1EA] rounded-2xl border border-[#E2DDD3]">
                    <svg viewBox="0 0 64 64" className="w-11 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Teddy Ears */}
                      <circle cx="16" cy="18" r="8" fill="#C4A482" />
                      <circle cx="16" cy="18" r="4.5" fill="#F7D6D8" />
                      <circle cx="48" cy="18" r="8" fill="#C4A482" />
                      <circle cx="48" cy="18" r="4.5" fill="#F7D6D8" />
                      {/* Teddy Head */}
                      <circle cx="32" cy="28" r="18" fill="#D2B48C" />
                      {/* Eyes */}
                      <circle cx="25" cy="25" r="2.5" fill="#2C1810" />
                      <circle cx="39" cy="25" r="2.5" fill="#2C1810" />
                      <circle cx="26" cy="24" r="0.8" fill="#FFFFFF" />
                      <circle cx="40" cy="24" r="0.8" fill="#FFFFFF" />
                      {/* Rosy Cheeks */}
                      <ellipse cx="21" cy="30" rx="3.5" ry="2" fill="#F7D6D8" opacity="0.8" />
                      <ellipse cx="43" cy="30" rx="3.5" ry="2" fill="#F7D6D8" opacity="0.8" />
                      {/* Snout & Nose */}
                      <ellipse cx="32" cy="31" rx="7" ry="5.5" fill="#FCFBF7" />
                      <path d="M29.5 29.5C29.5 28.5 34.5 28.5 34.5 29.5L32 32.5L29.5 29.5Z" fill="#5A3825" />
                      <path d="M32 32.5V34.5M30 34.5C31 35.5 33 35.5 34 34.5" stroke="#5A3825" strokeWidth="1.2" strokeLinecap="round" />
                      {/* Pastel Bow Tie */}
                      <path d="M26 44L32 47L26 50Z" fill="#7A9A8B" />
                      <path d="M38 44L32 47L38 50Z" fill="#7A9A8B" />
                      <circle cx="32" cy="47" r="2" fill="#F7D6D8" />
                      {/* Little Stars */}
                      <path d="M52 10L53 12L55 13L53 14L52 16L51 14L49 13L51 12Z" fill="#F4B251" />
                      <path d="M11 36L12 37.5L13.5 38.5L12 39.5L11 41L10 39.5L8.5 38.5L10 37.5Z" fill="#EAA6B0" />
                    </svg>
                  </div>

                  <div>
                    <p className="font-bold text-[#1F332A] text-xs flex items-center space-x-1 justify-center sm:justify-start">
                      <span>Thank you for shopping with REXBEBE!</span>
                      <Heart className="w-3 h-3 text-[#EAA6B0] inline fill-current" />
                    </p>
                    <p className="text-[11px] text-[#697E73] max-w-sm">
                      Handcrafted with organic certified baby-safe materials for your little one 🦕🧸✨
                    </p>
                  </div>
                </div>

                {/* Boutique Authentication Stamp */}
                <div className="border border-[#DCD6CA] rounded-xl px-3 py-1.5 bg-white text-center sm:text-right shrink-0">
                  <span className="text-[9px] uppercase font-bold text-[#7A9A8B] tracking-wider block">
                    REXBEBE Atelier Package Slip
                  </span>
                  <span className="text-[10px] font-mono text-[#55695F]">Commercial Copy • Original</span>
                </div>
              </div>

              {/* Bottom Micro Print */}
              <div className="text-[9px] text-[#8C8275] text-center pt-2 border-t border-[#F0EBE3] flex flex-wrap justify-between gap-2">
                <span>Carefully packed with love and boutique quality inspection.</span>
                <span>For support & inquiries: WhatsApp +94 70 530 1642 • support@rexbebe.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded High-Resolution A4 Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide all outer UI, body scrollbars and background clutter */
          body * {
            visibility: hidden !important;
          }
          #rexbebe-printable-invoice,
          #rexbebe-printable-invoice * {
            visibility: visible !important;
          }
          #rexbebe-printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background-color: #FCFBF7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

