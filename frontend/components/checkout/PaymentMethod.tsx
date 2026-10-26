import React from 'react';
import { CreditCard, ShieldCheck, Banknote, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

interface PaymentMethodProps {
  selectedMethod: 'CASH_ON_DELIVERY' | 'PAYHERE';
  onSelect: (method: 'CASH_ON_DELIVERY' | 'PAYHERE') => void;
  codHandlingFee?: number;
  isCodAvailable?: boolean;
  codNotice?: string;
  amountToCollect?: number;
}

export function PaymentMethod({
  selectedMethod,
  onSelect,
  codHandlingFee = 0,
  isCodAvailable = true,
  codNotice,
  amountToCollect,
}: PaymentMethodProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
      <div className="flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <h3 className="font-serif text-xl font-medium text-stone-900">
          2. Select Payment Method
        </h3>
        <span className="flex items-center space-x-1 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified &amp; Secure Checkout</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* Cash on Delivery (COD) Option */}
        <label
          onClick={() => {
            if (isCodAvailable) onSelect('CASH_ON_DELIVERY');
          }}
          className={`block p-4 sm:p-5 rounded-2xl border transition-all ${
            !isCodAvailable
              ? 'opacity-60 cursor-not-allowed bg-stone-50 border-stone-200'
              : selectedMethod === 'CASH_ON_DELIVERY'
              ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-400/30 cursor-pointer shadow-xs'
              : 'border-stone-200 hover:border-stone-300 cursor-pointer bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedMethod === 'CASH_ON_DELIVERY'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Pay at Doorstep
                  </span>
                </div>
                {/* MANDATORY USER NOTICE */}
                <p className="text-xs font-semibold text-brand-800">
                  Pay in cash when your order is delivered to your doorstep.
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  No advance online payment required. Pay our courier in cash upon receiving your packaged parcel. Our concierge team may phone your mobile to verify address details before dispatch.
                </p>
                {codHandlingFee > 0 && (
                  <p className="text-[11px] font-semibold text-stone-700">
                    COD Handling Fee: {formatCurrency(codHandlingFee)}
                  </p>
                )}
                {selectedMethod === 'CASH_ON_DELIVERY' && amountToCollect !== undefined && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center space-x-1.5">
                      <Truck className="w-4 h-4 text-amber-700" />
                      <span>Amount Payable at Delivery:</span>
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {formatCurrency(amountToCollect)}
                    </span>
                  </div>
                )}
                {!isCodAvailable && codNotice && (
                  <div className="mt-2 text-[11px] text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{codNotice}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-1">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'CASH_ON_DELIVERY'}
                disabled={!isCodAvailable}
                readOnly
                className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </label>

        {/* PayHere Sri Lanka Gateway Option */}
        <label
          onClick={() => onSelect('PAYHERE')}
          className={`block p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'PAYHERE'
              ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-400/30 shadow-xs'
              : 'border-stone-200 hover:border-stone-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedMethod === 'PAYHERE'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-stone-900">PayHere Sri Lanka Gateway</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Instant Online
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  Visa, Mastercard, AMEX, eZ Cash, Frimi, Sampath Vishwa
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Pay securely online using credit/debit card or Sri Lankan mobile wallets. Immediate payment verification.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'PAYHERE'}
                readOnly
                className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
