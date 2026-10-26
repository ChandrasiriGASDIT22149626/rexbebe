import React, { useState, useEffect, useMemo } from 'react';
import { SRI_LANKA_DISTRICTS, deliveryService, DeliveryZone, PricingCalculationResult } from '../../services/deliveryService';
import { MapPin, Phone, User, Mail, Home, Clock, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface DeliveryFormProps {
  values: {
    recipientName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    district: string;
    postalCode?: string;
    deliveryInstructions?: string;
  };
  onChange: (vals: any) => void;
  pricing?: PricingCalculationResult | null;
  estimatedDays?: string;
}

export function DeliveryForm({ values, onChange, pricing, estimatedDays }: DeliveryFormProps) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);

  useEffect(() => {
    setIsLoadingZones(true);
    deliveryService
      .getZones()
      .then((data) => {
        setZones(data || []);
      })
      .catch((err) => {
        console.error('Failed to load delivery zones:', err);
      })
      .finally(() => {
        setIsLoadingZones(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange({ ...values, [e.target.name]: e.target.value });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    onChange({
      ...values,
      district: newDistrict,
    });
  };

  const handleSelectTown = (townName: string) => {
    onChange({
      ...values,
      city: townName,
    });
  };

  // Filter relevant zones for selected district
  const districtZones = useMemo(() => {
    const cleanDist = (values.district || '').trim().toLowerCase();
    if (cleanDist === 'gampaha') {
      return zones.filter((z) => z.active && z.district.toLowerCase() === 'gampaha');
    }
    // For non-Gampaha districts, return Outstation and any zone that contains district
    return zones.filter(
      (z) =>
        z.active &&
        (z.code === 'OUTSTATION' ||
          z.district.toLowerCase() === cleanDist ||
          z.district.toLowerCase() === 'all')
    );
  }, [zones, values.district]);

  // Extract all town suggestions for datalist
  const allSuggestedTowns = useMemo(() => {
    const list: { town: string; zoneName: string; fee: number }[] = [];
    districtZones.forEach((z) => {
      z.towns.forEach((t) => {
        if (!list.some((item) => item.town.toLowerCase() === t.toLowerCase())) {
          list.push({ town: t, zoneName: z.name, fee: z.deliveryFee });
        }
      });
    });
    return list;
  }, [districtZones]);

  // Quick suggestion chips (first 8 prominent towns)
  const popularTowns = useMemo(() => {
    return allSuggestedTowns.slice(0, 8);
  }, [allSuggestedTowns]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="font-serif text-xl font-medium text-stone-900 flex items-center space-x-2">
          <span>1. Shipping &amp; Delivery Address</span>
        </h3>
        {estimatedDays && (
          <span className="flex items-center space-x-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{estimatedDays}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Recipient Name */}
        <div>
          <label htmlFor="checkout-recipient-name" className="block text-stone-700 font-semibold mb-1 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <span>Full Recipient Name <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="checkout-recipient-name"
            type="text"
            name="recipientName"
            value={values.recipientName}
            onChange={handleChange}
            placeholder="e.g. Elena Silva"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        {/* Mobile Phone */}
        <div>
          <label htmlFor="checkout-phone" className="block text-stone-700 font-semibold mb-1 flex items-center space-x-1">
            <Phone className="w-3.5 h-3.5 text-stone-400" />
            <span>Mobile Phone Number <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="checkout-phone"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            placeholder="e.g. +94 77 123 4567 or 0771234567"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />
          <p className="text-[10px] text-stone-400 mt-1">Our courier will call this number before delivery arrival</p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="checkout-email" className="block text-stone-700 font-semibold mb-1 flex items-center space-x-1">
            <Mail className="w-3.5 h-3.5 text-stone-400" />
            <span>Email Address <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="checkout-email"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="elena@example.com"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        {/* District Selector (Determines Delivery Zone & Fee) */}
        <div>
          <label htmlFor="checkout-district" className="block text-stone-700 font-semibold mb-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>Delivery District <span className="text-rose-500">*</span></span>
          </label>
          <select
            id="checkout-district"
            name="district"
            value={values.district || 'Colombo'}
            onChange={handleDistrictChange}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            required
          >
            {SRI_LANKA_DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {dist} District {dist === 'Gampaha' ? '(Special Zone Rates Available)' : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-stone-400 mt-1">
            {values.district === 'Gampaha'
              ? 'Gampaha rates: Nearby towns LKR 400 • Other towns LKR 450'
              : 'Outstation delivery rate: LKR 500'}
          </p>
        </div>

        {/* City / Town with Autocomplete / Zone matching */}
        <div className="sm:col-span-2">
          <label htmlFor="checkout-city" className="block text-stone-700 font-semibold mb-1 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>City / Town (Delivery Zone) <span className="text-rose-500">*</span></span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">Select or type your town</span>
          </label>

          <input
            id="checkout-city"
            type="text"
            name="city"
            list="checkout-town-suggestions"
            value={values.city}
            onChange={handleChange}
            placeholder={
              values.district === 'Gampaha'
                ? 'e.g. Wattala, Ja-Ela, Kadawatha, Minuwangoda, Negombo...'
                : 'e.g. Kandy, Galle, Kurunegala, Colombo 03...'
            }
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />

          <datalist id="checkout-town-suggestions">
            {allSuggestedTowns.map((item) => (
              <option key={item.town} value={item.town}>
                {item.town} — {item.zoneName} (LKR {item.fee})
              </option>
            ))}
          </datalist>

          {/* Quick Town Selection Chips */}
          {popularTowns.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-400">Quick Select:</span>
              {popularTowns.map((item) => (
                <button
                  key={item.town}
                  type="button"
                  onClick={() => handleSelectTown(item.town)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    values.city.toLowerCase() === item.town.toLowerCase()
                      ? 'bg-amber-800 text-white border-amber-900 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {item.town}
                </button>
              ))}
            </div>
          )}

          {/* Live Delivery Zone Resolution Feedback */}
          {values.city.trim() && (
            <div className="mt-2.5">
              {pricing?.requiresDeliveryReview ? (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Unmapped Town — Concierge Review Required</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      "{values.city}" is not currently in a pre-configured delivery zone. Per store policy, our concierge team will review delivery options and confirm before dispatch. No arbitrary fee will be guessed.
                    </p>
                  </div>
                </div>
              ) : pricing?.zoneName ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">{pricing.zoneName}</span>
                      <span className="text-[11px] text-emerald-700 block">
                        Estimated arrival: {pricing.estimatedDays}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Delivery Charge</span>
                    <span className="text-sm font-black text-emerald-800">
                      {pricing.deliveryFee === 0 ? 'FREE' : `LKR ${pricing.deliveryFee}`}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Street Address */}
        <div className="sm:col-span-2">
          <label htmlFor="checkout-street" className="block text-stone-700 font-semibold mb-1 flex items-center space-x-1">
            <Home className="w-3.5 h-3.5 text-stone-400" />
            <span>Street Address, Apartment or Suite <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="checkout-street"
            type="text"
            name="street"
            value={values.street}
            onChange={handleChange}
            placeholder="e.g. 45 Park Avenue, Floor 3, Apt 12B"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        {/* Postal Code */}
        <div>
          <label htmlFor="checkout-postal-code" className="block text-stone-700 font-semibold mb-1">Postal Code (Optional)</label>
          <input
            id="checkout-postal-code"
            type="text"
            name="postalCode"
            value={values.postalCode || ''}
            onChange={handleChange}
            placeholder="e.g. 00300"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Delivery Instructions */}
        <div>
          <label htmlFor="checkout-notes" className="block text-stone-700 font-semibold mb-1">
            Delivery Notes / Landmarks (Optional)
          </label>
          <input
            id="checkout-notes"
            type="text"
            name="deliveryInstructions"
            value={values.deliveryInstructions || ''}
            onChange={handleChange}
            placeholder="e.g. Near White House junction, ring bell"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>
    </div>
  );
}
