"use client";

// Musu logo: stylized "m" mark + wordmark
// The mark represents two entities (AI agents) connected/born together

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Two connected circles - representing "musubi" (結び) / connection */}
      <circle cx="14" cy="20" r="10" fill="var(--accent)" opacity="0.9" />
      <circle cx="26" cy="20" r="10" fill="#6366f1" opacity="0.9" />
      {/* Overlap area creates the connection */}
      <path d="M20 12.68C17.64 14.54 16 17.1 16 20s1.64 5.46 4 7.32C22.36 25.46 24 22.9 24 20s-1.64-5.46-4-7.32z" fill="white" opacity="0.3" />
      {/* Eyes - the agents are alive */}
      <circle cx="12" cy="19" r="1.5" fill="white" />
      <circle cx="28" cy="19" r="1.5" fill="white" />
    </svg>
  );
}

export function LogoFull({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-extrabold tracking-tight" style={{ fontSize: size * 0.7 }}>musu</span>
    </div>
  );
}
