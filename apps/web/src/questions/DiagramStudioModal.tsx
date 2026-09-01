import React, { useState, useRef } from 'react';
import {
  Sparkles, X, Check, Trash2, Undo, Redo, Download, Plus,
  Move, Square, Circle, Triangle, ArrowUpRight, Type,
  Minus, Layers, RotateCcw, Palette, HelpCircle
} from 'lucide-react';

interface DiagramStudioModalProps {
  isOpen: boolean;
  initialSvg?: string;
  onClose: () => void;
  onSaveDiagram: (svgContent: string) => void;
}

type ToolType = 'select' | 'rect' | 'circle' | 'triangle' | 'right_triangle' | 'line' | 'arrow' | 'dimension' | 'resistor' | 'capacitor' | 'battery' | 'lens' | 'text';

interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  fill: string;
}

export const DiagramStudioModal: React.FC<DiagramStudioModalProps> = ({
  isOpen,
  initialSvg = '',
  onClose,
  onSaveDiagram
}) => {
  const [activeTool, setActiveTool] = useState<ToolType>('rect');
  const [strokeColor, setStrokeColor] = useState<string>('#0f172a');
  const [fillColor, setFillColor] = useState<string>('none');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);

  const [textInput, setTextInput] = useState<string>('R_1 = 4\\Omega');
  const svgRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;

  // Preset diagrams for STEM questions
  const stemPresets = [
    {
      name: 'Circuit with Resistors',
      category: 'Physics',
      create: (): CanvasElement[] => [
        { id: '1', type: 'battery', x: 80, y: 150, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '2', type: 'line', x: 80, y: 110, x2: 200, y2: 110, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '3', type: 'resistor', x: 200, y: 110, stroke: '#0284c7', strokeWidth: 2.5, strokeStyle: 'solid', fill: 'none' },
        { id: '4', type: 'line', x: 280, y: 110, x2: 400, y2: 110, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '5', type: 'resistor', x: 400, y: 110, stroke: '#0284c7', strokeWidth: 2.5, strokeStyle: 'solid', fill: 'none' },
        { id: '6', type: 'line', x: 480, y: 110, x2: 520, y2: 110, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '7', type: 'line', x: 520, y: 110, x2: 520, y2: 220, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '8', type: 'line', x: 520, y: 220, x2: 80, y2: 220, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '9', type: 'line', x: 80, y: 220, x2: 80, y2: 190, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '10', type: 'text', x: 240, y: 90, text: 'R_1 = 6 Ω', stroke: '#0369a1', strokeWidth: 1, strokeStyle: 'solid', fill: '#0369a1' },
        { id: '11', type: 'text', x: 440, y: 90, text: 'R_2 = 12 Ω', stroke: '#0369a1', strokeWidth: 1, strokeStyle: 'solid', fill: '#0369a1' },
        { id: '12', type: 'text', x: 40, y: 160, text: '12V', stroke: '#b91c1c', strokeWidth: 1, strokeStyle: 'solid', fill: '#b91c1c' }
      ]
    },
    {
      name: 'Projectile Motion',
      category: 'Physics',
      create: (): CanvasElement[] => [
        { id: '1', type: 'line', x: 60, y: 240, x2: 540, y2: 240, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '2', type: 'line', x: 60, y: 240, x2: 60, y2: 40, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '3', type: 'arrow', x: 60, y: 240, x2: 160, y2: 140, stroke: '#0284c7', strokeWidth: 2.5, strokeStyle: 'solid', fill: 'none' },
        { id: '4', type: 'text', x: 170, y: 135, text: 'v₀', stroke: '#0369a1', strokeWidth: 1, strokeStyle: 'solid', fill: '#0369a1' },
        { id: '5', type: 'circle', x: 300, y: 90, width: 8, stroke: '#e11d48', strokeWidth: 2, strokeStyle: 'solid', fill: '#fda4af' },
        { id: '6', type: 'dimension', x: 300, y: 90, x2: 300, y2: 240, stroke: '#64748b', strokeWidth: 1.5, strokeStyle: 'dashed', fill: 'none' },
        { id: '7', type: 'text', x: 310, y: 170, text: 'H_max', stroke: '#475569', strokeWidth: 1, strokeStyle: 'solid', fill: '#475569' },
        { id: '8', type: 'dimension', x: 60, y: 260, x2: 500, y2: 260, stroke: '#64748b', strokeWidth: 1.5, strokeStyle: 'solid', fill: 'none' },
        { id: '9', type: 'text', x: 270, y: 280, text: 'Range (R)', stroke: '#0f172a', strokeWidth: 1, strokeStyle: 'solid', fill: '#0f172a' }
      ]
    },
    {
      name: 'Optics Convex Lens',
      category: 'Physics',
      create: (): CanvasElement[] => [
        { id: '1', type: 'line', x: 50, y: 160, x2: 550, y2: 160, stroke: '#94a3b8', strokeWidth: 1.5, strokeStyle: 'dashed', fill: 'none' },
        { id: '2', type: 'lens', x: 300, y: 160, stroke: '#0284c7', strokeWidth: 2.5, strokeStyle: 'solid', fill: '#e0f2fe' },
        { id: '3', type: 'arrow', x: 140, y: 160, x2: 140, y2: 90, stroke: '#16a34a', strokeWidth: 2.5, strokeStyle: 'solid', fill: 'none' },
        { id: '4', type: 'text', x: 130, y: 80, text: 'AB (Object)', stroke: '#15803d', strokeWidth: 1, strokeStyle: 'solid', fill: '#15803d' },
        { id: '5', type: 'line', x: 140, y: 90, x2: 300, y2: 90, stroke: '#e11d48', strokeWidth: 1.5, strokeStyle: 'solid', fill: 'none' },
        { id: '6', type: 'line', x: 300, y: 90, x2: 480, y2: 210, stroke: '#e11d48', strokeWidth: 1.5, strokeStyle: 'solid', fill: 'none' },
        { id: '7', type: 'line', x: 140, y: 90, x2: 480, y2: 210, stroke: '#d97706', strokeWidth: 1.5, strokeStyle: 'solid', fill: 'none' },
        { id: '8', type: 'arrow', x: 480, y: 160, x2: 480, y2: 210, stroke: '#dc2626', strokeWidth: 2.5, strokeStyle: 'solid', fill: 'none' },
        { id: '9', type: 'text', x: 460, y: 230, text: "A'B' (Image)", stroke: '#b91c1c', strokeWidth: 1, strokeStyle: 'solid', fill: '#b91c1c' }
      ]
    },
    {
      name: 'Inclined Plane & Block',
      category: 'Mechanics',
      create: (): CanvasElement[] => [
        { id: '1', type: 'right_triangle', x: 80, y: 240, width: 360, height: 160, stroke: '#0f172a', strokeWidth: 2, strokeStyle: 'solid', fill: '#f1f5f9' },
        { id: '2', type: 'rect', x: 240, y: 140, width: 60, height: 40, stroke: '#0284c7', strokeWidth: 2, strokeStyle: 'solid', fill: '#e0f2fe' },
        { id: '3', type: 'text', x: 260, y: 165, text: 'm', stroke: '#0369a1', strokeWidth: 1, strokeStyle: 'solid', fill: '#0369a1' },
        { id: '4', type: 'arrow', x: 270, y: 160, x2: 270, y2: 220, stroke: '#dc2626', strokeWidth: 2, strokeStyle: 'solid', fill: 'none' },
        { id: '5', type: 'text', x: 275, y: 215, text: 'mg', stroke: '#b91c1c', strokeWidth: 1, strokeStyle: 'solid', fill: '#b91c1c' },
        { id: '6', type: 'text', x: 120, y: 230, text: 'θ', stroke: '#0f172a', strokeWidth: 1, strokeStyle: 'solid', fill: '#0f172a' }
      ]
    }
  ];

  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (600 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (320 / rect.height));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSvgCoordinates(e);
    setStartPoint(pt);
    setIsDrawing(true);

    if (activeTool === 'text') {
      const newEl: CanvasElement = {
        id: `el-${Date.now()}`,
        type: 'text',
        x: pt.x,
        y: pt.y,
        text: textInput || 'Label',
        stroke: strokeColor,
        strokeWidth: 1,
        strokeStyle: 'solid',
        fill: strokeColor
      };
      setElements(prev => [...prev, newEl]);
      setIsDrawing(false);
      return;
    }

    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type: activeTool,
      x: pt.x,
      y: pt.y,
      width: 0,
      height: 0,
      x2: pt.x,
      y2: pt.y,
      stroke: strokeColor,
      strokeWidth,
      strokeStyle,
      fill: fillColor
    };
    setCurrentElement(newEl);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentElement) return;
    const pt = getSvgCoordinates(e);

    const w = pt.x - startPoint.x;
    const h = pt.y - startPoint.y;

    setCurrentElement({
      ...currentElement,
      x: w < 0 ? pt.x : startPoint.x,
      y: h < 0 ? pt.y : startPoint.y,
      width: Math.abs(w),
      height: Math.abs(h),
      x2: pt.x,
      y2: pt.y
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentElement) {
      if (
        (currentElement.width && currentElement.width > 5) ||
        (currentElement.x2 !== undefined && Math.hypot(currentElement.x2 - currentElement.x, (currentElement.y2 || 0) - currentElement.y) > 5)
      ) {
        setElements(prev => [...prev, currentElement]);
      }
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      setElements(prev => prev.filter(el => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  const handleClearCanvas = () => {
    if (confirm('Clear entire diagram canvas?')) {
      setElements([]);
      setSelectedElementId(null);
    }
  };

  const generateSvgString = (): string => {
    // Generate clean SVG markup string
    let inner = '';
    elements.forEach(el => {
      const dash = el.strokeStyle === 'dashed' ? 'stroke-dasharray="6,4"' : el.strokeStyle === 'dotted' ? 'stroke-dasharray="2,3"' : '';
      if (el.type === 'rect') {
        inner += `<rect x="${el.x}" y="${el.y}" width="${el.width || 40}" height="${el.height || 40}" rx="4" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="${el.fill}" ${dash}/>`;
      } else if (el.type === 'circle') {
        const r = Math.max((el.width || 40) / 2, (el.height || 40) / 2);
        inner += `<circle cx="${el.x + r}" cy="${el.y + r}" r="${r}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="${el.fill}" ${dash}/>`;
      } else if (el.type === 'right_triangle') {
        const w = el.width || 80;
        const h = el.height || 60;
        inner += `<polygon points="${el.x},${el.y} ${el.x + w},${el.y} ${el.x + w},${el.y - h}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="${el.fill}" ${dash}/>`;
      } else if (el.type === 'triangle') {
        const w = el.width || 80;
        const h = el.height || 60;
        inner += `<polygon points="${el.x + w / 2},${el.y - h} ${el.x},${el.y} ${el.x + w},${el.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="${el.fill}" ${dash}/>`;
      } else if (el.type === 'line') {
        inner += `<line x1="${el.x}" y1="${el.y}" x2="${el.x2 || el.x}" y2="${el.y2 || el.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" ${dash}/>`;
      } else if (el.type === 'arrow') {
        inner += `<line x1="${el.x}" y1="${el.y}" x2="${el.x2 || el.x}" y2="${el.y2 || el.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" marker-end="url(#arrowhead)" ${dash}/>`;
      } else if (el.type === 'dimension') {
        inner += `<line x1="${el.x}" y1="${el.y}" x2="${el.x2 || el.x}" y2="${el.y2 || el.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" marker-start="url(#dimtick)" marker-end="url(#dimtick)" ${dash}/>`;
      } else if (el.type === 'resistor') {
        inner += `<path d="M ${el.x} ${el.y} l 10 -15 l 20 30 l 20 -30 l 20 30 l 10 -15" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="none"/>`;
      } else if (el.type === 'battery') {
        inner += `<g><line x1="${el.x}" y1="${el.y - 20}" x2="${el.x}" y2="${el.y + 20}" stroke="${el.stroke}" stroke-width="3"/><line x1="${el.x + 12}" y1="${el.y - 10}" x2="${el.x + 12}" y2="${el.y + 10}" stroke="${el.stroke}" stroke-width="1.5"/></g>`;
      } else if (el.type === 'lens') {
        inner += `<path d="M ${el.x} ${el.y - 45} Q ${el.x + 15} ${el.y}, ${el.x} ${el.y + 45} Q ${el.x - 15} ${el.y}, ${el.x} ${el.y - 45} Z" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" fill="${el.fill}"/>`;
      } else if (el.type === 'text') {
        inner += `<text x="${el.x}" y="${el.y}" font-family="sans-serif" font-size="13" font-weight="bold" fill="${el.fill}">${el.text || ''}</text>`;
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="100%" height="100%">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="${strokeColor}" />
        </marker>
        <marker id="dimtick" markerWidth="6" markerHeight="12" refX="3" refY="6" orient="auto">
          <line x1="3" y1="0" x2="3" y2="12" stroke="${strokeColor}" stroke-width="2" />
        </marker>
      </defs>
      ${inner}
    </svg>`;
  };

  const handleSave = () => {
    const svgCode = generateSvgString();
    onSaveDiagram(svgCode);
    onClose();
  };

  const renderElement = (el: CanvasElement, isSelected: boolean) => {
    const isSel = isSelected ? 'filter drop-shadow(0 0 4px #38bdf8)' : '';
    const dash = el.strokeStyle === 'dashed' ? '6,4' : el.strokeStyle === 'dotted' ? '2,3' : undefined;

    switch (el.type) {
      case 'rect':
        return (
          <rect
            key={el.id}
            x={el.x}
            y={el.y}
            width={el.width || 40}
            height={el.height || 40}
            rx={4}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'circle': {
        const r = Math.max((el.width || 40) / 2, (el.height || 40) / 2);
        return (
          <circle
            key={el.id}
            cx={el.x + r}
            cy={el.y + r}
            r={r}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      }
      case 'right_triangle': {
        const w = el.width || 80;
        const h = el.height || 60;
        return (
          <polygon
            key={el.id}
            points={`${el.x},${el.y} ${el.x + w},${el.y} ${el.x + w},${el.y - h}`}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      }
      case 'triangle': {
        const w = el.width || 80;
        const h = el.height || 60;
        return (
          <polygon
            key={el.id}
            points={`${el.x + w / 2},${el.y - h} ${el.x},${el.y} ${el.x + w},${el.y}`}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      }
      case 'line':
        return (
          <line
            key={el.id}
            x1={el.x}
            y1={el.y}
            x2={el.x2 || el.x}
            y2={el.y2 || el.y}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'arrow':
        return (
          <line
            key={el.id}
            x1={el.x}
            y1={el.y}
            x2={el.x2 || el.x}
            y2={el.y2 || el.y}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            markerEnd="url(#arrowhead_preview)"
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'dimension':
        return (
          <line
            key={el.id}
            x1={el.x}
            y1={el.y}
            x2={el.x2 || el.x}
            y2={el.y2 || el.y}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dash}
            markerStart="url(#dimtick_preview)"
            markerEnd="url(#dimtick_preview)"
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'resistor':
        return (
          <path
            key={el.id}
            d={`M ${el.x} ${el.y} l 10 -15 l 20 30 l 20 -30 l 20 30 l 10 -15`}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            fill="none"
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'battery':
        return (
          <g key={el.id} className={isSel} onClick={() => setSelectedElementId(el.id)}>
            <line x1={el.x} y1={el.y - 20} x2={el.x} y2={el.y + 20} stroke={el.stroke} strokeWidth={3} />
            <line x1={el.x + 12} y1={el.y - 10} x2={el.x + 12} y2={el.y + 10} stroke={el.stroke} strokeWidth={1.5} />
          </g>
        );
      case 'lens':
        return (
          <path
            key={el.id}
            d={`M ${el.x} ${el.y - 45} Q ${el.x + 15} ${el.y}, ${el.x} ${el.y + 45} Q ${el.x - 15} ${el.y}, ${el.x} ${el.y - 45} Z`}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          />
        );
      case 'text':
        return (
          <text
            key={el.id}
            x={el.x}
            y={el.y}
            fontFamily="sans-serif"
            fontSize={13}
            fontWeight="bold"
            fill={el.fill}
            className={isSel}
            onClick={() => setSelectedElementId(el.id)}
          >
            {el.text}
          </text>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-100/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Diagram & STEM Shape Studio
              </h3>
              <p className="text-xs text-slate-500 font-medium">Draw geometric shapes, circuits, optics rays, and attach directly to your question</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {[
              { id: 'rect', icon: Square, label: 'Box' },
              { id: 'circle', icon: Circle, label: 'Circle' },
              { id: 'triangle', icon: Triangle, label: 'Triangle' },
              { id: 'line', icon: Minus, label: 'Line' },
              { id: 'arrow', icon: ArrowUpRight, label: 'Ray Arrow' },
              { id: 'resistor', icon: Sparkles, label: 'Resistor' },
              { id: 'battery', icon: Layers, label: 'Battery' },
              { id: 'lens', icon: Sparkles, label: 'Lens' },
              { id: 'text', icon: Type, label: 'Text Label' }
            ].map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id as ToolType)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeTool === tool.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stroke & Style Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500 text-[11px]">Color:</span>
              {['#0f172a', '#0284c7', '#dc2626', '#16a34a', '#7c3aed', '#d97706'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setStrokeColor(color)}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    strokeColor === color ? 'scale-125 ring-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500 text-[11px]">Fill:</span>
              {['none', '#e0f2fe', '#fef2f2', '#f0fdf4', '#fef3c7'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFillColor(f)}
                  className={`w-5 h-5 rounded border cursor-pointer ${
                    fillColor === f ? 'ring-2 ring-emerald-500' : ''
                  }`}
                  style={{ backgroundColor: f === 'none' ? '#ffffff' : f }}
                  title={f === 'none' ? 'Transparent' : 'Tint Fill'}
                />
              ))}
            </div>

            {activeTool === 'text' && (
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Label (e.g. +q, R_1)"
                className="w-28 p-1 text-xs font-bold border border-slate-300 rounded bg-white"
              />
            )}
          </div>

        </div>

        {/* Workspace Canvas & STEM Presets */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Drawing SVG Canvas */}
          <div className="flex-1 p-4 bg-slate-100 flex items-center justify-center overflow-auto">
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-300 relative overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 600 320"
                width={600}
                height={320}
                className="cursor-crosshair bg-white select-none"
                style={{
                  backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <defs>
                  <marker id="arrowhead_preview" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
                  </marker>
                  <marker id="dimtick_preview" markerWidth="6" markerHeight="12" refX="3" refY="6" orient="auto">
                    <line x1="3" y1="0" x2="3" y2="12" stroke={strokeColor} strokeWidth="2" />
                  </marker>
                </defs>

                {elements.map(el => renderElement(el, el.id === selectedElementId))}
                {currentElement && renderElement(currentElement, false)}
              </svg>
            </div>
          </div>

          {/* STEM Presets Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-4 space-y-3 overflow-y-auto">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 1-Click STEM Presets
            </span>

            <div className="space-y-2">
              {stemPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setElements(preset.create())}
                  className="w-full p-2.5 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-400 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 block">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {preset.category} diagram preset
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              {selectedElementId && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected Element
                </button>
              )}

              <button
                type="button"
                onClick={handleClearCanvas}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Canvas
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-100/90 text-xs">
          <span className="text-slate-500 font-medium">
            {elements.length} elements in diagram
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Attach Diagram to Question</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
