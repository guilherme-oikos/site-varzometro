import type { SVGProps } from 'react';

/**
 * Ícones inline em SVG — zero dependência externa, zero requisição de rede.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M23.5 6.9a3 3 0 0 0-2.1-2.1C19.5 4.3 12 4.3 12 4.3s-7.5 0-9.4.5A3 3 0 0 0 .5 6.9C0 8.8 0 12 0 12s0 3.2.5 5.1a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.1.5-5.1s0-3.2-.5-5.1ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

export function SpotifyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.6-1.15a.75.75 0 1 1-.33-1.46c4.6-1.04 8.6-.58 11.7 1.33.35.22.46.68.24 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.2-1.97-8.09-2.54-11.87-1.39a.94.94 0 1 1-.55-1.8c4.32-1.31 9.7-.67 13.39 1.6.44.27.58.85.32 1.28Zm.13-3.4C15.26 8.35 8.9 8.14 5.24 9.25a1.12 1.12 0 1 1-.65-2.15C8.79 5.83 15.81 6.08 20.24 8.7a1.12 1.12 0 1 1-1.14 1.93Z" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.3v12.1a2.6 2.6 0 1 1-1.85-2.49V9.24a5.87 5.87 0 1 0 5.15 5.83V9.01a7.55 7.55 0 0 0 4.4 1.41V7.13a4.28 4.28 0 0 1-3.34-1.31Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9a3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M3 12a6 6 0 1 0 12 0h7l-1.5 3H15" />
      <path d="M9 9v6" />
      <path d="M19 5.5 16 8" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
      <path d="M8 14h3M8 17.5h8" />
    </svg>
  );
}

export function BeerIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M6 9h9v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" />
      <path d="M15 11h2.5A2.5 2.5 0 0 1 20 13.5v1A2.5 2.5 0 0 1 17.5 17H15" />
      <path d="M6 9a2.5 2.5 0 0 1 1-4.6 2.8 2.8 0 0 1 4.2-1.2A2.6 2.6 0 0 1 15 5.6V9" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </svg>
  );
}

export function StadiumIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M3 8.5C3 6.6 7 5 12 5s9 1.6 9 3.5-4 3.5-9 3.5-9-1.6-9-3.5Z" />
      <path d="M3 8.5v6C3 16.4 7 18 12 18s9-1.6 9-3.5v-6" />
      <path d="M8 12.2V19M16 12.2V19" />
    </svg>
  );
}

export function BallIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="m12 7.4 3.6 2.6-1.4 4.3H9.8L8.4 10 12 7.4Z" />
      <path d="M12 2.8v4.6M3.4 9.6 8.4 10M20.6 9.6 15.6 10M6.6 20l3.2-5.7M17.4 20l-3.2-5.7" />
    </svg>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M12.5 6.5 17 11 8 20H3.5v-4.5l9-9Z" />
      <path d="m14.5 4.5 1.6-1.6a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L18.5 8.5" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M20 12H4M10 18l-6-6 6-6" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
      <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6a2.5 2.5 0 0 0-2.5 2.5V13a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </svg>
  );
}

export const iconMap = {
  users: UsersIcon,
  whistle: WhistleIcon,
  calendar: CalendarIcon,
  beer: BeerIcon,
  mic: MicIcon,
  stadium: StadiumIcon,
  ball: BallIcon,
} as const;

export type IconName = keyof typeof iconMap;
