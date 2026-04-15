'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/hooks/useAuth';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {/* Simple header */}
        <header className="border-b">
          <div className="container flex h-14 items-center px-4 justify-self-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <span className="font-semibold">Driving Theory</span>
            </Link>
          </div>
        </header>

        {/* Auth content */}
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
