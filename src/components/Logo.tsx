"use client";

// Musu Logo - Clean, minimal
// Abstract "M" formed by two arcs meeting — connection/birth

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="22" fill="#1d9bf0" />
      {/* Abstract M — two curves rising from center */}
      <path
        d="M25 70 Q25 35, 50 30 Q75 35, 75 70"
        stroke="white" strokeWidth="8" strokeLinecap="round" fill="none"
      />
      {/* Center dot — the seed/origin */}
      <circle cx="50" cy="30" r="5" fill="white" />
    </svg>
  );
}

export function LogoFull({ size = 36, className = "" }: { size?: number; className?: string }) {
  const fontSize = Math.max(16, size * 0.6);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-extrabold tracking-tight" style={{ fontSize, lineHeight: 1 }}>
        musu
      </span>
    </div>
  );
}
