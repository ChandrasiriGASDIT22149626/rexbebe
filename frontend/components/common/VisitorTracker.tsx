'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminData } from '../../hooks/AdminContext';

export function VisitorTracker() {
  const pathname = usePathname();
  const { trackCurrentVisitor, isLoaded } = useAdminData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isLoaded) return;
    // Do not track internal admin page views as customer visits
    if (pathname && !pathname.startsWith('/admin')) {
      trackCurrentVisitor(pathname);
    }
  }, [mounted, pathname, isLoaded, trackCurrentVisitor]);

  return null;
}
