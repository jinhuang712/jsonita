import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

export function FormatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 7h12" />
      <path d="M6 12h9" />
      <path d="M6 17h12" />
    </svg>
  );
}

export function MinifyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 9-4-4" />
      <path d="M5 9V5h4" />
      <path d="m15 9 4-4" />
      <path d="M19 9V5h-4" />
      <path d="m9 15-4 4" />
      <path d="M5 15v4h4" />
      <path d="m15 15 4 4" />
      <path d="M19 15v4h-4" />
    </svg>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 6h10" />
      <path d="M8 12h10" />
      <path d="M8 18h10" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

export function ToStringIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8h11a4 4 0 0 1 0 8H8" />
      <path d="m8 12-4 4 4 4" />
    </svg>
  );
}

export function JsonBracesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 5H8a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1" />
      <path d="M15 5h1a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
      <path d="m5 14 .7 1.8L8 16.5l-2.3.7L5 19l-.7-1.8-2.3-.7 2.3-.7L5 14Z" />
    </svg>
  );
}

export function SplitPanelIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 5v5h5" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

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
