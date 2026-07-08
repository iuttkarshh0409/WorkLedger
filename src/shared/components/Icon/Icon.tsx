/**
 * Icon
 *
 * Lightweight inline SVG icon component.
 * Milestone 1: minimal set covering primary navigation.
 *
 * All icons are 24×24 viewBox, stroke-based, aria-hidden by default.
 * Accessible labels are provided by the parent element (e.g. nav link text).
 */

import type { SVGProps, ReactElement } from 'react';
import { clsx } from 'clsx';

// ─── Icon map ────────────────────────────────────────────────────────────────

const icons: Record<string, ReactElement> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  contributors: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </>
  ),
  milestones: (
    <>
      <path d="M3 12h18" />
      <path d="M3 6l9-3 9 3" />
      <path d="M3 18l9 3 9-3" />
    </>
  ),
  assignments: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  reviews: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </>
  ),
  activity: (
    <>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </>
  ),
  analytics: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <rect x="2" y="20" width="20" height="1" rx="0.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  chevronLeft: (
    <>
      <polyline points="15 18 9 12 15 6" />
    </>
  ),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type IconName = keyof typeof icons;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const paths = icons[name];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx('shrink-0', className)}
      {...rest}
    >
      {paths ?? null}
    </svg>
  );
}
