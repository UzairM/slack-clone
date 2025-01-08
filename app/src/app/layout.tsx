import { MatrixProvider } from '@/components/providers/matrix-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TRPCProvider } from '@/components/providers/trpc-provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Slack Clone',
  description: 'A modern Slack clone built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MatrixProvider>
              {children}
              <Toaster richColors position="top-right" />
            </MatrixProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
