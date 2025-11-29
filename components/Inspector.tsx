import * as React from 'react';
const { useState } = React;
import { Copy, Bot, Code2, AlertCircle, RefreshCw, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, AlignLeft, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, GripVertical, Type, Square, Sparkles, Move, Palette, RotateCw, Brain, Zap } from 'lucide-react';
import { ColorPickerPopover } from './ColorPicker';
import { GuiElement, ElementType, AiFeedbackState, HoverAnimationType, EventType, ActionType, EventAction } from '../types';

interface InspectorProps {
  selectedElement: GuiElement | null;
  onUpdateElement: (id: string, updates: Partial<GuiElement>) => void;
  onDeleteElement: (id: string) => void;
  onSnapshot: () => void;
  generatedCode: string;
  onAnalyze: () => void;
  aiState: AiFeedbackState;
  canvasWidth: number;
  canvasHeight: number;
  screens: Array<{ id: string; name: string; settings: { className: string } }>;
}

const Inspector: React.FC<InspectorProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onSnapshot,
  generatedCode,
  onAnalyze,
  aiState,
  canvasWidth,
  canvasHeight,
  screens
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events' | 'code' | 'ai'>('properties');

  const safeInt = (val: string) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeFloat = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleChange = (key: keyof GuiElement, value: string | number | boolean | object) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { [key]: value });
    }
  };

  // Commit change on blur or enter
  const handleCommit = () => {
    onSnapshot();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('texturePath', reader.result as string);
        handleCommit();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeepChange = (parentKey: keyof GuiElement, childKey: string, value: any) => {
    if (selectedElement) {
      const parentObj = (selectedElement[parentKey] as any) || {};
      onUpdateElement(selectedElement.id, {
        [parentKey]: { ...parentObj, [childKey]: value }
      });
    }
  };

  const handleAlign = (alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'q1-x' | 'q3-x' | 'q1-y' | 'q3-y') => {
    if (!selectedElement) return;
    const updates: Partial<GuiElement> = {};

    switch (alignment) {
      // Horizontal
      case 'left': updates.x = 0; break;
      case 'q1-x': updates.x = Math.round((canvasWidth * 0.25) - (selectedElement.width / 2)); break;
      case 'center-x': updates.x = Math.round((canvasWidth - selectedElement.width) / 2); break;
      case 'q3-x': updates.x = Math.round((canvasWidth * 0.75) - (selectedElement.width / 2)); break;
      case 'right': updates.x = canvasWidth - selectedElement.width; break;

      // Vertical
      case 'top': updates.y = 0; break;
      case 'q1-y': updates.y = Math.round((canvasHeight * 0.25) - (selectedElement.height / 2)); break;
      case 'center-y': updates.y = Math.round((canvasHeight - selectedElement.height) / 2); break;
      case 'q3-y': updates.y = Math.round((canvasHeight * 0.75) - (selectedElement.height / 2)); break;
      case 'bottom': updates.y = canvasHeight - selectedElement.height; break;
    }

    onUpdateElement(selectedElement.id, updates);
    onSnapshot();
  };

  return (
    <div className="w-80 flex-shrink-0 bg-mc-panel border-l border-mc-border flex flex-col h-full z-40 shadow-xl">
      {/* Header for Window Controls */}
      <div
        className="h-12 border-b border-mc-border bg-[#252525] flex items-center px-4 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inspector</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mc-border flex-shrink-0 bg-mc-panel">
        <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} label="Design" icon={<Palette size={14} className="mr-1" />} />
        <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="Events" icon={<Zap size={14} className="mr-1" />} />
        <TabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')} label="Code" icon={<Code2 size={14} className="mr-1" />} />
        <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} label="AI" icon={<Brain size={14} className="mr-1" />} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
        {activeTab === 'properties' && (
          selectedElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-mc-accent"></div>
                  {selectedElement.type}
                </h3>
                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400 font-mono">
                  {selectedElement.variableName}
                </span>
              </div>

              <div className="space-y-4">
                <InputGroup label="Layout & Transform" icon={<Move size={10} />}>
                  {/* Alignment Grid */}
                  <div className="bg-black/20 p-2 rounded border border-white/5 space-y-2 mb-2">
                    <div className="flex gap-1 items-center">
                      <span className="text-[9px] text-gray-500 w-3">X</span>
                      <AlignButton icon={<AlignLeft size={14} />} onClick={() => handleAlign('left')} title="Left" />
                      <AlignButton icon={<span className="text-[9px] font-bold">25%</span>} onClick={() => handleAlign('q1-x')} title="Left Quarter" />
                      <AlignButton icon={<AlignHorizontalJustifyCenter size={14} />} onClick={() => handleAlign('center-x')} title="Center" />
                      <AlignButton icon={<span className="text-[9px] font-bold">75%</span>} onClick={() => handleAlign('q3-x')} title="Right Quarter" />
                      <AlignButton icon={<AlignRight size={14} />} onClick={() => handleAlign('right')} title="Right" />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="text-[9px] text-gray-500 w-3">Y</span>
                      <AlignButton icon={<AlignVerticalJustifyStart size={14} />} onClick={() => handleAlign('top')} title="Top" />
                      <AlignButton icon={<span className="text-[9px] font-bold">25%</span>} onClick={() => handleAlign('q1-y')} title="Top Quarter" />
                      <AlignButton icon={<AlignVerticalJustifyCenter size={14} />} onClick={() => handleAlign('center-y')} title="Middle" />
                      <AlignButton icon={<span className="text-[9px] font-bold">75%</span>} onClick={() => handleAlign('q3-y')} title="Bottom Quarter" />
                      <AlignButton icon={<AlignVerticalJustifyEnd size={14} />} onClick={() => handleAlign('bottom')} title="Bottom" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-gray-500">X</span>
                      <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => handleChange('x', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded pl-5 pr-2 py-1.5 text-xs text-white focus:border-mc-accent outline-none" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-gray-500">Y</span>
                      <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => handleChange('y', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded pl-5 pr-2 py-1.5 text-xs text-white focus:border-mc-accent outline-none" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-gray-500">W</span>
                      <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => handleChange('width', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded pl-5 pr-2 py-1.5 text-xs text-white focus:border-mc-accent outline-none" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-gray-500">H</span>
                      <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => handleChange('height', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded pl-5 pr-2 py-1.5 text-xs text-white focus:border-mc-accent outline-none" />
                    </div>
                    <div className="relative col-span-2">
                      <span className="absolute left-2 top-2 text-[10px] text-gray-500"><RotateCw size={10} /></span>
                      <input type="number" value={Math.round(selectedElement.rotation || 0)} onChange={(e) => handleChange('rotation', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded pl-6 pr-2 py-1.5 text-xs text-white focus:border-mc-accent outline-none" />
                      <span className="absolute right-2 top-2 text-[10px] text-gray-500">deg</span>
                    </div>
                  </div>
                </InputGroup>

                {/* Styling Inputs */}
                <InputGroup label="Styling" icon={<Palette size={10} />}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fill Color</label>
                        <ColorPickerPopover color={selectedElement.color || '#000000'} onChange={(c) => { handleChange('color', c); handleCommit(); }} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Opacity</label>
                        <input type="number" min="0" max="1" step="0.1" value={selectedElement.opacity ?? 1} onChange={(e) => handleChange('opacity', safeFloat(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-0.5 text-xs text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Corner Radius</label>
                        <input type="number" min="0" max="100" value={selectedElement.borderRadius ?? 0} onChange={(e) => handleChange('borderRadius', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-xs text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Border Width</label>
                        <input type="number" min="0" max="10" value={selectedElement.borderWidth ?? 0} onChange={(e) => handleChange('borderWidth', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-xs text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 block mb-1">Border Color</label>
                      <ColorPickerPopover color={selectedElement.borderColor || '#ffffff'} onChange={(c) => { handleChange('borderColor', c); handleCommit(); }} />
                    </div>
                  </div>
                </InputGroup>

                {/* Effects & Motion */}
                <InputGroup label="Effects & Motion" icon={<Sparkles size={10} />}>
                  <div className="space-y-3 bg-black/20 p-2 rounded border border-white/5">
                    {/* Gradient */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400">Gradient</label>
                        <input type="checkbox" checked={selectedElement.gradient?.enabled || false} onChange={(e) => { handleDeepChange('gradient', 'enabled', e.target.checked); handleCommit(); }} />
                      </div>
                      {selectedElement.gradient?.enabled && (
                        <div className="grid grid-cols-2 gap-2 pl-2 border-l border-white/10">
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-1">Start</label>
                            <ColorPickerPopover color={selectedElement.gradient.startColor || '#000000'} onChange={(c) => { handleDeepChange('gradient', 'startColor', c); handleCommit(); }} />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-1">End</label>
                            <ColorPickerPopover color={selectedElement.gradient.endColor || '#000000'} onChange={(c) => { handleDeepChange('gradient', 'endColor', c); handleCommit(); }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-full h-[1px] bg-white/5"></div>

                    {/* Shadow */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400">Drop Shadow</label>
                        <input type="checkbox" checked={selectedElement.shadow?.enabled || false} onChange={(e) => { handleDeepChange('shadow', 'enabled', e.target.checked); handleCommit(); }} />
                      </div>
                      {selectedElement.shadow?.enabled && (
                        <div className="space-y-2 pl-2 border-l border-white/10">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] text-gray-500 w-8">Blur</label>
                            <input type="range" min="0" max="20" value={selectedElement.shadow.blur || 0} onChange={(e) => handleDeepChange('shadow', 'blur', safeInt(e.target.value))} onMouseUp={handleCommit} className="flex-1 h-1 bg-gray-700 rounded-lg" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">X</span><input type="number" value={selectedElement.shadow.xOffset} onChange={(e) => handleDeepChange('shadow', 'xOffset', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>
                            <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">Y</span><input type="number" value={selectedElement.shadow.yOffset} onChange={(e) => handleDeepChange('shadow', 'yOffset', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>
                          </div>
                          <div><label className="text-[9px] text-gray-500 block mb-1">Color</label><ColorPickerPopover color={selectedElement.shadow.color || '#000000'} onChange={(c) => { handleDeepChange('shadow', 'color', c); handleCommit(); }} /></div>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-[1px] bg-white/5"></div>

                    {/* Backdrop Blur (Glass) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400">Glass Blur</label>
                        <span className="text-[9px] text-gray-500">{selectedElement.backdropBlur || 0}px</span>
                      </div>
                      <input
                        type="range" min="0" max="20"
                        value={selectedElement.backdropBlur || 0}
                        onChange={(e) => handleChange('backdropBlur', safeInt(e.target.value))}
                        onMouseUp={handleCommit}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Hover */}
                    <div className="w-full h-[1px] bg-white/5"></div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400">Hover Animation</label>
                        <input type="checkbox" checked={selectedElement.hover?.enabled || false} onChange={(e) => { handleDeepChange('hover', 'enabled', e.target.checked); handleCommit(); }} />
                      </div>
                      {selectedElement.hover?.enabled && (
                        <div className="space-y-3 pl-2 border-l border-white/10">
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-1">Type</label>
                            <select value={selectedElement.hover.type || 'SCALE'} onChange={(e) => { handleDeepChange('hover', 'type', e.target.value as HoverAnimationType); handleCommit(); }} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-[10px]">
                              <option value="SCALE">Scale Up</option>
                              <option value="LIFT">Lift Up (Y-Axis)</option>
                              <option value="SLIDE_RIGHT">Slide Right</option>
                              <option value="GLOW">Outer Glow</option>
                              <option value="BORDER_PULSE">Border Color</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[9px] text-gray-500 block">Duration (s)</label><input type="number" step="0.05" value={selectedElement.hover.duration || 0.2} onChange={(e) => handleDeepChange('hover', 'duration', parseFloat(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>
                            <div><label className="text-[9px] text-gray-500 block">Brightness</label><input type="number" step="0.05" value={selectedElement.hover.brightness || 1.1} onChange={(e) => handleDeepChange('hover', 'brightness', parseFloat(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>
                          </div>
                          {selectedElement.hover.type === 'SCALE' && (<div><label className="text-[9px] text-gray-500 block">Scale Factor</label><input type="number" step="0.01" value={selectedElement.hover.scale || 1.05} onChange={(e) => handleDeepChange('hover', 'scale', parseFloat(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>)}
                          {selectedElement.hover.type === 'LIFT' && (<div><label className="text-[9px] text-gray-500 block">Lift Pixels</label><input type="number" value={selectedElement.hover.liftAmount || 2} onChange={(e) => handleDeepChange('hover', 'liftAmount', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>)}
                          {selectedElement.hover.type === 'SLIDE_RIGHT' && (<div><label className="text-[9px] text-gray-500 block">Slide Pixels</label><input type="number" value={selectedElement.hover.slideAmount || 5} onChange={(e) => handleDeepChange('hover', 'slideAmount', safeInt(e.target.value))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-1 py-0.5 text-[9px] text-white" /></div>)}
                          {(selectedElement.hover.type === 'GLOW' || selectedElement.hover.type === 'BORDER_PULSE') && (
                            <div className="space-y-2">
                              <div><label className="text-[9px] text-gray-500 block mb-1">Effect Color</label><ColorPickerPopover color={selectedElement.hover.glowColor || '#ffffff'} onChange={(c) => { handleDeepChange('hover', 'glowColor', c); handleCommit(); }} /></div>
                              {selectedElement.hover.type === 'GLOW' && (<div><label className="text-[9px] text-gray-500 block">Blur Radius</label><input type="range" min="0" max="20" value={selectedElement.hover.glowBlur || 10} onChange={(e) => handleDeepChange('hover', 'glowBlur', safeInt(e.target.value))} onMouseUp={handleCommit} className="w-full h-1 bg-gray-700 rounded-lg" /></div>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </InputGroup>

                {/* Typography Inputs */}
                {[ElementType.BUTTON, ElementType.LABEL, ElementType.CHECKBOX, ElementType.SLIDER, ElementType.TEXT_FIELD, ElementType.DROPDOWN].includes(selectedElement.type) && (
                  <InputGroup label="Typography" icon={<Type size={10} />}>
                    <div className="space-y-3">
                      <input type="text" value={selectedElement.label || ''} onChange={(e) => handleChange('label', e.target.value)} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded p-2 text-xs text-white focus:border-mc-accent outline-none" placeholder="Text Content..." />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Font Family</label>
                          <select
                            value={selectedElement.fontFamily || 'Minecraft'}
                            onChange={(e) => { handleChange('fontFamily', e.target.value); handleCommit(); }}
                            className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-[10px]"
                          >
                            <option value="Minecraft">Minecraft (Pixel)</option>
                            <option value="Modern">Modern (Inter)</option>
                            <option value="Mono">Monospace</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer bg-mc-bg border border-mc-border px-2 py-1 rounded">
                            <input type="checkbox" checked={selectedElement.textShadow !== false} onChange={(e) => { handleChange('textShadow', e.target.checked); handleCommit(); }} className="rounded border-gray-600 bg-gray-800" />
                            <span className="text-[10px]">Text Shadow</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Text Alignment</label>
                        <div className="flex bg-mc-bg border border-mc-border rounded overflow-hidden">
                          <button onClick={() => { handleChange('textAlign', 'left'); handleCommit(); }} className={`flex-1 py-1 ${selectedElement.textAlign === 'left' ? 'bg-mc-accent text-white' : 'hover:bg-white/5'}`}><AlignLeft size={12} className="mx-auto" /></button>
                          <button onClick={() => { handleChange('textAlign', 'center'); handleCommit(); }} className={`flex-1 py-1 ${selectedElement.textAlign === 'center' || !selectedElement.textAlign ? 'bg-mc-accent text-white' : 'hover:bg-white/5'}`}><AlignHorizontalJustifyCenter size={12} className="mx-auto" /></button>
                          <button onClick={() => { handleChange('textAlign', 'right'); handleCommit(); }} className={`flex-1 py-1 ${selectedElement.textAlign === 'right' ? 'bg-mc-accent text-white' : 'hover:bg-white/5'}`}><AlignRight size={12} className="mx-auto" /></button>
                        </div>
                      </div>
                    </div>
                  </InputGroup>
                )}

                {(selectedElement.type === ElementType.IMAGE || (selectedElement.type === ElementType.BUTTON && selectedElement.variant === 'ICON')) && (
                  <InputGroup label="Texture Path" icon={<Sparkles size={10} />}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedElement.texturePath || ''}
                        onChange={(e) => handleChange('texturePath', e.target.value)}
                        onBlur={handleCommit}
                        className="flex-1 bg-mc-bg border border-mc-border rounded p-2 text-xs text-white focus:border-mc-accent outline-none font-mono"
                        placeholder="Enter URL or upload..."
                      />
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="imageUpload" className="px-3 py-2 bg-mc-btn hover:bg-mc-btnHover rounded cursor-pointer text-white text-xs">
                        Upload
                      </label>
                    </div>
                  </InputGroup>
                )}
                {/* Element Specific Inputs */}
                {(selectedElement.type === ElementType.ENTITY || selectedElement.type === ElementType.ITEM || selectedElement.type === ElementType.DROPDOWN || selectedElement.type === ElementType.PROGRESS_BAR) && (
                  <InputGroup label="Specific Properties" icon={<Bot size={10} />}>
                    <div className="space-y-3">
                      {selectedElement.type === ElementType.ENTITY && (
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Entity Type</label>
                          <input type="text" value={selectedElement.entityType || ''} onChange={(e) => handleChange('entityType', e.target.value)} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-xs text-white" placeholder="zombie" />
                        </div>
                      )}
                      {selectedElement.type === ElementType.ITEM && (
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Item ID</label>
                          <input type="text" value={selectedElement.itemId || ''} onChange={(e) => handleChange('itemId', e.target.value)} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-xs text-white" placeholder="diamond_sword" />
                        </div>
                      )}
                      {selectedElement.type === ElementType.DROPDOWN && (
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Options (comma separated)</label>
                          <textarea value={selectedElement.options?.join(', ') || ''} onChange={(e) => handleChange('options', e.target.value.split(',').map(s => s.trim()))} onBlur={handleCommit} className="w-full bg-mc-bg border border-mc-border rounded p-2 text-xs text-white h-20" placeholder="Option 1, Option 2" />
                        </div>
                      )}
                      {selectedElement.type === ElementType.PROGRESS_BAR && (
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Progress (%)</label>
                          <input type="range" min="0" max="100" value={selectedElement.progress || 0} onChange={(e) => handleChange('progress', safeInt(e.target.value))} onMouseUp={handleCommit} className="w-full h-1 bg-gray-700 rounded-lg" />
                          <div className="text-right text-[9px] text-gray-500 mt-1">{selectedElement.progress || 0}%</div>
                        </div>
                      )}
                    </div>
                  </InputGroup>
                )}

                {/* Tooltip Input (Global) */}
                <InputGroup label="Tooltip" icon={<AlertCircle size={10} />}>
                  <textarea
                    value={selectedElement.tooltip || ''}
                    onChange={(e) => handleChange('tooltip', e.target.value)}
                    onBlur={handleCommit}
                    className="w-full bg-mc-bg border border-mc-border rounded p-2 text-xs text-white h-16 outline-none focus:border-mc-accent resize-y"
                    placeholder="Enter tooltip text..."
                  />
                </InputGroup>
              </div>

              <div className="pt-4 border-t border-mc-border">
                <button onClick={() => onDeleteElement(selectedElement.id)} className="w-full py-1.5 px-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded hover:bg-red-950/50 transition-colors text-xs">Delete Element</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-6"><p className="text-sm">Select an element to edit properties</p></div>
          )
        )}

        {activeTab === 'events' && (
          selectedElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-mc-accent"></div>
                  {selectedElement.type} Events
                </h3>
              </div>

              {/* Event Configuration */}
              <div className="space-y-4">
                {(selectedElement.type === ElementType.BUTTON) && (
                  <EventConfigurator
                    label="On Click"
                    eventType={EventType.ON_CLICK}
                    element={selectedElement}
                    onUpdate={onUpdateElement}
                    onCommit={handleCommit}
                    screens={screens}
                  />
                )}

                {(selectedElement.type === ElementType.CHECKBOX || selectedElement.type === ElementType.SLIDER || selectedElement.type === ElementType.TEXT_FIELD) && (
                  <EventConfigurator
                    label="On Change"
                    eventType={EventType.ON_CHANGE}
                    element={selectedElement}
                    onUpdate={onUpdateElement}
                    onCommit={handleCommit}
                    screens={screens}
                  />
                )}

                {![ElementType.BUTTON, ElementType.CHECKBOX, ElementType.SLIDER, ElementType.TEXT_FIELD].includes(selectedElement.type) && (
                  <div className="text-gray-500 text-xs italic p-4 text-center">
                    No events available for this element type.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-6"><p className="text-sm">Select an element to configure events</p></div>
          )
        )}

        {activeTab === 'code' && (
          <div className="relative h-full flex flex-col">
            <div className="absolute top-2 right-2 z-10"><button onClick={() => navigator.clipboard.writeText(generatedCode)} className="p-1.5 bg-mc-btn hover:bg-mc-btnHover rounded text-white border border-mc-border shadow-md" title="Copy Code"><Copy size={12} /></button></div>
            <pre className="flex-1 bg-[#151515] p-3 rounded border border-mc-border text-[10px] font-mono overflow-auto text-green-300 leading-normal custom-scrollbar">{generatedCode}</pre>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full flex flex-col gap-3">
            <button onClick={onAnalyze} disabled={aiState.isLoading} className={`w-full py-2.5 px-4 rounded font-medium text-white text-xs flex items-center justify-center gap-2 transition-all ${aiState.isLoading ? 'bg-mc-btn cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md'}`}>{aiState.isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}{aiState.isLoading ? 'Analyzing...' : 'Analyze Layout'}</button>
            <div className="flex-1 bg-[#151515] rounded border border-mc-border p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-gray-300 custom-scrollbar">{aiState.content || "Get AI feedback..."}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex-1 py-2 text-xs font-medium flex items-center justify-center transition-colors border-b-2 ${active ? 'bg-[#2a2a2a] text-white border-mc-accent' : 'bg-mc-panel text-gray-500 border-transparent hover:text-gray-300'}`}>{icon}{label}</button>
);

const InputGroup: React.FC<{ label: string, children: React.ReactNode, icon?: React.ReactNode }> = ({ label, children, icon }) => (
  <div className="flex flex-col gap-1.5"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">{icon} {label}</label>{children}</div>
);

const AlignButton: React.FC<{ icon: React.ReactNode, onClick: () => void, title: string }> = ({ icon, onClick, title }) => (
  <button onClick={onClick} title={title} className="flex-1 flex items-center justify-center p-1.5 rounded bg-mc-btn hover:bg-mc-btnHover hover:text-white text-gray-400 transition-colors h-7">{icon}</button>
);

const EventConfigurator: React.FC<{
  label: string,
  eventType: EventType,
  element: GuiElement,
  onUpdate: (id: string, updates: Partial<GuiElement>) => void,
  onCommit: () => void,
  screens: Array<{ id: string; name: string; settings: { className: string } }>
}> = ({ label, eventType, element, onUpdate, onCommit, screens }) => {
  const eventAction = element.events?.[eventType];
  const actionType = eventAction?.type;

  const handleTypeChange = (newType: string) => {
    const newAction: EventAction = {
      type: newType as ActionType,
      value: eventAction?.value || ''
    };

    onUpdate(element.id, {
      events: {
        ...element.events,
        [eventType]: newAction
      }
    });
    onCommit();
  };

  const handleValueChange = (newValue: string) => {
    if (!actionType) return;

    const newAction: EventAction = {
      type: actionType,
      value: newValue
    };

    onUpdate(element.id, {
      events: {
        ...element.events,
        [eventType]: newAction
      }
    });
  };

  return (
    <InputGroup label={label} icon={<Zap size={10} />}>
      <div className="space-y-3 bg-black/20 p-2 rounded border border-white/5">
        <div>
          <label className="text-[9px] text-gray-500 block mb-1">Action</label>
          <select
            value={actionType || ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1 text-[10px] text-white outline-none focus:border-mc-accent"
          >
            <option value="">None</option>
            <option value={ActionType.OPEN_SCREEN}>Open Screen</option>
            <option value={ActionType.EXECUTE_COMMAND}>Execute Command</option>
            <option value={ActionType.PLAY_SOUND}>Play Sound</option>
            <option value={ActionType.CUSTOM_CODE}>Custom Code</option>
          </select>
        </div>

        {actionType && (
          <div>
            <label className="text-[9px] text-gray-500 block mb-1">
              {actionType === ActionType.OPEN_SCREEN && 'Target Screen'}
              {actionType === ActionType.EXECUTE_COMMAND && 'Command (without /)'}
              {actionType === ActionType.PLAY_SOUND && 'Sound ID (e.g. ui.button.click)'}
              {actionType === ActionType.CUSTOM_CODE && 'Java Code'}
            </label>
            {actionType === ActionType.CUSTOM_CODE ? (
              <textarea
                value={eventAction?.value || ''}
                onChange={(e) => handleValueChange(e.target.value)}
                onBlur={onCommit}
                className="w-full bg-mc-bg border border-mc-border rounded p-2 text-[10px] text-white font-mono h-20 outline-none focus:border-mc-accent resize-y"
                placeholder="// Enter custom Java code here..."
              />
            ) : actionType === ActionType.OPEN_SCREEN ? (
              <select
                value={eventAction?.value || ''}
                onChange={(e) => { handleValueChange(e.target.value); onCommit(); }}
                className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-mc-accent"
              >
                <option value="">Select a screen...</option>
                {screens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name} ({screen.settings.className})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={eventAction?.value || ''}
                onChange={(e) => handleValueChange(e.target.value)}
                onBlur={onCommit}
                className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-mc-accent font-mono"
                placeholder={
                  actionType === ActionType.EXECUTE_COMMAND ? 'say Hello World' :
                    actionType === ActionType.PLAY_SOUND ? 'entity.experience_orb.pickup' : ''
                }
              />
            )}
          </div>
        )}
      </div>
    </InputGroup>
  );
};

export default Inspector;