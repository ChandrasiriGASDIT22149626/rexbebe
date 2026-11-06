'use client';

import React from 'react';

export function MintpayLogo({ className = 'h-3.5 w-auto inline-block' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center select-none ${className}`} title="Mintpay" aria-label="Mintpay">
      <svg
        viewBox="0 0 76 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        style={{ verticalAlign: 'middle', height: '0.95em' }}
      >
        {/* Three forward slashes forming the 'm' mark */}
        <path d="M2.2 14.5L7.5 1.5H10.8L5.5 14.5H2.2Z" fill="currentColor" />
        <path d="M7.8 14.5L13.1 1.5H16.4L11.1 14.5H7.8Z" fill="currentColor" />
        <path d="M13.4 14.5L18.7 1.5H22L16.7 14.5H13.4Z" fill="currentColor" />
        {/* 'intpay' wordmark */}
        <text
          x="23.5"
          y="12.5"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="12.5"
          letterSpacing="-0.3px"
        >
          intpay
        </text>
      </svg>
    </span>
  );
}

export function KokoLogo({ className = 'h-3.5 w-auto inline-block' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center select-none text-[#5D5FEF] ${className}`} title="Koko" aria-label="Koko">
      <svg
        viewBox="0 0 46 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        style={{ verticalAlign: 'middle', height: '0.95em' }}
      >
        <text
          x="0"
          y="12.5"
          fill="#5D5FEF"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          fontWeight="900"
          fontSize="13.5"
          letterSpacing="-0.5px"
        >
          koko
        </text>
      </svg>
    </span>
  );
}

interface InstallmentBadgesProps {
  price: number;
  currencyPrefix?: string;
  className?: string;
}

export function InstallmentBadges({
  price,
  currencyPrefix = 'Rs',
  className = '',
}: InstallmentBadgesProps) {
  if (!price || price <= 0) return null;

  const installmentAmount = (price / 3).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={`text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-tight space-y-0.5 select-none ${className}`}>
      <div className="flex items-center gap-1 flex-wrap">
        <span>
          or 3 installments of{' '}
          <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
            {currencyPrefix} {installmentAmount}
          </strong>{' '}
          with
        </span>
        <MintpayLogo className="h-3 sm:h-3.5 text-neutral-900 dark:text-neutral-100" />
      </div>
      <div className="flex items-center gap-1">
        <span>or</span>
        <KokoLogo className="h-3 sm:h-3.5" />
      </div>
    </div>
  );
}

