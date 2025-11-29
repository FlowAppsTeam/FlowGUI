import * as React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

// --- Color Conversion Helpers ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) h = 0;
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  let r = 0, g = 0, b = 0;
  h /= 360; s /= 100; v /= 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 100 });
  const [isDraggingSat, setIsDraggingSat] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Sync internal HSV state when external color prop changes
  useEffect(() => {
    const rgb = hexToRgb(color);
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(newHsv);
  }, [color]);

  const updateColorFromHsv = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const handleSatMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSat(true);
    handleSatMove(e);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    handleHueMove(e);
  };

  const handleSatMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!satRef.current) return;
    const rect = satRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);

    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;

    setHsv(prev => {
      updateColorFromHsv(prev.h, s, v);
      return { ...prev, s, v };
    });
  }, [hsv.h]); // Depend on hsv.h to keep hue consistent

  const handleHueMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const h = (x / rect.width) * 360;

    setHsv(prev => {
      updateColorFromHsv(h, prev.s, prev.v);
      return { ...prev, h };
    });
  }, [hsv.s, hsv.v]);

  useEffect(() => {
    const handleUp = () => {
      setIsDraggingSat(false);
      setIsDraggingHue(false);
    };
    const handleMove = (e: MouseEvent) => {
      if (isDraggingSat) handleSatMove(e);
      if (isDraggingHue) handleHueMove(e);
    };

    if (isDraggingSat || isDraggingHue) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingSat, isDraggingHue, handleSatMove, handleHueMove]);

  const rgb = hexToRgb(color);

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: string) => {
    let v = parseInt(val);
    if (isNaN(v)) v = 0;
    v = Math.max(0, Math.min(255, v));
    const newRgb = { ...rgb, [key]: v };
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  // Helper to trigger eye dropper if available (Chrome only mostly)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
      } catch (e) {
        // cancelled
      }
    }
  };

  return (
    <div className="bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl p-3 w-64 select-none flex flex-col gap-3" onClick={e => e.stopPropagation()}>

      {/* Saturation/Value Area */}
      <div
        ref={satRef}
        className="relative w-full h-32 rounded cursor-crosshair overflow-hidden border border-white/10"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onMouseDown={handleSatMouseDown}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm -ml-1.5 -mt-1.5 pointer-events-none"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-3 flex-1">
          {/* Hue Slider */}
          <div
            ref={hueRef}
            className="relative w-full h-3 rounded-full cursor-pointer border border-white/10"
            style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="absolute top-0 bottom-0 w-3 h-3 bg-white border border-gray-400 rounded-full -ml-1.5 shadow"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
        </div>

        {/* Preview Circle & Eyedropper */}
        <div className="flex gap-2 items-center">
          <button onClick={handleEyeDropper} className="text-gray-400 hover:text-white" title="Pick Color">
            <Pipette size={16} />
          </button>
          <div className="w-8 h-8 rounded-full border border-gray-500 shadow-inner" style={{ backgroundColor: color }} />
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-4 gap-2">
        {/* Hex Input */}
        <div className="col-span-4 flex items-center bg-[#1e1e1e] border border-[#404040] rounded px-2">
          <span className="text-gray-500 text-xs font-mono">#</span>
          <input
            type="text"
            value={color.replace('#', '')}
            onChange={(e) => onChange(`#${e.target.value}`)}
            className="w-full bg-transparent border-none text-white text-xs font-mono py-1 px-1 focus:ring-0 outline-none uppercase"
          />
        </div>

        {/* RGB Inputs */}
        <div className="col-span-1">
          <input
            type="number" min="0" max="255"
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#404040] rounded text-center text-white text-xs py-1 outline-none focus:border-blue-500"
          />
          <div className="text-[9px] text-gray-500 text-center mt-0.5">R</div>
        </div>
        <div className="col-span-1">
          <input
            type="number" min="0" max="255"
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#404040] rounded text-center text-white text-xs py-1 outline-none focus:border-blue-500"
          />
          <div className="text-[9px] text-gray-500 text-center mt-0.5">G</div>
        </div>
        <div className="col-span-1">
          <input
            type="number" min="0" max="255"
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#404040] rounded text-center text-white text-xs py-1 outline-none focus:border-blue-500"
          />
          <div className="text-[9px] text-gray-500 text-center mt-0.5">B</div>
        </div>
      </div>

    </div>
  );
};

export const ColorPickerPopover: React.FC<{ color: string, onChange: (c: string) => void }> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={popoverRef}>
      <div
        className="flex items-center gap-2 cursor-pointer bg-mc-bg border border-mc-border rounded p-1 hover:border-gray-500 transition-colors w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-4 h-4 rounded-sm shadow-sm border border-gray-600 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-mono text-gray-300 uppercase flex-1 truncate select-none">
          {color}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <ColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
};
