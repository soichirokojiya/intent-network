"use client";

// Deterministic pixel avatar generator
// Generates an 8x8 symmetrical pixel art face from a seed string

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const PALETTES = [
  { bg: "#1a1a2e", skin: "#e94560", accent: "#0f3460", eyes: "#16213e", highlight: "#533483" },
  { bg: "#0d1b2a", skin: "#00b4d8", accent: "#023e8a", eyes: "#001d3d", highlight: "#48cae4" },
  { bg: "#1b1a17", skin: "#f0a500", accent: "#e45826", eyes: "#1b1a17", highlight: "#e8d5b7" },
  { bg: "#2d0320", skin: "#ff006e", accent: "#8338ec", eyes: "#3a0ca3", highlight: "#fb5607" },
  { bg: "#0b1215", skin: "#00f5d4", accent: "#00bbf9", eyes: "#0b1215", highlight: "#9b5de5" },
  { bg: "#1a1423", skin: "#f72585", accent: "#7209b7", eyes: "#240046", highlight: "#4cc9f0" },
  { bg: "#0d1f22", skin: "#06d6a0", accent: "#118ab2", eyes: "#073b4c", highlight: "#ffd166" },
  { bg: "#1b0a20", skin: "#ff595e", accent: "#ff924c", eyes: "#1b0a20", highlight: "#ffca3a" },
  { bg: "#0a1628", skin: "#4361ee", accent: "#3a0ca3", eyes: "#10002b", highlight: "#7209b7" },
  { bg: "#1a1c20", skin: "#8ac926", accent: "#55a630", eyes: "#1a1c20", highlight: "#aacc00" },
  { bg: "#171520", skin: "#e0aaff", accent: "#9d4edd", eyes: "#10002b", highlight: "#c77dff" },
  { bg: "#1c1917", skin: "#fb8500", accent: "#e63946", eyes: "#1d3557", highlight: "#a8dadc" },
];

interface PixelAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

export function PixelAvatar({ seed, size = 40, className = "" }: PixelAvatarProps) {
  const hash = hashCode(seed || "default");
  const rand = seededRandom(hash);
  const palette = PALETTES[hash % PALETTES.length];

  // Generate 8x8 grid (only left half, mirror for symmetry)
  const pixels: string[][] = [];
  for (let y = 0; y < 8; y++) {
    const row: string[] = [];
    for (let x = 0; x < 4; x++) {
      const r = rand();
      let color = "transparent";

      // Face shape (rows 1-6, cols 1-3)
      if (y >= 1 && y <= 6 && x >= 1) {
        if (r < 0.55) color = palette.skin;
        else if (r < 0.7) color = palette.accent;
        else if (r < 0.8) color = palette.highlight;
      }
      // Eyes area (row 2-3, col 1-2)
      if (y >= 2 && y <= 3 && x >= 1 && x <= 2) {
        if (r < 0.4) color = palette.eyes;
        else if (r < 0.7) color = palette.skin;
      }
      // Top (hair)
      if (y === 0 && x >= 1) {
        if (r < 0.6) color = palette.accent;
        else if (r < 0.8) color = palette.highlight;
      }
      // Bottom (chin)
      if (y === 7 && x >= 2) {
        if (r < 0.3) color = palette.skin;
      }

      row.push(color);
    }
    // Mirror for symmetry
    const fullRow = [...row, ...row.slice().reverse()];
    pixels.push(fullRow);
  }

  const pixelSize = size / 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ borderRadius: "50%", imageRendering: "pixelated" }}
    >
      <rect width={size} height={size} fill={palette.bg} rx={size / 2} />
      {pixels.map((row, y) =>
        row.map((color, x) =>
          color !== "transparent" ? (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize + 0.5}
              height={pixelSize + 0.5}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// Grid of pixel avatars for selection
export function PixelAvatarGrid({
  baseSeed,
  selected,
  onSelect,
}: {
  baseSeed: string;
  selected: string;
  onSelect: (seed: string) => void;
}) {
  const options = Array.from({ length: 12 }, (_, i) => `${baseSeed}-${i}`);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((seed) => (
        <button
          key={seed}
          onClick={() => onSelect(seed)}
          className={`rounded-full transition-all ${
            selected === seed
              ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]"
              : "hover:ring-1 hover:ring-[var(--card-border)]"
          }`}
        >
          <PixelAvatar seed={seed} size={48} />
        </button>
      ))}
      <button
        onClick={() => onSelect(`${baseSeed}-${Date.now()}`)}
        className="w-12 h-12 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        title="ランダム生成"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 4v6h6M23 20v-6h-6" />
          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
        </svg>
      </button>
    </div>
  );
}
