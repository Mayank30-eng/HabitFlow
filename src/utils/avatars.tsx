import React from 'react';

export type AvatarCategory = 'illustrations' | 'abstract' | 'characters' | 'geometric';

export interface AvatarOption {
  id: string;
  name: string;
  category: AvatarCategory;
  categoryLabel: string;
  render: (className?: string) => React.ReactNode;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // ─── Minimal Illustrations ──────────────────────────────────────────
  {
    id: 'sprout',
    name: 'Sprout',
    category: 'illustrations',
    categoryLabel: 'Illustrations',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-sprout-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="hf-sprout-leaf" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A7F3D0" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-sprout-bg)" />
        {/* Pot / Mound */}
        <path d="M26 74C26 66 36 62 50 62C64 62 74 66 74 74H26Z" fill="#047857" opacity="0.5" />
        {/* Stem */}
        <path d="M50 70V44" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
        {/* Left leaf */}
        <path
          d="M50 50C42 46 32 46 28 54C34 60 44 58 50 50Z"
          fill="url(#hf-sprout-leaf)"
        />
        {/* Right leaf */}
        <path
          d="M50 42C58 36 70 38 72 46C64 52 54 50 50 42Z"
          fill="url(#hf-sprout-leaf)"
        />
      </svg>
    ),
  },
  {
    id: 'flame',
    name: 'Fire Streak',
    category: 'illustrations',
    categoryLabel: 'Illustrations',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-flame-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="hf-flame-core" x1="40" y1="40" x2="60" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF08A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-flame-bg)" />
        {/* Outer flame */}
        <path
          d="M50 18C50 18 64 36 64 52C64 66 54 78 50 78C46 78 36 66 36 52C36 38 46 30 50 18Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        {/* Inner flame */}
        <path
          d="M50 36C50 36 58 48 58 58C58 66 54 72 50 72C46 72 42 66 42 58C42 48 48 42 50 36Z"
          fill="url(#hf-flame-core)"
        />
      </svg>
    ),
  },
  {
    id: 'lotus',
    name: 'Lotus Zen',
    category: 'illustrations',
    categoryLabel: 'Illustrations',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-lotus-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-lotus-bg)" />
        {/* Center petal */}
        <path
          d="M50 24C44 38 44 56 50 72C56 56 56 38 50 24Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        {/* Left petal */}
        <path
          d="M50 72C34 70 24 54 30 42C38 44 46 54 50 72Z"
          fill="#FCE7F3"
          opacity="0.85"
        />
        {/* Right petal */}
        <path
          d="M50 72C66 70 76 54 70 42C62 44 54 54 50 72Z"
          fill="#FCE7F3"
          opacity="0.85"
        />
      </svg>
    ),
  },
  {
    id: 'mountain',
    name: 'Summit',
    category: 'illustrations',
    categoryLabel: 'Illustrations',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-mnt-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1E1B4B" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-mnt-bg)" />
        {/* Sun */}
        <circle cx="50" cy="34" r="12" fill="#FDE047" opacity="0.9" />
        {/* Back mountain */}
        <polygon points="62,42 86,76 38,76" fill="#1E3A8A" opacity="0.7" />
        {/* Front mountain */}
        <polygon points="36,46 64,80 8,80" fill="#2563EB" />
        {/* Snow cap */}
        <polygon points="36,46 45,58 40,56 36,60 32,56 27,58" fill="#FFFFFF" />
      </svg>
    ),
  },

  // ─── Abstract & Cosmic ──────────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'abstract',
    categoryLabel: 'Abstract',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-aurora-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="hf-aurora-wave1" x1="10" y1="30" x2="90" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="0.5" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-aurora-bg)" />
        <path
          d="M10 60C30 35 45 75 65 45C78 28 85 45 90 40V82C80 85 50 82 10 82V60Z"
          fill="url(#hf-aurora-wave1)"
          opacity="0.8"
        />
        <circle cx="35" cy="28" r="2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="68" cy="22" r="1.5" fill="#FFFFFF" opacity="0.6" />
        <circle cx="82" cy="32" r="2" fill="#FFFFFF" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: 'sunset',
    name: 'Golden Glow',
    category: 'abstract',
    categoryLabel: 'Abstract',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-sunset-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.5" stopColor="#F43F5E" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-sunset-bg)" />
        {/* Glow disk */}
        <circle cx="50" cy="46" r="18" fill="#FEF08A" opacity="0.9" />
        {/* Horizon bars */}
        <rect x="22" y="56" width="56" height="4" rx="2" fill="#FFFFFF" opacity="0.8" />
        <rect x="30" y="64" width="40" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
        <rect x="40" y="71" width="20" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'cosmic',
    name: 'Cosmic Moon',
    category: 'abstract',
    categoryLabel: 'Abstract',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-cosmic-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#312E81" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-cosmic-bg)" />
        {/* Crescent Moon */}
        <path
          d="M56 26C42 28 32 40 32 54C32 68 44 80 58 78C46 76 40 64 42 52C44 40 50 32 56 26Z"
          fill="#FDE047"
        />
        {/* Twinkle stars */}
        <polygon points="68,36 70,41 75,43 70,45 68,50 66,45 61,43 66,41" fill="#FFFFFF" />
        <circle cx="28" cy="34" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="74" cy="62" r="1.5" fill="#FFFFFF" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'prism',
    name: 'Prism Gem',
    category: 'abstract',
    categoryLabel: 'Abstract',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-prism-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#047857" />
            <stop offset="1" stopColor="#0F766E" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-prism-bg)" />
        {/* Diamond facets */}
        <polygon points="50,22 68,38 50,78 32,38" fill="#A7F3D0" opacity="0.9" />
        <polygon points="50,22 32,38 50,78" fill="#34D399" opacity="0.9" />
        <polygon points="32,38 50,22 42,22" fill="#E6FFFA" opacity="0.95" />
        <polygon points="68,38 50,22 58,22" fill="#6EE7B7" opacity="0.95" />
      </svg>
    ),
  },

  // ─── Characters ─────────────────────────────────────────────────────
  {
    id: 'fox',
    name: 'Clever Fox',
    category: 'characters',
    categoryLabel: 'Characters',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-fox-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EA580C" />
            <stop offset="1" stopColor="#C2410C" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-fox-bg)" />
        {/* Left ear */}
        <polygon points="26,24 40,46 22,46" fill="#7C2D12" />
        <polygon points="27,29 37,44 24,44" fill="#FED7AA" />
        {/* Right ear */}
        <polygon points="74,24 78,46 60,46" fill="#7C2D12" />
        <polygon points="73,29 76,44 63,44" fill="#FED7AA" />
        {/* Face */}
        <polygon points="50,76 22,46 78,46" fill="#FFFFFF" />
        <polygon points="50,76 34,46 66,46" fill="#EA580C" />
        {/* Eyes */}
        <circle cx="42" cy="54" r="3" fill="#1C1917" />
        <circle cx="58" cy="54" r="3" fill="#1C1917" />
        {/* Nose */}
        <polygon points="50,74 46,69 54,69" fill="#1C1917" />
      </svg>
    ),
  },
  {
    id: 'owl',
    name: 'Wise Owl',
    category: 'characters',
    categoryLabel: 'Characters',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-owl-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4338CA" />
            <stop offset="1" stopColor="#312E81" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-owl-bg)" />
        {/* Body */}
        <ellipse cx="50" cy="56" rx="26" ry="24" fill="#6366F1" />
        {/* Belly */}
        <ellipse cx="50" cy="62" rx="16" ry="15" fill="#E0E7FF" />
        {/* Left eye circle */}
        <circle cx="40" cy="46" r="10" fill="#FFFFFF" />
        <circle cx="40" cy="46" r="4.5" fill="#1E1B4B" />
        <circle cx="38" cy="44" r="1.5" fill="#FFFFFF" />
        {/* Right eye circle */}
        <circle cx="60" cy="46" r="10" fill="#FFFFFF" />
        <circle cx="60" cy="46" r="4.5" fill="#1E1B4B" />
        <circle cx="58" cy="44" r="1.5" fill="#FFFFFF" />
        {/* Beak */}
        <polygon points="50,56 46,50 54,50" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    id: 'cat',
    name: 'Calm Cat',
    category: 'characters',
    categoryLabel: 'Characters',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-cat-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D9488" />
            <stop offset="1" stopColor="#115E59" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-cat-bg)" />
        {/* Ears */}
        <polygon points="30,26 44,48 24,46" fill="#F0FDFA" />
        <polygon points="31,30 40,45 26,44" fill="#F472B6" />
        <polygon points="70,26 76,46 56,48" fill="#F0FDFA" />
        <polygon points="69,30 74,44 60,45" fill="#F472B6" />
        {/* Head */}
        <circle cx="50" cy="56" r="24" fill="#F0FDFA" />
        {/* Eyes (closed zen) */}
        <path d="M37 54C39 57 43 57 45 54" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M55 54C57 57 61 57 63 54" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
        {/* Nose */}
        <polygon points="50,62 47,59 53,59" fill="#F472B6" />
      </svg>
    ),
  },
  {
    id: 'panda',
    name: 'Zen Panda',
    category: 'characters',
    categoryLabel: 'Characters',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-panda-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#15803D" />
            <stop offset="1" stopColor="#166534" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-panda-bg)" />
        {/* Ears */}
        <circle cx="30" cy="34" r="9" fill="#18181B" />
        <circle cx="70" cy="34" r="9" fill="#18181B" />
        {/* Head */}
        <circle cx="50" cy="56" r="25" fill="#FFFFFF" />
        {/* Eye patches */}
        <ellipse cx="40" cy="52" rx="7" ry="5.5" transform="rotate(-15 40 52)" fill="#18181B" />
        <circle cx="41" cy="52" r="2" fill="#FFFFFF" />
        <ellipse cx="60" cy="52" rx="7" ry="5.5" transform="rotate(15 60 52)" fill="#18181B" />
        <circle cx="59" cy="52" r="2" fill="#FFFFFF" />
        {/* Nose */}
        <ellipse cx="50" cy="62" rx="4" ry="3" fill="#18181B" />
      </svg>
    ),
  },

  // ─── Geometric / Focus ──────────────────────────────────────────────
  {
    id: 'compass',
    name: 'Compass',
    category: 'geometric',
    categoryLabel: 'Focus & Goals',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-cmp-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284C7" />
            <stop offset="1" stopColor="#0369A1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-cmp-bg)" />
        <circle cx="50" cy="50" r="26" stroke="#BAE6FD" strokeWidth="3" opacity="0.6" />
        {/* Needle Top (North) */}
        <polygon points="50,26 56,50 50,46" fill="#F43F5E" />
        <polygon points="50,26 44,50 50,46" fill="#FDA4AF" />
        {/* Needle Bottom (South) */}
        <polygon points="50,74 56,50 50,54" fill="#FFFFFF" />
        <polygon points="50,74 44,50 50,54" fill="#E0F2FE" />
        <circle cx="50" cy="50" r="3.5" fill="#0C4A6E" />
      </svg>
    ),
  },
  {
    id: 'shield',
    name: 'Guardian',
    category: 'geometric',
    categoryLabel: 'Focus & Goals',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-shield-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-shield-bg)" />
        <path
          d="M50 24L72 32V52C72 66 62 76 50 80C38 76 28 66 28 52V32L50 24Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        {/* Checkmark */}
        <path
          d="M42 52L48 58L60 44"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'lightning',
    name: 'Energy',
    category: 'geometric',
    categoryLabel: 'Focus & Goals',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-bolt-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-bolt-bg)" />
        <path
          d="M54 20L34 50H48L44 80L66 48H52L54 20Z"
          fill="#FDE047"
          stroke="#FEF08A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'target',
    name: 'Bullseye',
    category: 'geometric',
    categoryLabel: 'Focus & Goals',
    render: (className = 'w-full h-full') => (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hf-target-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E11D48" />
            <stop offset="1" stopColor="#9F1239" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#hf-target-bg)" />
        <circle cx="50" cy="50" r="26" fill="#FFFFFF" opacity="0.9" />
        <circle cx="50" cy="50" r="18" fill="#E11D48" />
        <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="4" fill="#E11D48" />
      </svg>
    ),
  },
];

export const getAvatarById = (id?: string | null): AvatarOption => {
  if (!id) return AVATAR_OPTIONS[0];
  const found = AVATAR_OPTIONS.find((a) => a.id === id);
  return found || AVATAR_OPTIONS[0];
};

