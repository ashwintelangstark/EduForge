import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Crop, Sparkles, RefreshCw, RotateCcw, RotateCw, Check,
  Sliders, Wand2, ShieldAlert, Layers, Image as ImageIcon
} from 'lucide-react';

export type ImageFilterType = 'original' | 'magic_color' | 'auto_hdr' | 'grayscale' | 'bw_scanner' | 'lighten';

export interface ImageStudioModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (processedBase64: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'smart_crop' | 'normal_crop' | 'filters'>('smart_crop');
  const [filter, setFilter] = useState<ImageFilterType>('magic_color');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Loaded image size
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Quad points for Smart Crop (0..1 normalized coordinates)
  const [quadPoints, setQuadPoints] = useState<Point[]>([
    { x: 0.05, y: 0.05 }, // Top-Left
    { x: 0.95, y: 0.05 }, // Top-Right
    { x: 0.95, y: 0.95 }, // Bottom-Right
    { x: 0.05, y: 0.95 }  // Bottom-Left
  ]);

  // Rectangular bounds for Normal Crop (0..1 normalized coordinates)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9
  });

  const [activeHandle, setActiveHandle] = useState<number | string | null>(null);

  // Reset state when a new image source is passed
  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        setImageSize({ width: img.width, height: img.height });
        setRotation(0);
        setFilter('magic_color');
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setQuadPoints([
          { x: 0.05, y: 0.05 },
          { x: 0.95, y: 0.05 },
          { x: 0.95, y: 0.95 },
          { x: 0.05, y: 0.95 }
        ]);
        setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Handle Dragging Quad or Rect handles
  const handleMouseDown = (handleId: number | string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handleId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (activeHandle === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (typeof activeHandle === 'number') {
      // Quad handle 0..3
      setQuadPoints(prev => {
        const next = [...prev];
        next[activeHandle] = { x, y };
        return next;
      });
    } else if (typeof activeHandle === 'string') {
      // Normal crop rect handle e.g. 'tl', 'tr', 'bl', 'br'
      setCropRect(prev => {
        let { x: rx, y: ry, w: rw, h: rh } = prev;
        if (activeHandle === 'tl') {
          const nw = rx + rw - x;
          const nh = ry + rh - y;
          if (nw > 0.05 && nh > 0.05) { rx = x; ry = y; rw = nw; rh = nh; }
        } else if (activeHandle === 'tr') {
          const nw = x - rx;
          const nh = ry + rh - y;
          if (nw > 0.05 && nh > 0.05) { ry = y; rw = nw; rh = nh; }
        } else if (activeHandle === 'bl') {
          const nw = rx + rw - x;
          const nh = y - ry;
          if (nw > 0.05 && nh > 0.05) { rx = x; rw = nw; rh = nh; }
        } else if (activeHandle === 'br') {
          const nw = x - rx;
          const nh = y - ry;
          if (nw > 0.05 && nh > 0.05) { rw = nw; rh = nh; }
        }
        return { x: rx, y: ry, w: rw, h: rh };
      });
    }
  }, [activeHandle]);

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  // Perspective Homography Matrix Crop & Filter Canvas Renderer
  const processAndGenerateOutput = (): string => {
    const img = imgRef.current;
    if (!img) return imageSrc;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    const w = img.width;
    const h = img.height;

    if (activeTab === 'smart_crop') {
      // Perspective Warp Crop
      const p0 = { x: quadPoints[0].x * w, y: quadPoints[0].y * h };
      const p1 = { x: quadPoints[1].x * w, y: quadPoints[1].y * h };
      const p2 = { x: quadPoints[2].x * w, y: quadPoints[2].y * h };
      const p3 = { x: quadPoints[3].x * w, y: quadPoints[3].y * h };

      const topW = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const botW = Math.hypot(p2.x - p3.x, p2.y - p3.y);
      const targetW = Math.round(Math.max(topW, botW));

      const leftH = Math.hypot(p3.x - p0.x, p3.y - p0.y);
      const rightH = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const targetH = Math.round(Math.max(leftH, rightH));

      canvas.width = Math.max(100, targetW);
      canvas.height = Math.max(100, targetH);

      // Bilinear mesh perspective sampling onto output canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = w;
      srcCanvas.height = h;
      const srcCtx = srcCanvas.getContext('2d');
      if (srcCtx) {
        srcCtx.drawImage(img, 0, 0);
        const srcData = srcCtx.getImageData(0, 0, w, h);
        const outData = ctx.createImageData(canvas.width, canvas.height);

        const dw = canvas.width;
        const dh = canvas.height;

        for (let y = 0; y < dh; y++) {
          const v = y / dh;
          for (let x = 0; x < dw; x++) {
            const u = x / dw;
            // Interpolate source coordinate inside quadrilateral
            const sx = Math.round((1 - u) * (1 - v) * p0.x + u * (1 - v) * p1.x + u * v * p2.x + (1 - u) * v * p3.x);
            const sy = Math.round((1 - u) * (1 - v) * p0.y + u * (1 - v) * p1.y + u * v * p2.y + (1 - u) * v * p3.y);

            const clampedX = Math.max(0, Math.min(w - 1, sx));
            const clampedY = Math.max(0, Math.min(h - 1, sy));

            const srcIdx = (clampedY * w + clampedX) * 4;
            const outIdx = (y * dw + x) * 4;

            outData.data[outIdx] = srcData.data[srcIdx];
            outData.data[outIdx + 1] = srcData.data[srcIdx + 1];
            outData.data[outIdx + 2] = srcData.data[srcIdx + 2];
            outData.data[outIdx + 3] = srcData.data[srcIdx + 3];
          }
        }
        ctx.putImageData(outData, 0, 0);
      }
    } else if (activeTab === 'normal_crop') {
      // Normal Rectangular Crop
      const cx = Math.round(cropRect.x * w);
      const cy = Math.round(cropRect.y * h);
      const cw = Math.round(cropRect.w * w);
      const ch = Math.round(cropRect.h * h);

      canvas.width = Math.max(10, cw);
      canvas.height = Math.max(10, ch);
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
    } else {
      // Full size with filter adjustments
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);
    }

    // Apply Filter & Color Adjustments to Canvas
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const bMult = brightness / 100;
    const cMult = contrast / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness & Contrast adjustment
      r = Math.min(255, Math.max(0, (r - 128) * cMult + 128 * bMult));
      g = Math.min(255, Math.max(0, (g - 128) * cMult + 128 * bMult));
      b = Math.min(255, Math.max(0, (b - 128) * cMult + 128 * bMult));

      if (filter === 'magic_color' || filter === 'auto_hdr') {
        // Enhance document contrast & saturation
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, r + (r - avg) * 0.4));
        g = Math.min(255, Math.max(0, g + (g - avg) * 0.4));
        b = Math.min(255, Math.max(0, b + (b - avg) * 0.4));
        // Soft white thresholding for paper backgrounds
        if (r > 195 && g > 195 && b > 195) {
          r = Math.min(255, r * 1.08);
          g = Math.min(255, g * 1.08);
          b = Math.min(255, b * 1.08);
        }
      } else if (filter === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray; g = gray; b = gray;
      } else if (filter === 'bw_scanner') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const bw = gray > 140 ? 255 : 0;
        r = bw; g = bw; b = bw;
      } else if (filter === 'lighten') {
        r = Math.min(255, r * 1.18);
        g = Math.min(255, g * 1.18);
        b = Math.min(255, b * 1.18);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);

    // Apply rotation if required
    if (rotation !== 0) {
      const rotCanvas = document.createElement('canvas');
      const rotCtx = rotCanvas.getContext('2d');
      if (rotCtx) {
        if (rotation % 180 !== 0) {
          rotCanvas.width = canvas.height;
          rotCanvas.height = canvas.width;
        } else {
          rotCanvas.width = canvas.width;
          rotCanvas.height = canvas.height;
        }
        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate((rotation * Math.PI) / 180);
        rotCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        return rotCanvas.toDataURL('image/png', 0.95);
      }
    }

    return canvas.toDataURL('image/png', 0.95);
  };

  const handleSave = () => {
    const result = processAndGenerateOutput();
    onSave(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top Studio Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Image Studio & Document Scanner</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded-md border border-emerald-500/30 uppercase tracking-wider">Pro</span>
              </h3>
              <p className="text-xs text-slate-400">Crop, un-skew tilted book photos, and apply high-clarity document scanner filters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('smart_crop')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'smart_crop'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Smart Crop (Perspective Warp)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('normal_crop')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'normal_crop'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Normal Crop</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'filters'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scanner Filters & Enhancement</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Left</span>
            </button>
            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Right</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Workspace */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-hidden flex items-center justify-center relative">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-full aspect-auto flex items-center justify-center select-none"
            style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}
          >
            <img
              src={imageSrc}
              alt="Workspace"
              className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
            />

            {/* Smart Crop Quadrilateral Overlay with Handles */}
            {activeTab === 'smart_crop' && containerRef.current && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <polygon
                  points={quadPoints.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ')}
                  fill="rgba(16, 185, 129, 0.25)"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              </svg>
            )}

            {activeTab === 'smart_crop' && quadPoints.map((pt, idx) => (
              <div
                key={idx}
                onMouseDown={handleMouseDown(idx)}
                className="absolute w-6 h-6 -ml-3 -mt-3 bg-emerald-400 border-2 border-white rounded-full shadow-lg shadow-emerald-500/50 cursor-move z-20 flex items-center justify-center transition-transform hover:scale-125 active:scale-110"
                style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
              >
                <div className="w-2 h-2 bg-emerald-950 rounded-full" />
              </div>
            ))}

            {/* Normal Crop Rectangular Overlay with 4 Corner Handles */}
            {activeTab === 'normal_crop' && (
              <div
                className="absolute border-2 border-dashed border-sky-400 bg-sky-500/20 z-10 pointer-events-none"
                style={{
                  left: `${cropRect.x * 100}%`,
                  top: `${cropRect.y * 100}%`,
                  width: `${cropRect.w * 100}%`,
                  height: `${cropRect.h * 100}%`
                }}
              >
                {['tl', 'tr', 'bl', 'br'].map(pos => (
                  <div
                    key={pos}
                    onMouseDown={handleMouseDown(pos)}
                    className={`absolute w-5 h-5 bg-sky-400 border-2 border-white rounded-md shadow-md cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125 ${
                      pos === 'tl' ? '-top-2.5 -left-2.5' :
                      pos === 'tr' ? '-top-2.5 -right-2.5' :
                      pos === 'bl' ? '-bottom-2.5 -left-2.5' : '-bottom-2.5 -right-2.5'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Scanner Filter Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Presets:
            </span>

            {[
              { id: 'original', name: 'Original', desc: 'No filter' },
              { id: 'magic_color', name: 'Magic Color', desc: 'Auto HDR & White background' },
              { id: 'auto_hdr', name: 'Auto HDR', desc: 'Contrast boost' },
              { id: 'grayscale', name: 'Grayscale', desc: 'Clean 8-bit mono' },
              { id: 'bw_scanner', name: 'B&W Scanner', desc: 'High contrast text' },
              { id: 'lighten', name: 'Lighten', desc: 'Remove shadows' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as ImageFilterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col items-start border ${
                  filter === f.id
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{f.name}</span>
                <span className="text-[9px] opacity-75 font-medium">{f.desc}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              {activeTab === 'smart_crop' ? 'Drag green corner handles to fit page edges' : activeTab === 'normal_crop' ? 'Resize crop box to select target region' : 'Filters enhance textbook print quality'}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply & Insert Image</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
