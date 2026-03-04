'use client';

import { useEffect } from 'react';
import { useAlgebraStore } from '@/store/algebraStore';

export function AppBootstrap() {
  const initialize = useAlgebraStore((state) => state.initialize);
  const isHydrated = useAlgebraStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    initialize();
  }, [isHydrated, initialize]);

  return null;
}
