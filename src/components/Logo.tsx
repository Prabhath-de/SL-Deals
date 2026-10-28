import { Link } from "react-router-dom";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="hsl(var(--primary))" />
      <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r="1.3" fill="#F2A20C" stroke="#F2A20C" />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="DealFinder LK home">
      <LogoMark />
      <span className="font-heading text-lg font-bold leading-none tracking-tight">
        DealFinder<span className="text-primary"> LK</span>
      </span>
    </Link>
  );
}
