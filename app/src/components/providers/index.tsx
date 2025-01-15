'use client';

import { ThemeProvider } from '../theme-provider';
import { MatrixProvider } from './matrix-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MatrixProvider>{children}</MatrixProvider>
    </ThemeProvider>
  );
}
