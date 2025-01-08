'use client';

import { MatrixProvider } from '@/components/providers/matrix-provider';
import { Toaster } from '@/components/ui/toaster';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MatrixProvider>{children}</MatrixProvider>
      <Toaster />
    </>
  );
}
