import {
  Aperture,
  Briefcase,
  Building2,
  Camera,
  Church,
  Clapperboard,
  Eye,
  Film,
  Gem,
  Globe,
  GraduationCap,
  Handshake,
  Heart,
  Lightbulb,
  Megaphone,
  Mic,
  Music,
  Palette,
  Play,
  Radio,
  Scissors,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
  Video,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  film: Film,
  camera: Camera,
  video: Video,
  clapperboard: Clapperboard,
  aperture: Aperture,
  heart: Heart,
  briefcase: Briefcase,
  mic: Mic,
  music: Music,
  church: Church,
  users: Users,
  sparkles: Sparkles,
  megaphone: Megaphone,
  radio: Radio,
  star: Star,
  eye: Eye,
  lightbulb: Lightbulb,
  target: Target,
  palette: Palette,
  play: Play,
  gem: Gem,
  handshake: Handshake,
  globe: Globe,
  "graduation-cap": GraduationCap,
  building: Building2,
  smartphone: Smartphone,
  scissors: Scissors,
  sun: Sun,
} as const;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = ICONS[name as keyof typeof ICONS] ?? Film;
  return <Cmp aria-hidden="true" {...props} />;
}

/* Brand icons (lucide no longer ships brand marks). */
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm.01 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function SocialIcon({ platform, ...props }: { platform: string } & React.SVGProps<SVGSVGElement>) {
  if (platform === "instagram") return <InstagramIcon {...props} />;
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M14 8h3V4h-3a5 5 0 0 0-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9a1 1 0 0 1 1-1Z" />,
    youtube: (
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    ),
    tiktok: <path d="M16.5 3a4.9 4.9 0 0 0 4 4.4v3.3a8.1 8.1 0 0 1-4-1.2v6.3A5.8 5.8 0 1 1 10.7 10v3.4a2.5 2.5 0 1 0 2.5 2.4V3h3.3Z" />,
    x: <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />,
    linkedin: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.59V21h-4V9.75Z" />
    ),
    vimeo: (
      <path d="M22 7.4c-.1 2-1.5 4.7-4.2 8.1-2.8 3.6-5.1 5.4-7 5.4-1.2 0-2.2-1.1-3-3.3L6.2 11.6c-.6-2.2-1.2-3.3-1.9-3.3-.1 0-.7.3-1.6 1L1.8 8.1c1-.9 2-1.8 3-2.6 1.3-1.2 2.3-1.8 3-1.8 1.6-.2 2.5.9 2.9 3.2.4 2.5.7 4 .8 4.6.4 2 .9 3 1.4 3 .4 0 1.1-.7 1.9-2 .9-1.4 1.3-2.4 1.4-3.1.1-1.2-.3-1.8-1.4-1.8-.5 0-1 .1-1.5.3 1-3.3 3-4.9 5.9-4.8 2.2 0 3.2 1.5 3.1 4.3Z" />
    ),
  };
  const p = paths[platform];
  if (!p)
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {p}
    </svg>
  );
}
