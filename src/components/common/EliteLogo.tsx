import React, { useState } from 'react';

interface EliteLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const EliteLogo: React.FC<EliteLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-28 h-auto max-w-[120px]',
    md: 'w-40 h-auto max-w-[160px]',
    lg: 'w-56 h-auto max-w-[230px]',
    xl: 'w-64 h-auto max-w-[270px]',
  };

  const logoSrc = '/assets/aistudio/final-logo_bd94f2f7.jpg';

  if (!imageError) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={logoSrc}
          alt="Elite Classic Dry Cleaner"
          className={`${sizeClasses[size]} object-contain mix-blend-multiply`}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    );
  }

  const svgDims = {
    sm: { width: 140, height: 65 },
    md: { width: 190, height: 90 },
    lg: { width: 250, height: 115 },
    xl: { width: 290, height: 130 },
  };

  // Resilient SVG fallback
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={svgDims[size].width}
        height={svgDims[size].height}
        viewBox="0 0 260 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="Elite Classic Dry Cleaner Logo"
      >
        <g fill="#1450A3">
          <path d="M210 22 C210 27 213 30 218 30 C213 30 210 33 210 38 C210 33 207 30 202 30 C207 30 210 27 210 22 Z" />
          <path d="M222 36 C222 39 224 41 227 41 C224 41 222 43 222 46 C222 43 220 41 217 41 C220 41 222 39 222 36 Z" />
        </g>
        <path
          d="M130 38 C130 24 148 20 148 13 C148 8 141 5 135 6 C128 7 125 12 125 14"
          stroke="#1971C2"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M130 38 L30 70 L230 70 Z"
          fill="none"
          stroke="#1971C2"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <text
          x="130"
          y="97"
          textAnchor="middle"
          fill="#0A3275"
          fontFamily="'Plus Jakarta Sans', Impact, sans-serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="2.5"
        >
          CLASSIC
        </text>
        <text
          x="130"
          y="111"
          textAnchor="middle"
          fill="#1971C2"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight="800"
          fontSize="10.5"
          letterSpacing="3"
        >
          DRY CLEANER
        </text>
      </svg>
    </div>
  );
};
