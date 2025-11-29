import * as React from 'react';
const { useRef, useState, useEffect } = React;
import { GuiElement, ElementType, ProjectSettings, EventType, ActionType } from '../types';
import { Check, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Grid, Crosshair, RotateCw, User, Box, ChevronDown, List } from 'lucide-react';

interface CanvasProps {
  elements: GuiElement[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onSelectMultiple?: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<GuiElement>) => void;
  onSnapshot: () => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  settings: ProjectSettings;
  isPreview: boolean;
  screens?: Array<{ id: string; name: string; settings?: { className: string } }>;
  activeScreenId?: string;
  onPreviewScreenChange?: (screenId: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedIds,
  onSelect,
  onSelectMultiple = () => { },
  onUpdateElement,
  onSnapshot,
  isDragging,
  setIsDragging,
  settings,
  isPreview,
  screens = [],
  activeScreenId,
  onPreviewScreenChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, handle: '' });
  const [rotationStart, setRotationStart] = useState({ startAngle: 0, initialRotation: 0, centerX: 0, centerY: 0 });

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showCenterGuides, setShowCenterGuides] = useState(false);

  const [activeSnap, setActiveSnap] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  useEffect(() => {
    setPressedButtons({});
    setHoveredElement(null);
  }, [isPreview]);
  // Preview mode state
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [previewScreenId, setPreviewScreenId] = useState<string | null>(null);

  // Reset preview values when exiting preview mode
  useEffect(() => {
    if (!isPreview) {
      setPreviewValues({});
      setPreviewScreenId(null);
    }
  }, [isPreview]);

  // Refs for accessing latest state in global listeners without re-binding
  const elementsRef = useRef(elements);
  const zoomRef = useRef(zoom);
  const settingsRef = useRef(settings);
  const selectedIdsRef = useRef(selectedIds);
  const dragOffsetRef = useRef(dragOffset);
  const resizeStartRef = useRef(resizeStart);
  const rotationStartRef = useRef(rotationStart);

  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => { resizeStartRef.current = resizeStart; }, [resizeStart]);
  useEffect(() => { rotationStartRef.current = rotationStart; }, [rotationStart]);

  const handleMouseDown = (e: React.MouseEvent, id: string, startX: number, startY: number) => {
    e.stopPropagation();
    e.preventDefault();

    if (isPreview) {
      const el = elements.find(e => e.id === id);
      if (el?.type === ElementType.BUTTON) setPressedButtons(prev => ({ ...prev, [id]: true }));
      return;
    }

    // Handle selection
    const isShift = e.shiftKey;
    const isAlreadySelected = selectedIds.has(id);

    // If shift-clicking or clicking on an unselected item, update selection
    if (isShift || !isAlreadySelected) {
      onSelect(id, isShift);
    }
    // If clicking on already selected item (without shift), don't change selection yet
    // This allows drag to work smoothly with multiple items

    setIsDragging(true);
    setDragOffset({ x: e.clientX / zoom - startX, y: e.clientY / zoom - startY });
  };

  // Execute event in preview mode
  const executeEvent = (el: GuiElement) => {
    const clickEvent = el.events?.[EventType.ON_CLICK];
    if (!clickEvent) return;

    switch (clickEvent.type) {
      case ActionType.OPEN_SCREEN:
        const targetScreen = screens.find(s => s.id === clickEvent.value);
        if (targetScreen && onPreviewScreenChange) {
          onPreviewScreenChange(clickEvent.value);
          setPreviewScreenId(clickEvent.value);
        }
        break;
      case ActionType.EXECUTE_COMMAND:
        alert(`Command executed: /${clickEvent.value}`);
        break;
      case ActionType.PLAY_SOUND:
        alert(`Sound played: ${clickEvent.value}`);
        break;
      case ActionType.CUSTOM_CODE:
        console.log('Custom code would execute:', clickEvent.value);
        alert('Custom code executed (check console)');
        break;
    }
  };

  const handleInteractionClick = (e: React.MouseEvent, el: GuiElement) => {
    e.stopPropagation();
    if (!isPreview) return;

    if (el.type === ElementType.CHECKBOX) {
      setPreviewValues(prev => ({ ...prev, [el.id]: !prev[el.id] }));
    } else if (el.type === ElementType.BUTTON) {
      executeEvent(el);
    }
  };

  const handleSliderInteraction = (e: React.MouseEvent, el: GuiElement) => {
    if (!isPreview || el.type !== ElementType.SLIDER) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.min(1, Math.max(0, clickX / rect.width));
    const range = (el.max || 100) - (el.min || 0);
    let newValue = (el.min || 0) + (range * percent);
    if (el.step && el.step > 0) newValue = Math.round(newValue / el.step) * el.step;
    newValue = Math.min(el.max || 100, Math.max(el.min || 0, newValue));
    setPreviewValues(prev => ({ ...prev, [el.id]: newValue }));
  };

  const handleResizeStart = (e: React.MouseEvent, el: GuiElement, handle: string) => {
    if (isPreview) return;
    e.stopPropagation();
    e.preventDefault(); // Prevent native drag
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width: el.width, height: el.height, left: el.x, top: el.y, handle });
  };

  const handleRotationStart = (e: React.MouseEvent, el: GuiElement) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const centerX = rect.left + (el.x + el.width / 2) * zoom;
    const centerY = rect.top + (el.y + el.height / 2) * zoom;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    setRotationStart({ startAngle, initialRotation: el.rotation || 0, centerX, centerY });
  };

  // Handle mouse down on canvas background for box selection
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isPreview) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
    setIsBoxSelecting(true);
  };

  // Global Event Listeners for smooth dragging outside canvas
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating && !isBoxSelecting) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isPreview) return;

      // Handle box selection
      if (isBoxSelecting && selectionBox && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomRef.current;
        const y = (e.clientY - rect.top) / zoomRef.current;
        setSelectionBox(prev => prev ? { ...prev, endX: x, endY: y } : null);
        return;
      }

      const currentZoom = zoomRef.current;
      const currentElements = elementsRef.current;
      const currentSettings = settingsRef.current;
      const currentSelectedIds = selectedIdsRef.current;

      const firstSelectedId = currentSelectedIds.size > 0 ? Array.from(currentSelectedIds)[0] : null;
      if (!firstSelectedId) return;

      // --- ROTATION ---
      if (isRotating) {
        const rStart = rotationStartRef.current;
        const currentAngle = Math.atan2(e.clientY - rStart.centerY, e.clientX - rStart.centerX) * (180 / Math.PI);
        let angleDiff = currentAngle - rStart.startAngle;
        let newRot = (rStart.initialRotation + angleDiff) % 360;
        if (newRot < 0) newRot += 360;

        if (e.shiftKey) {
          newRot = Math.round(newRot / 15) * 15;
        } else if (showCenterGuides) {
          // Snap to cardinal directions
          const snaps = [0, 90, 180, 270, 360];
          for (const snap of snaps) {
            if (Math.abs(newRot - snap) < 5) {
              newRot = snap;
              break;
            }
          }
        }

        onUpdateElement(firstSelectedId, { rotation: Math.round(newRot) });
        return;
      }

      // --- RESIZING ---
      if (isResizing) {
        const rStart = resizeStartRef.current;
        const dx = (e.clientX - rStart.x) / currentZoom;
        const dy = (e.clientY - rStart.y) / currentZoom;
        const updates: Partial<GuiElement> = {};
        const minSize = 10;

        if (rStart.handle.includes('e')) updates.width = Math.max(minSize, rStart.width + dx);
        if (rStart.handle.includes('s')) updates.height = Math.max(minSize, rStart.height + dy);
        if (rStart.handle.includes('w')) {
          const newWidth = Math.max(minSize, rStart.width - dx);
          updates.width = newWidth;
          updates.x = rStart.left + (rStart.width - newWidth);
        }
        if (rStart.handle.includes('n')) {
          const newHeight = Math.max(minSize, rStart.height - dy);
          updates.height = newHeight;
          updates.y = rStart.top + (rStart.height - newHeight);
        }
        onUpdateElement(firstSelectedId, updates);
        return;
      }

      // --- DRAGGING ---
      if (isDragging) {
        const dOffset = dragOffsetRef.current;
        const rawX = (e.clientX / currentZoom) - dOffset.x;
        const rawY = (e.clientY / currentZoom) - dOffset.y;
        let newX = rawX, newY = rawY;
        let snapXVal: number | null = null, snapYVal: number | null = null;

        if (showCenterGuides) {
          const el = currentElements.find(e => e.id === firstSelectedId);
          if (el) {
            const elWidth = el.width, elHeight = el.height;
            const screenW = currentSettings.screenWidth, screenH = currentSettings.screenHeight;
            const threshold = 8;

            if (Math.abs(newX) < threshold) { newX = 0; snapXVal = 0; }
            else if (Math.abs((newX + elWidth) - screenW) < threshold) { newX = screenW - elWidth; snapXVal = screenW; }
            else {
              const cx = newX + elWidth / 2;
              if (Math.abs(cx - screenW * 0.5) < threshold) { newX = screenW * 0.5 - elWidth / 2; snapXVal = screenW * 0.5; }
              else if (Math.abs(cx - screenW * 0.25) < threshold) { newX = screenW * 0.25 - elWidth / 2; snapXVal = screenW * 0.25; }
              else if (Math.abs(cx - screenW * 0.75) < threshold) { newX = screenW * 0.75 - elWidth / 2; snapXVal = screenW * 0.75; }
            }

            if (Math.abs(newY) < threshold) { newY = 0; snapYVal = 0; }
            else if (Math.abs((newY + elHeight) - screenH) < threshold) { newY = screenH - elHeight; snapYVal = screenH; }
            else {
              const cy = newY + elHeight / 2;
              if (Math.abs(cy - screenH * 0.5) < threshold) { newY = screenH * 0.5 - elHeight / 2; snapYVal = screenH * 0.5; }
              else if (Math.abs(cy - screenH * 0.25) < threshold) { newY = screenH * 0.25 - elHeight / 2; snapYVal = screenH * 0.25; }
              else if (Math.abs(cy - screenH * 0.75) < threshold) { newY = screenH * 0.75 - elHeight / 2; snapYVal = screenH * 0.75; }
            }
          }
        }

        setActiveSnap({ x: snapXVal, y: snapYVal });
        onUpdateElement(firstSelectedId, { x: newX, y: newY });
      }
    };

    const handleWindowMouseUp = () => {
      // Handle box selection completion
      if (isBoxSelecting && selectionBox) {
        const box = selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        // Check if there was meaningful dragging (box size > 5px)
        const hasDragged = Math.abs(maxX - minX) > 5 || Math.abs(maxY - minY) > 5;

        if (hasDragged) {
          // Find all elements that intersect with the selection box
          const selectedElements = elementsRef.current.filter(el => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;

            // Check if element intersects with selection box
            return !(el.x > maxX || elRight < minX || el.y > maxY || elBottom < minY);
          });

          // Select the elements via callback
          if (selectedElements.length > 0 && onSelectMultiple) {
            onSelectMultiple(selectedElements.map(el => el.id));
          } else {
            // No elements selected - clear selection
            onSelect('', false);
          }
        } else {
          // Just a click, not a drag - clear selection
          onSelect('', false);
        }

        setSelectionBox(null);
        setIsBoxSelecting(false);
        return;
      }

      if (isDragging) {
        onSnapshot();
        setActiveSnap({ x: null, y: null });
      }
      if (isResizing) onSnapshot();
      if (isRotating) onSnapshot();
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setPressedButtons({});
      setActiveSnap({ x: null, y: null });
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, isResizing, isRotating, isBoxSelecting, selectionBox, onUpdateElement, onSnapshot, onSelect, onSelectMultiple, setIsDragging, showCenterGuides]);

  // Render element with preview state
  const renderElementVisual = (el: GuiElement, isPressed: boolean, isHovered: boolean) => {
    let transform = isPressed ? 'scale(0.95)' : 'scale(1)';
    let boxShadow = el.shadow?.enabled ? `${el.shadow.xOffset}px ${el.shadow.yOffset}px ${el.shadow.blur}px ${el.shadow.color}` : undefined;
    let borderColor = el.borderColor;
    let filter = undefined;

    if (isHovered && el.hover?.enabled) {
      switch (el.hover.type) {
        case 'SCALE': transform = `scale(${el.hover.scale || 1.05})`; break;
        case 'LIFT': transform = `translateY(-${el.hover.liftAmount || 2}px)`; break;
        case 'SLIDE_RIGHT': transform = `translateX(${el.hover.slideAmount || 5}px)`; break;
        case 'GLOW': boxShadow = `0 0 ${el.hover.glowBlur || 10}px ${el.hover.glowColor || '#fff'}`; break;
        case 'BORDER_PULSE': borderColor = el.hover.glowColor || '#fff'; break;
      }
      if (el.hover.brightness && el.hover.brightness !== 1) filter = `brightness(${el.hover.brightness})`;
    }

    const commonStyle: React.CSSProperties = {
      borderRadius: el.borderRadius ? `${el.borderRadius}px` : '0px',
      opacity: el.opacity !== undefined ? el.opacity : 1,
      fontFamily: el.fontFamily === 'Minecraft' ? '"Press Start 2P", cursive' :
        el.fontFamily === 'Modern' ? '"Inter", sans-serif' :
          el.fontFamily === 'Mono' ? '"JetBrains Mono", monospace' : undefined,
      borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
      borderColor: borderColor || undefined,
      borderStyle: el.borderWidth ? 'solid' : undefined,
      background: el.type === ElementType.IMAGE
        ? 'transparent'
        : (el.gradient?.enabled
          ? `linear-gradient(${el.gradient.direction === 'vertical' ? 'to bottom' : 'to right'}, ${el.gradient.startColor}, ${el.gradient.endColor})`
          : el.color),
      boxShadow: boxShadow,
      backdropFilter: el.backdropBlur ? `blur(${el.backdropBlur}px)` : undefined,
      transition: `all ${el.hover?.duration || 0.2}s cubic-bezier(0.4, 0, 0.2, 1)`,
      transform: transform,
      filter: filter,
    };

    const textStyle: React.CSSProperties = {
      textAlign: el.textAlign || 'center',
      textShadow: el.textShadow !== false ? '2px 2px 0px rgba(0,0,0,0.7)' : 'none',
      width: '100%',
      display: 'block'
    };

    // Get preview value or default
    const previewValue = isPreview && previewValues[el.id] !== undefined ? previewValues[el.id] :
      (el.type === ElementType.CHECKBOX ? el.checked :
        el.type === ElementType.SLIDER ? el.value :
          el.type === ElementType.TEXT_FIELD ? el.label : null);

    switch (el.type) {
      case ElementType.BUTTON:
        return <div style={commonStyle} className="w-full h-full flex items-center justify-center text-white text-[10px] font-medium cursor-pointer" onClick={(e) => handleInteractionClick(e, el)}>{el.label}</div>;

      case ElementType.LABEL:
        return <div style={{ ...commonStyle, background: 'transparent', padding: '2px' }} className="text-white text-[10px] overflow-hidden"><span style={textStyle}>{el.label}</span></div>;

      case ElementType.TEXT_FIELD:
        if (isPreview) {
          return <input type="text" value={previewValue || ''} onChange={(e) => setPreviewValues(prev => ({ ...prev, [el.id]: e.target.value }))} style={{ ...commonStyle, padding: '4px', fontSize: '10px', color: '#fff', outline: 'none' }} className="w-full h-full" placeholder={el.label} />;
        }
        return <div style={{ ...commonStyle, padding: '4px', color: '#888', fontSize: '10px' }} className="w-full h-full overflow-hidden">{el.label || 'Text Field'}</div>;

      case ElementType.PANEL:
      case ElementType.SLOT:
        return <div style={commonStyle} className="w-full h-full"></div>;

      case ElementType.CHECKBOX:
        return <div onClick={(e) => handleInteractionClick(e, el)} style={commonStyle} className="w-full h-full flex items-center gap-1 text-white text-[9px] cursor-pointer overflow-hidden">
          <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center shrink-0" style={{ borderColor: el.color || '#888' }}>
            {previewValue && <Check size={10} strokeWidth={3} />}
          </div>
          <span className="truncate">{el.label}</span>
        </div>;

      case ElementType.SLIDER:
        const sliderValue = previewValue !== undefined ? previewValue : (el.value !== undefined ? el.value : (el.min || 0));
        const sliderPercent = ((sliderValue - (el.min || 0)) / ((el.max || 100) - (el.min || 0))) * 100;
        return <div onClick={(e) => handleSliderInteraction(e, el)} style={{ ...commonStyle, padding: '0' }} className="w-full h-full flex items-center cursor-pointer overflow-hidden">
          <div className="relative w-full h-2 bg-gray-700 rounded">
            <div className="absolute h-full bg-blue-500 rounded" style={{ width: `${sliderPercent}%` }}></div>
          </div>
        </div>;

      case ElementType.IMAGE:
        return <div style={commonStyle} className="w-full h-full flex items-center justify-center">
          {el.texturePath ? <img src={el.texturePath} alt="img" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-gray-600" />}
        </div>;

      default:
        return <div style={commonStyle} className="w-full h-full"></div>;
    }
  };

  return (
    <div
      className={`flex-1 bg-[#121212] relative overflow-hidden flex flex-col ${isPreview ? 'cursor-default' : ''}`}
    >
      {/* Toolbar */}
      <div className="h-10 border-b border-mc-border bg-[#1a1a1a] flex items-center px-4 justify-between shrink-0 z-30 select-none">
        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
          <span>{settings.screenWidth} x {settings.screenHeight}</span>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.max(0.5, zoom - 0.25)); }} className="hover:text-white"><ZoomOut size={14} /></button>
            <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.min(3, zoom + 0.25)); }} className="hover:text-white"><ZoomIn size={14} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowCenterGuides(!showCenterGuides); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${showCenterGuides ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Crosshair size={14} />
            <span>Guides: {showCenterGuides ? 'ON' : 'OFF'}</span>
          </button>
          <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
          <button onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }} className={`p-1.5 rounded ${showGrid ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><Grid size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setZoom(1); }} className="p-1.5 text-gray-500 hover:text-white rounded"><Maximize size={14} /></button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto flex items-center justify-center p-20 relative bg-[#121212] ${isPreview ? 'select-none' : ''}`}>
        <div
          ref={canvasRef}
          className={`relative shadow-2xl transition-transform duration-100 ease-out border-4 ${isPreview ? 'border-green-500/30' : 'border-[#333]'}`}
          style={{
            width: settings.screenWidth,
            height: settings.screenHeight,
            transform: `scale(${zoom})`,
            backgroundColor: settings.backgroundColor || '#000000',
            backgroundImage: showGrid && !isPreview ? 'radial-gradient(circle, #4a4a4a 1px, transparent 1px)' : 'none',
            backgroundSize: '20px 20px',
            flexShrink: 0,
            cursor: isPreview ? 'default' : 'default'
          }}
          onMouseDown={(e) => {
            // Start box selection when clicking on canvas background (not on an element)
            if (!isPreview && e.target === e.currentTarget) {
              handleCanvasMouseDown(e);
            }
          }}
        >
          {!isPreview && activeSnap.x !== null && <div className="absolute z-50 bg-blue-400 w-[1px] top-0 bottom-0" style={{ left: activeSnap.x }} />}
          {!isPreview && activeSnap.y !== null && <div className="absolute z-50 bg-blue-400 h-[1px] left-0 right-0" style={{ top: activeSnap.y }} />}

          {/* Selection Box */}
          {!isPreview && selectionBox && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
                border: '2px dashed #3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            />
          )}

          {/* Elements */}
          {elements.map(el => (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
              onClick={(e) => handleInteractionClick(e, el)}
              onMouseMove={(e) => isPreview && e.buttons === 1 && handleSliderInteraction(e, el)}
              onMouseEnter={() => setHoveredElement(el.id)}
              onMouseLeave={() => setHoveredElement(null)}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: `rotate(${el.rotation || 0}deg)`,
                cursor: isPreview ? (['BUTTON', 'CHECKBOX', 'SLIDER'].includes(el.type) ? 'pointer' : 'default') : (isDragging ? 'grabbing' : 'move'),
                zIndex: selectedIds.has(el.id) ? 10 : 1,
              }}
              className={`group transition-none ${!isPreview && selectedIds.has(el.id) ? 'ring-1 ring-blue-500' : ''} ${!isPreview && !selectedIds.has(el.id) ? 'hover:ring-1 hover:ring-white/30' : ''}`}
            >
              {renderElementVisual(el, pressedButtons[el.id] || false, hoveredElement === el.id && isPreview)}

              {!isPreview && selectedIds.has(el.id) && (
                <>
                  <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-20 font-mono whitespace-nowrap" style={{ transform: `scale(${1 / zoom}) rotate(${-1 * (el.rotation || 0)}deg)`, transformOrigin: 'bottom left' }}>
                    {Math.round(el.x)}, {Math.round(el.y)} {el.rotation ? `(${Math.round(el.rotation)}°)` : ''}
                  </div>

                  {/* Rotation Handle */}
                  <div
                    onMouseDown={(e) => handleRotationStart(e, el)}
                    className="absolute left-1/2 -top-6 w-0.5 h-4 bg-blue-500 z-30 cursor-grab origin-bottom"
                    style={{ transform: `translateX(-50%)` }}
                  >
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full hover:bg-blue-100"></div>
                  </div>

                  {['nw', 'ne', 'sw', 'se'].map((handle) => (
                    <div
                      key={handle}
                      onMouseDown={(e) => handleResizeStart(e, el, handle)}
                      style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'center' }}
                      className={`
                        absolute w-2.5 h-2.5 bg-blue-500 border border-white z-30 rounded-full
                        ${handle === 'nw' ? '-top-1 -left-1 cursor-nw-resize' : ''}
                        ${handle === 'ne' ? '-top-1 -right-1 cursor-ne-resize' : ''}
                        ${handle === 'sw' ? '-bottom-1 -left-1 cursor-sw-resize' : ''}
                        ${handle === 'se' ? '-bottom-1 -right-1 cursor-se-resize' : ''}
                      `}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const renderElementVisual = (el: GuiElement, isPressed: boolean, isHovered: boolean) => {
  let transform = isPressed ? 'scale(0.95)' : 'scale(1)';
  let boxShadow = el.shadow?.enabled ? `${el.shadow.xOffset}px ${el.shadow.yOffset}px ${el.shadow.blur}px ${el.shadow.color}` : undefined;
  let borderColor = el.borderColor;
  let filter = undefined;

  if (isHovered && el.hover?.enabled) {
    switch (el.hover.type) {
      case 'SCALE': transform = `scale(${el.hover.scale || 1.05})`; break;
      case 'LIFT': transform = `translateY(-${el.hover.liftAmount || 2}px)`; break;
      case 'SLIDE_RIGHT': transform = `translateX(${el.hover.slideAmount || 5}px)`; break;
      case 'GLOW': boxShadow = `0 0 ${el.hover.glowBlur || 10}px ${el.hover.glowColor || '#fff'}`; break;
      case 'BORDER_PULSE': borderColor = el.hover.glowColor || '#fff'; break;
    }
    if (el.hover.brightness && el.hover.brightness !== 1) filter = `brightness(${el.hover.brightness})`;
  }

  const commonStyle: React.CSSProperties = {
    borderRadius: el.borderRadius ? `${el.borderRadius}px` : '0px',
    opacity: el.opacity !== undefined ? el.opacity : 1,
    fontFamily: el.fontFamily === 'Minecraft' ? '"Press Start 2P", cursive' :
      el.fontFamily === 'Modern' ? '"Inter", sans-serif' :
        el.fontFamily === 'Mono' ? '"JetBrains Mono", monospace' : undefined,
    borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
    borderColor: borderColor || undefined,
    borderStyle: el.borderWidth ? 'solid' : undefined,
    background: el.type === ElementType.IMAGE
      ? 'transparent' // Make image background transparent
      : (el.gradient?.enabled
        ? `linear-gradient(${el.gradient.direction === 'vertical' ? 'to bottom' : 'to right'}, ${el.gradient.startColor}, ${el.gradient.endColor})`
        : el.color),
    boxShadow: boxShadow,
    backdropFilter: el.backdropBlur ? `blur(${el.backdropBlur}px)` : undefined,
    transition: `all ${el.hover?.duration || 0.2}s cubic-bezier(0.4, 0, 0.2, 1)`,
    transform: transform,
    filter: filter,
  };

  const textStyle: React.CSSProperties = {
    textAlign: el.textAlign || 'center',
    textShadow: el.textShadow !== false ? '2px 2px 0px rgba(0,0,0,0.7)' : 'none',
    width: '100%',
    display: 'block'
  };

  // Content Rendering
  switch (el.type) {
    case ElementType.BUTTON:
      if (el.variant === 'ICON') {
        return <div style={{ ...commonStyle, background: 'transparent' }} className="w-full h-full flex items-center justify-center">
          {el.texturePath ? <img src={el.texturePath} alt="btn" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-white/10 border border-white/20 flex items-center justify-center rounded"><ImageIcon size={16} className="text-gray-400" /></div>}
        </div>
      }
      return <div style={commonStyle} className={`w-full h-full flex items-center justify-center overflow-hidden ${!el.gradient?.enabled ? 'bg-[#3c3c3c]' : ''}`}><span style={textStyle} className="text-white text-xs px-1 pointer-events-none truncate leading-none">{el.label}</span></div>;
    case ElementType.TEXT_FIELD:
      return <div style={commonStyle} className="w-full h-full flex items-center px-2 overflow-hidden text-white"><span style={{ ...textStyle, textAlign: 'left', textShadow: 'none' }} className="text-xs truncate opacity-70 pointer-events-none">{el.label || '...'}</span></div>;
    case ElementType.CHECKBOX:
      if (el.variant === 'SWITCH') {
        return <div style={{ ...commonStyle, background: 'transparent', boxShadow: 'none', backdropFilter: 'none' }} className="flex items-center gap-2 h-full w-full">
          <div className={`relative h-full aspect-[2/1] rounded-full transition-colors border border-gray-600 ${el.checked ? 'bg-green-600' : 'bg-gray-600'}`}>
            <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm transition-all ${el.checked ? 'left-[50%]' : 'left-[2px]'}`} />
          </div>
          <span style={textStyle} className="text-white text-xs truncate pointer-events-none flex-1 text-left">{el.label}</span>
        </div>;
      }
      return <div style={{ ...commonStyle, background: 'transparent', boxShadow: 'none', backdropFilter: 'none' }} className="flex items-center gap-2 h-full w-full overflow-hidden">
        <div className={`w-5 h-5 border-2 border-[#8b8b8b] bg-black flex items-center justify-center shrink-0 ${el.checked ? 'text-green-500' : ''}`}>{el.checked && <Check size={16} strokeWidth={4} />}</div>
        <span style={textStyle} className="text-white text-xs truncate pointer-events-none flex-1 text-left">{el.label}</span>
      </div>;
    case ElementType.SLIDER:
      const min = el.min || 0, max = el.max || 100, val = el.value ?? 50, pct = Math.min(1, Math.max(0, (val - min) / (max - min)));
      return <div style={commonStyle} className="w-full h-full relative select-none overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 bg-white/20" style={{ width: '100%' }}></div>
        <div className="absolute top-0 bottom-0 left-0 bg-mc-accent/50" style={{ width: `${pct * 100}%` }}></div>
        <div className="w-full h-full flex items-center justify-center z-10 relative pointer-events-none"><span style={textStyle} className="text-white text-xs truncate leading-none drop-shadow-md">{el.label}: {Math.round(val * 100) / 100}</span></div>
      </div>;
    case ElementType.LABEL:
      return <div style={{ ...commonStyle, color: el.color || '#fff', background: 'transparent' }} className="w-full h-full flex items-center overflow-hidden"><span style={textStyle} className="text-xs pointer-events-none leading-normal">{el.label}</span></div>;
    case ElementType.PANEL: return <div className="w-full h-full transition-all" style={commonStyle} />;
    case ElementType.SLOT: return <div style={commonStyle} className="w-full h-full bg-[#8b8b8b] border border-[#373737] border-b-white border-r-white flex items-center justify-center"><div className="w-[calc(100%-2px)] h-[calc(100%-2px)] bg-[#8b8b8b] border border-white border-b-[#373737] border-r-[#373737]"></div></div>;
    case ElementType.IMAGE:
      return (
        <div style={commonStyle} className="w-full h-full flex items-center justify-center overflow-hidden">
          {el.texturePath ? (
            <img src={el.texturePath} alt={el.variableName} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-white/10 border border-white/20 flex flex-col items-center justify-center rounded">
              <ImageIcon size={16} className="text-gray-400" />
              <span className="text-[8px] text-gray-500 mt-1">No Image</span>
            </div>
          )}
        </div>
      );
    case ElementType.ENTITY:
      return <div style={commonStyle} className="w-full h-full flex flex-col items-center justify-center bg-black/20 border border-white/10 overflow-hidden">
        <User size={Math.min(el.width, el.height) * 0.5} className="text-gray-400" />
        <span className="text-[8px] text-gray-500 mt-1 truncate w-full text-center">{el.entityType || 'Entity'}</span>
      </div>;
    case ElementType.ITEM:
      return <div style={commonStyle} className="w-full h-full flex items-center justify-center overflow-hidden">
        <Box size={Math.min(el.width, el.height) * 0.6} className="text-blue-400" />
      </div>;
    case ElementType.SCROLL_PANEL:
      return <div style={commonStyle} className="w-full h-full relative border border-white/10 bg-black/40 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10 border-l border-white/5">
          <div className="h-1/3 bg-white/30 rounded-full my-1 mx-[1px] w-[calc(100%-2px)]"></div>
        </div>
        <div className="p-2 text-[10px] text-gray-500 flex flex-col items-center justify-center h-full opacity-50">
          <List size={16} />
          <span>Scroll Panel</span>
        </div>
      </div>;
    case ElementType.DROPDOWN:
      return <div style={commonStyle} className="w-full h-full flex items-center justify-between px-2 bg-black/50 border border-white/20 overflow-hidden">
        <span className="text-xs text-white truncate">{el.label}</span>
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </div>;
    case ElementType.PROGRESS_BAR:
      const progress = Math.min(100, Math.max(0, el.progress || 50));
      return <div style={commonStyle} className="w-full h-full relative bg-gray-800 border border-gray-600 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: el.color || '#22c55e' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] text-white font-mono drop-shadow-md">{progress}%</span>
        </div>
      </div>;
    default: return null;
  }
};

export default Canvas;