import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function GearIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.2a8 8 0 0 0 .1-1.2 8 8 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-2.1-1.2L14.6 4h-5.2l-.4 2.6a7.8 7.8 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4.4 13a8 8 0 0 0 .1 1.2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 2.1 1.2l.4 2.6h5.2l.4-2.6a7.8 7.8 0 0 0 2.1-1.2l2.4 1 2-3.5-2.1-1.5Z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}
