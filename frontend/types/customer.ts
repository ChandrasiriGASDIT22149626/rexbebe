export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}
