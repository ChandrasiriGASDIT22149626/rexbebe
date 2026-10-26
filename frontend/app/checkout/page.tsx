import React from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { CheckoutForm } from '../../components/checkout/CheckoutForm';

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl text-stone-900 font-normal mb-8">Express Concierge Checkout</h1>
        <CheckoutForm />
      </main>
      <Footer />
    </>
  );
}
