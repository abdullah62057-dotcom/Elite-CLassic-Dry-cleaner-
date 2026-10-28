import React from 'react';

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  width = 180,
  height = 42,
  showText = true,
  className = '',
}) => {
  // Deterministic Code-128 style pseudo bar pattern generation for standard visual rendering
  const generateBars = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) & 0xffffffff;
    }

    const bars: { x: number; w: number }[] = [];
    let currentX = 5;
    const totalBars = 36;
    const unitWidth = (width - 10) / (totalBars * 2);

    // Start guard
    bars.push({ x: currentX, w: unitWidth * 1.5 });
    currentX += unitWidth * 2.5;
    bars.push({ x: currentX, w: unitWidth });
    currentX += unitWidth * 2;

    // Data bars derived from character stream
    for (let i = 0; i < totalBars; i++) {
      const charCode = text.charCodeAt(i % text.length) + (hash >> (i % 16));
      const barThickness = ((charCode % 3) + 1) * unitWidth * 0.9;
      const spaceThickness = (((charCode >> 2) % 2) + 1) * unitWidth * 0.9;

      bars.push({ x: currentX, w: barThickness });
      currentX += barThickness + spaceThickness;
      if (currentX > width - 15) break;
    }

    // Stop guard
    bars.push({ x: currentX, w: unitWidth * 1.5 });
    bars.push({ x: currentX + unitWidth * 2.5, w: unitWidth * 2 });

    return bars;
  };

  const bars = React.useMemo(() => generateBars(value), [value, width]);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={height - (showText ? 14 : 0)}
        viewBox={`0 0 ${width} ${height - (showText ? 14 : 0)}`}
        fill="currentColor"
        className="text-slate-900"
      >
        <rect width={width} height={height} fill="#FFFFFF" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={2}
            width={bar.w}
            height={height - (showText ? 18 : 4)}
            fill="#0F172A"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-700 font-semibold mt-0.5">
          *{value}*
        </span>
      )}
    </div>
  );
};
