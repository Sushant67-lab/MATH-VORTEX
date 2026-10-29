/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MathDisplayProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MathDisplay: React.FC<MathDisplayProps> = ({
  text,
  className = '',
  size = 'md',
}) => {
  // Check if text is a 2x2 matrix format like "matrix [[a, b], [c, d]]"
  const matrixMatch = text.match(/matrix\s*\[\[(.*?)\]\]/i);

  const sizeClasses = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-2xl',
    xl: 'text-xl sm:text-3xl font-semibold',
  };

  if (matrixMatch) {
    // Render as visual matrix brackets
    const inside = matrixMatch[1]; // "a, b], [c, d"
    const rows = inside.split('],').map(r => r.replace(/[\[\]]/g, '').split(',').map(s => s.trim()));

    return (
      <div className={`inline-flex flex-col items-center gap-1 my-1 font-mono ${className}`}>
        <span className="text-xs text-slate-400">Matrix determinant</span>
        <div className="flex items-center">
          <div className="border-l-2 border-y-2 border-cyan-500/70 w-2.5 h-14 rounded-l-sm" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-1 text-center font-mono font-bold text-slate-100 text-lg">
            {rows.flat().map((item, idx) => (
              <span key={idx}>{item}</span>
            ))}
          </div>
          <div className="border-r-2 border-y-2 border-cyan-500/70 w-2.5 h-14 rounded-r-sm" />
        </div>
      </div>
    );
  }

  // Format superscripts like x^2, x^3
  const formatted = text
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^4/g, '⁴')
    .replace(/\^5/g, '⁵')
    .replace(/\^6/g, '⁶')
    .replace(/\^7/g, '⁷')
    .replace(/\^8/g, '⁸');

  return (
    <div
      className={`font-mono tracking-tight select-text text-slate-100 ${sizeClasses[size]} ${className}`}
    >
      {formatted}
    </div>
  );
};
