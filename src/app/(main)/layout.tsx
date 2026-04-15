'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationBar } from '@/components/NavigationBar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

function MainLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, preferences, updatePreferences, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <NavigationBar
        isAuthenticated={isAuthenticated}
        userEmail={user?.email}
        currentLanguage={preferences.preferredLanguage}
        onLanguageChange={(lang) => updatePreferences({ preferredLanguage: lang })}
        onLogout={handleLogout}
      />
      <main className="flex-1">{children}</main>
    </>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  );
}
