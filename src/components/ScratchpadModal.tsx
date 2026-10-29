/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Pen, RotateCcw, Trash2, X, Maximize2, Minimize2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#38bdf8'); // sky-400
  const [penSize, setPenSize] = useState<number>(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Setup canvas resolution
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Fill dark grid background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, rect.width, rect.height);
      drawGrid(ctx, rect.width, rect.height);

      // Save initial state
      try {
        const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initial]);
      } catch {
        // ignore
      }
    }
  }, [isOpen, isExpanded]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    const step = 28;

    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = penSize * 4;
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-10), snap]);
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    soundFx.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHist = history.slice(0, history.length - 1);
    const prevSnap = newHist[newHist.length - 1];
    if (prevSnap) {
      ctx.putImageData(prevSnap, 0, 0);
      setHistory(newHist);
    }
  };

  const handleClear = () => {
    soundFx.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);

    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([snap]);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm transition-all animate-fadeIn">
      <div
        className={`w-full bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-w-5xl h-[85vh]' : 'max-w-2xl h-[520px]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">Math Scratchpad</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Rough calculations & diagrams</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          {/* Tools: Pen vs Eraser */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg">
            <button
              onClick={() => {
                setTool('pen');
                soundFx.playClick();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                tool === 'pen' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => {
                setTool('eraser');
                soundFx.playClick();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                tool === 'eraser' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Color Palettes (if pen active) */}
          {tool === 'pen' && (
            <div className="flex items-center gap-2">
              {[
                { color: '#38bdf8', label: 'Cyan' },
                { color: '#fbbf24', label: 'Amber' },
                { color: '#34d399', label: 'Emerald' },
                { color: '#f87171', label: 'Rose' },
                { color: '#ffffff', label: 'White' },
              ].map(c => (
                <button
                  key={c.color}
                  onClick={() => {
                    setPenColor(c.color);
                    soundFx.playClick();
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    penColor === c.color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* Pen Size Presets */}
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px] mr-1">Stroke:</span>
            {[2, 4, 7].map(size => (
              <button
                key={size}
                onClick={() => setPenSize(size)}
                className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
                  penSize === size ? 'bg-slate-700 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                {size === 2 ? 'S' : size === 4 ? 'M' : 'L'}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Drawing Canvas */}
        <div className="flex-1 relative cursor-crosshair touch-none overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};
