'use client';

import React from 'react';
import Script from 'next/script';

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// E-commerce Event Dispatchers for GA4
export function trackGAEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
}

export function trackViewItem(product: { id: string; name: string; price: number; category?: string }) {
  trackGAEvent('view_item', {
    currency: 'LKR',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category || 'Baby Clothing',
      },
    ],
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity: number = 1) {
  trackGAEvent('add_to_cart', {
    currency: 'LKR',
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      },
    ],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  trackGAEvent('begin_checkout', {
    currency: 'LKR',
    value,
    item_count: itemCount,
  });
}

export function trackPurchase(order: {
  transactionId: string;
  value: number;
  shipping?: number;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}) {
  trackGAEvent('purchase', {
    transaction_id: order.transactionId,
    currency: 'LKR',
    value: order.value,
    shipping: order.shipping || 0,
    items: order.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

