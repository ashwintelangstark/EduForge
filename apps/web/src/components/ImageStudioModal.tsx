import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Crop, Sparkles, RefreshCw, RotateCcw, RotateCw, Check,
  Sliders, Wand2, ShieldAlert, Layers, Image as ImageIcon, Loader2
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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [effectiveSrc, setEffectiveSrc] = useState<string>(imageSrc || '');

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

  // Safely initialize & prepare image src (converting remote/cors URLs to local data urls if needed)
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    const setupImage = async () => {
      let resolvedSrc = imageSrc;

      // If it's a remote URL, try to fetch as blob to avoid canvas tainting
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('/api') || imageSrc.startsWith('/assets')) {
        try {
          const resp = await fetch(imageSrc, { mode: 'cors' });
          if (resp.ok) {
            const blob = await resp.blob();
            resolvedSrc = await new Promise<string>((res, rej) => {
              const r = new FileReader();
              r.onload = () => res(r.result as string);
              r.onerror = rej;
              r.readAsDataURL(blob);
            });
          }
        } catch {
          // Fallback to original imageSrc
          resolvedSrc = imageSrc;
        }
      }

      if (!isMounted) return;
      setEffectiveSrc(resolvedSrc);

      const img = new Image();
      // Try anonymous first
      if (!resolvedSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        if (!isMounted) return;
        imgRef.current = img;
        setImageSize({ width: img.naturalWidth || img.width || 800, height: img.naturalHeight || img.height || 600 });
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
        setIsLoading(false);
      };

      img.onerror = () => {
        if (!isMounted) return;
        // Retry without crossOrigin
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (!isMounted) return;
          imgRef.current = fallbackImg;
          setImageSize({ width: fallbackImg.naturalWidth || fallbackImg.width || 800, height: fallbackImg.naturalHeight || fallbackImg.height || 600 });
          setIsLoading(false);
        };
        fallbackImg.onerror = () => {
          if (!isMounted) return;
          setIsLoading(false);
        };
        fallbackImg.src = resolvedSrc;
      };

      img.src = resolvedSrc;
    };

    setupImage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, imageSrc]);

  // Handle Dragging Quad or Rect handles
  const handleMouseDown = (handleId: number | string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handleId);
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (activeHandle === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

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
          if (nw > 0.05 && nh > 0.05) { rx = rx; ry = y; rw = nw; rh = nh; }
        } else if (activeHandle === 'bl') {
          const nw = rx + rw - x;
          const nh = y - ry;
          if (nw > 0.05 && nh > 0.05) { rx = x; ry = ry; rw = nw; rh = nh; }
        } else if (activeHandle === 'br') {
          const nw = x - rx;
          const nh = y - ry;
          if (nw > 0.05 && nh > 0.05) { rw = nw; rh = nh; }
        }
        return { x: rx, y: ry, w: rw, h: rh };
      });
    }
  }, [activeHandle]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);

  const handleEnd = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [activeHandle, handleMouseMove, handleTouchMove, handleEnd]);

  // Perspective Homography Matrix Crop & Filter Canvas Renderer
  const processAndGenerateOutput = (): string => {
    const img = imgRef.current;
    if (!img) return effectiveSrc || imageSrc;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return effectiveSrc || imageSrc;

      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 600;

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

        canvas.width = Math.max(100, Math.min(2400, targetW));
        canvas.height = Math.max(100, Math.min(2400, targetH));

        // Bilinear mesh perspective sampling onto output canvas
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = w;
        srcCanvas.height = h;
        const srcCtx = srcCanvas.getContext('2d');
        if (srcCtx) {
          srcCtx.drawImage(img, 0, 0, w, h);
          try {
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
          } catch {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
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
        ctx.drawImage(img, 0, 0, w, h);
      }

      // Apply Filter & Color Adjustments to Canvas Pixel Data
      try {
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
            const avg = (r + g + b) / 3;
            r = Math.min(255, Math.max(0, r + (r - avg) * 0.35));
            g = Math.min(255, Math.max(0, g + (g - avg) * 0.35));
            b = Math.min(255, Math.max(0, b + (b - avg) * 0.35));
            if (r > 190 && g > 190 && b > 190) {
              r = Math.min(255, r * 1.08);
              g = Math.min(255, g * 1.08);
              b = Math.min(255, b * 1.08);
            }
          } else if (filter === 'grayscale') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray; g = gray; b = gray;
          } else if (filter === 'bw_scanner') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const bw = gray > 135 ? 255 : 0;
            r = bw; g = bw; b = bw;
          } else if (filter === 'lighten') {
            r = Math.min(255, r * 1.15);
            g = Math.min(255, g * 1.15);
            b = Math.min(255, b * 1.15);
          }

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }

        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        console.warn('Canvas pixel manipulation bypassed due to cross-origin security:', e);
      }

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
    } catch (err) {
      console.error('Error in processAndGenerateOutput:', err);
      return effectiveSrc || imageSrc;
    }
  };

  const handleSave = () => {
    let result = processAndGenerateOutput();
    if (!result || result.length < 50) {
      result = effectiveSrc || imageSrc;
    }
    onSave(result);
    onClose();
  };

  const handleResetAll = () => {
    setRotation(0);
    setFilter('original');
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

  const filterCssStyle = React.useMemo(() => {
    let base = '';
    switch (filter) {
      case 'magic_color':
        base = 'contrast(1.35) saturate(1.25) brightness(1.05)';
        break;
      case 'auto_hdr':
        base = 'contrast(1.45) saturate(1.35) brightness(1.1)';
        break;
      case 'grayscale':
        base = 'grayscale(100%) contrast(1.2)';
        break;
      case 'bw_scanner':
        base = 'grayscale(100%) contrast(2.2) brightness(0.95)';
        break;
      case 'lighten':
        base = 'brightness(1.2) contrast(1.1)';
        break;
      default:
        base = 'none';
        break;
    }

    const sliders = `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100})`;
    return base === 'none' ? sliders : `${base} ${sliders}`;
  }, [filter, brightness, contrast, saturation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden">
        
        {/* Top Studio Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Image Studio & Document Scanner</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded-md border border-emerald-500/30 uppercase tracking-wider">HD PRO</span>
              </h3>
              <p className="text-xs text-slate-400">Crop, un-skew tilted textbook photos, and apply high-clarity document scanner filters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset all crop and filter adjustments"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950 border-b border-slate-800 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
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
              <span>Scanner Filters & Sliders</span>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-emerald-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold text-slate-300">Loading High-Definition Image Studio...</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative max-w-full max-h-full aspect-auto flex items-center justify-center select-none"
              style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}
            >
              <img
                src={effectiveSrc || imageSrc}
                alt="Workspace"
                style={{ filter: filterCssStyle }}
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none transition-all duration-150"
              />

              {/* Smart Crop Quadrilateral Overlay with Handles */}
              {activeTab === 'smart_crop' && (
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
                  onTouchStart={handleMouseDown(idx)}
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
                      onTouchStart={handleMouseDown(pos)}
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
          )}
        </div>

        {/* Bottom Scanner Filter & Adjustment Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
          
          {/* Preset Buttons */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Presets:
            </span>

            {[
              { id: 'original', name: 'Original', desc: 'Natural colors' },
              { id: 'magic_color', name: 'Magic Color', desc: 'Auto HDR & White bg' },
              { id: 'auto_hdr', name: 'Auto HDR', desc: 'Boost clarity' },
              { id: 'grayscale', name: 'Grayscale', desc: 'Clean 8-bit mono' },
              { id: 'bw_scanner', name: 'B&W Scanner', desc: 'Pure black & white' },
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

          {/* Sliders when filters tab is active */}
          {activeTab === 'filters' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold w-20">Brightness: {brightness}%</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold w-20">Contrast: {contrast}%</span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={e => setContrast(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold w-20">Saturation: {saturation}%</span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={e => setSaturation(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              {activeTab === 'smart_crop' ? 'Drag the 4 corner handles to align with tilted textbook page edges' : activeTab === 'normal_crop' ? 'Drag corner handles to crop exact diagram region' : 'Use document presets and sliders to enhance textbook quality'}
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
                disabled={isLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply & Save Image</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
