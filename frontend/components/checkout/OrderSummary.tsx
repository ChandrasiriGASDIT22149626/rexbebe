import React from 'react';
import Image from 'next/image';
import { CartItemState } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { Truck, ShieldCheck, Sparkles } from 'lucide-react';

export function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  codHandlingFee = 0,
  discount = 0,
  total,
  amountToCollect,
  isCod = false,
  district = 'Colombo',
  town,
  zoneName,
  requiresDeliveryReview = false,
  estimatedDays,
}: {
  items: CartItemState[];
  subtotal: number;
  deliveryFee: number;
  codHandlingFee?: number;
  discount?: number;
  total: number;
  amountToCollect?: number;
  isCod?: boolean;
  district?: string;
  town?: string;
  zoneName?: string;
  requiresDeliveryReview?: boolean;
  estimatedDays?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="font-serif text-xl font-medium text-stone-900">
          3. Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h3>
        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
          {district} Delivery
        </span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.variant.id} className="flex items-center space-x-3 text-xs py-1">
            <div className="relative w-12 h-12 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
              <Image
                src={item.variant.imageUrl || item.product.images[0]?.url || '/images/products/organic-onesie.jpg'}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 truncate">
                {item.variant.partName ? `${item.product.name} (${item.variant.partName})` : item.product.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-stone-500 mt-0.5">
                {item.variant.size && (
                  <span>Size: <strong className="font-semibold text-stone-800">{item.variant.size}</strong></span>
                )}
                {item.variant.color && (
                  <span>Colour: <strong className="font-semibold text-stone-800">{item.variant.color}</strong></span>
                )}
                <span>Qty: <strong className="font-semibold text-stone-800">{item.quantity}</strong></span>
              </div>
            </div>
            <span className="font-bold text-stone-900 shrink-0">
              {formatCurrency(item.variant.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-xs pt-3 border-t border-stone-100 text-stone-600">
        <div className="flex justify-between">
          <span>Product Subtotal</span>
          <span className="font-semibold text-stone-900">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Promotional Discount</span>
            </span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-stone-800">
              Delivery Fee ({district})
            </div>
            {zoneName && (
              <span className="block text-[10px] text-amber-800 font-bold">
                {zoneName}
              </span>
            )}
            {estimatedDays && (
              <span className="block text-[10px] text-stone-400 font-normal">{estimatedDays}</span>
            )}
          </div>
          <div className="text-right">
            {requiresDeliveryReview ? (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pending Concierge Review
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">
                {deliveryFee === 0 ? 'FREE DELIVERY' : formatCurrency(deliveryFee)}
              </span>
            )}
          </div>
        </div>

        {isCod && codHandlingFee > 0 && (
          <div className="flex justify-between">
            <span>COD Handling Fee</span>
            <span className="font-semibold text-stone-900">{formatCurrency(codHandlingFee)}</span>
          </div>
        )}

        {/* Final Amount Payable */}
        <div className="pt-3 border-t border-stone-200">
          <div className="flex justify-between items-baseline text-sm font-bold text-stone-900">
            <span>{isCod ? 'Payable at Delivery (COD)' : 'Total Amount'}</span>
            <span className="text-base text-brand-700 font-black">
              {formatCurrency(isCod && amountToCollect !== undefined ? amountToCollect : total)}
            </span>
          </div>

          {isCod && (
            <p className="text-[10px] text-amber-800 bg-amber-50/70 p-2 rounded-lg mt-2 font-medium border border-amber-200/60 flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Please keep cash ready for courier handoff.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
