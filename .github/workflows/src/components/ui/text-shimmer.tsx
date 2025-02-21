'use client';

import React from 'react';

interface TextShimmerProps {
  children: string;
  className?: string;
  duration?: number;
}

export const TextShimmer: React.FC<TextShimmerProps> = ({
  children,
  className = '',
  duration = 2.5
}) => {
  const shimmerStyles = {
    '--duration': `${duration}s`,
  } as React.CSSProperties;

  return (
    <span
      className={`
        relative inline-block
        animate-shimmer
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        bg-[length:200%_100%]
        text-white
        ${className}
      `.trim()}
      style={shimmerStyles}
    >
      {children}
    </span>
  );
};

// Add this to your tailwind.config.js:
// animation: {
//   shimmer: 'shimmer var(--duration) linear infinite',
// },
// keyframes: {
//   shimmer: {
//     '0%': { backgroundPosition: '100% 0' },
//     '100%': { backgroundPosition: '-100% 0' },
//   },
// }, 