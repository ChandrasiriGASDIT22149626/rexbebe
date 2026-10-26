'use client';

import { useState, useEffect } from 'react';
import { Order } from '../types/order';
import { orderService } from '../services/orderService';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await orderService.getAllOrdersAdmin();
        setOrders(data as any);
      } catch (e) {
        console.warn('API offline - returning empty order list');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { orders, loading, setOrders };
}
