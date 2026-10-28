'use client';

import React, { useState, useEffect } from 'react';
import { Preloader } from './Preloader';

export function ClientOnlyPreloader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <Preloader />;
}
