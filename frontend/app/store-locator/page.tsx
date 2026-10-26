import React from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { MapPin, Clock, Phone } from 'lucide-react';

const STORES = [
  {
    name: 'REXBEBE Flagship Atelier — Cinnamon Gardens',
    address: '88 Maitland Crescent, Colombo 07, Sri Lanka',
    phone: '+94 11 234 5678',
    hours: 'Mon - Sun: 10:00 AM - 7:00 PM',
  },
  {
    name: 'REXBEBE Boutique — One Galle Face Mall',
    address: 'Level 3, Luxury Atrium, Colombo 02, Sri Lanka',
    phone: '+94 11 987 6543',
    hours: 'Mon - Sun: 10:00 AM - 10:00 PM',
  },
];

export default function StoreLocatorPage() {
  return (
    <>
      <Header />
      <main className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-600">Physical Boutiques</span>
          <h1 className="font-serif text-4xl text-stone-900 font-normal mt-1">Visit Our Flagship Stores</h1>
          <p className="text-xs text-stone-500 font-light mt-2">
            Experience our GOTS organic cashmere and handcrafted wooden toys in person.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {STORES.map((s, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">{s.name}</h3>
              <div className="space-y-2 text-xs text-stone-600 font-light">
                <p className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{s.address}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{s.phone}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{s.hours}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
