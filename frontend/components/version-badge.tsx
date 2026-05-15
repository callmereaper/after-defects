'use client';

import { BadgeCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  version: string | null;
  label?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function VersionBadge({ version, label = 'Version', variant = 'default' }: VersionBadgeProps) {
  if (!version) return null;

  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
      variants[variant]
    )}>
      {variant === 'success' ? (
        <BadgeCheck className="h-4 w-4" />
      ) : variant === 'warning' ? (
        <AlertCircle className="h-4 w-4" />
      ) : null}
      <span>{label}:</span>
      <span className="font-bold">{version}</span>
    </div>
  );
}
