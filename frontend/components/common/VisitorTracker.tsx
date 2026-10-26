'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminData } from '../../hooks/AdminContext';

export function VisitorTracker() {
  const pathname = usePathname();
  const { trackCurrentVisitor, isLoaded } = useAdminData();

  useEffect(() => {
    if (!isLoaded) return;
    // Do not track internal admin page views as customer visits
    if (pathname && !pathname.startsWith('/admin')) {
      trackCurrentVisitor(pathname);
    }
  }, [pathname, isLoaded, trackCurrentVisitor]);

  return null;
}
