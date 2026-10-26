export interface OrderItem {
  id: string;
  variantId: string;
  title: string;
  partName?: string;
  purchaseType?: string;
  color?: string;
  size?: string;
  image?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  createdAt: string;
}
