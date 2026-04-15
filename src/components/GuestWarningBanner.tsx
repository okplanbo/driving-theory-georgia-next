'use client';

import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface GuestWarningBannerProps {
  className?: string;
}

export function GuestWarningBanner({ className }: GuestWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full text-yellow-500">
        <span>
          <strong>Guest mode:</strong> Your progress won&apos;t be saved.{' '}
          <Link href="/signup" className="underline font-medium">
            Sign up
          </Link>{' '}
          to track your answers and access all features.
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 ml-2"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
