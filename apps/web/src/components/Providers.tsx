'use client';

import { AppBootstrap } from './AppBootstrap';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppBootstrap />
      {children}
    </ToastProvider>
  );
}
