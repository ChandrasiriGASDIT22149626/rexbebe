import type { Metadata } from 'next';
import { AdminAuthGuard } from '../../components/admin/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Admin Management Suite',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="admin-layout-root min-h-screen w-full overflow-x-hidden">
        {children}
      </div>
    </AdminAuthGuard>
  );
}
