import React, { useState, useEffect, useMemo } from 'react';
import { SRI_LANKA_DISTRICTS, deliveryService, PricingCalculationResult } from '../../services/deliveryService';
import { MapPin, Phone, User, Mail, Home, Clock, AlertCircle, CheckCircle2, Truck, ShieldCheck } from 'lucide-react';

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
  const [koombiyoCities, setKoombiyoCities] = useState<{ city_id: number; city_name: string; postal_code: string }[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch official Koombiyo cities whenever selected district changes
  useEffect(() => {
    const dist = values.district || 'Colombo';
    setIsLoadingCities(true);
    deliveryService
      .getKoombiyoCities(dist)
      .then((cities) => {
        setKoombiyoCities(cities || []);
      })
      .catch((err) => {
        console.warn('[Koombiyo Cities] Fallback on city load:', err);
      })
      .finally(() => {
        setIsLoadingCities(false);
      });
  }, [values.district]);

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

  // Popular town quick chips based on selected district
  const popularTowns = useMemo(() => {
    const dist = (values.district || '').toLowerCase();
    const curatedDefaults: Record<string, string[]> = {
      gampaha: ['Gampaha', 'Negombo', 'Wattala', 'Ja-Ela', 'Kadawatha', 'Minuwangoda', 'Kelaniya', 'Kiribathgoda'],
      colombo: ['Colombo 03', 'Nugegoda', 'Maharagama', 'Dehiwala', 'Moratuwa', 'Malabe', 'Kottawa', 'Rajagiriya'],
      kandy: ['Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Kundasale', 'Akurana'],
      galle: ['Galle', 'Karapitiya', 'Hikkaduwa', 'Ambalangoda', 'Bentota'],
      kurunegala: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Pannala', 'Polgahawela'],
      kalutara: ['Panadura', 'Kalutara', 'Horana', 'Wadduwa', 'Beruwala', 'Bandaragama'],
      matara: ['Matara', 'Weligama', 'Akuressa', 'Dikwella'],
    };

    if (curatedDefaults[dist]) {
      return curatedDefaults[dist];
    }

    if (koombiyoCities && koombiyoCities.length > 0) {
      return koombiyoCities
        .map((c) => c.city_name.trim())
        .filter((name, idx, arr) => arr.indexOf(name) === idx && name.length >= 3 && !name.includes('Road') && !name.includes('Junction'))
        .slice(0, 8);
    }

    return [];
  }, [values.district, koombiyoCities]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
        <div>
          <h3 className="font-serif text-xl font-medium text-stone-900 flex items-center space-x-2">
            <span>1. Shipping &amp; Delivery Address</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-medium flex items-center space-x-1.5 mt-0.5">
            <Truck className="w-3.5 h-3.5 text-brand-600" />
            <span>Exclusively fulfilled by <strong className="font-bold text-stone-800">Koombiyo Courier Service</strong></span>
          </span>
        </div>
        {estimatedDays && (
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-medium">
            <Clock className="w-3 h-3 text-emerald-600" />
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
            placeholder="e.g. 077 123 4567 or +94 77 123 4567"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />
          <p className="text-[10px] text-stone-400 mt-1">Koombiyo rider will call this number before arrival</p>
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
                {dist} District
              </option>
            ))}
          </select>
          <p className="text-[10px] text-stone-400 mt-1">
            Koombiyo delivery network covers all 25 districts islandwide
          </p>
        </div>

        {/* City / Town with Autocomplete from official Koombiyo cities */}
        <div className="sm:col-span-2">
          <label htmlFor="checkout-city" className="block text-stone-700 font-semibold mb-1 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>City / Town <span className="text-rose-500">*</span></span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">
              {isLoadingCities ? 'Loading Koombiyo cities...' : `${koombiyoCities.length > 0 ? `${koombiyoCities.length} serviceable locations` : 'Type or select your town'}`}
            </span>
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
                ? 'e.g. Negombo, Wattala, Ja-Ela, Kadawatha, Minuwangoda...'
                : 'e.g. Colombo 03, Nugegoda, Kandy, Galle, Kurunegala...'
            }
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            required
          />

          <datalist id="checkout-town-suggestions">
            {koombiyoCities.map((item) => (
              <option key={item.city_id} value={item.city_name.trim()}>
                {item.city_name.trim()} ({values.district})
              </option>
            ))}
          </datalist>

          {/* Quick Town Selection Chips */}
          {popularTowns.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-400">Quick Select:</span>
              {popularTowns.map((town) => (
                <button
                  key={town}
                  type="button"
                  onClick={() => handleSelectTown(town)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    values.city.toLowerCase() === town.toLowerCase()
                      ? 'bg-amber-800 text-white border-amber-900 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {town}
                </button>
              ))}
            </div>
          )}

          {/* Live Delivery Resolution Feedback */}
          {values.city.trim() && (
            <div className="mt-2.5">
              {pricing?.deliveryFee !== undefined ? (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold flex items-center space-x-1.5">
                        <span>{pricing.zoneName || `Koombiyo Delivery — ${values.city} (${values.district})`}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Koombiyo Active</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 block">
                        Estimated arrival: {pricing.estimatedDays || estimatedDays || '1–2 Business Days'}
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
