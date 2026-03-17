"use client";

// Musu Logo
// Concept: Abstract "seed sprouting" — an AI being born and reaching outward
// The shape suggests: growth, connection, and two paths diverging from one origin
// Works as both mark and with wordmark

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background circle */}
      <circle cx="60" cy="60" r="56" fill="#1d9bf0" />

      {/* Two growing stems from center — representing agents being born */}
      <path
        d="M52 85 C52 65, 38 55, 28 38"
        stroke="white" strokeWidth="7" strokeLinecap="round" fill="none"
      />
      <path
        d="M68 85 C68 65, 82 55, 92 38"
        stroke="white" strokeWidth="7" strokeLinecap="round" fill="none"
      />

      {/* Nodes at tips — the agents */}
      <circle cx="28" cy="38" r="10" fill="white" />
      <circle cx="92" cy="38" r="10" fill="white" />

      {/* Connection arc between the two agents */}
      <path
        d="M38 38 C48 22, 72 22, 82 38"
        stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"
      />

      {/* Root/seed at bottom — the human/origin */}
      <circle cx="60" cy="90" r="6" fill="white" opacity="0.7" />
    </svg>
  );
}

export function LogoFull({ size = 36, className = "" }: { size?: number; className?: string }) {
  const fontSize = Math.max(16, size * 0.6);
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize, lineHeight: 1 }}
      >
        musu
      </span>
    </div>
  );
}
