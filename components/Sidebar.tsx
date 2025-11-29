import React from 'react';
import { ElementType, GuiElement } from '../types';
import { MousePointer2, Type, Box, Grip, Image as ImageIcon, SlidersHorizontal, CheckSquare, Grid3x3, Settings, Monitor, Layers, MousePointerClick, ToggleRight, FolderOpen } from 'lucide-react';

const sidebarLogo = new URL('../icon.ico', import.meta.url).href;

interface SidebarProps {
  onAddElement: (type: ElementType, extraProps?: Partial<GuiElement>) => void;
  onOpenSettings: () => void;
  persistenceAvailable?: boolean;
  onImportScreens?: () => void;
  onOpenScreensFolder?: () => void;
  onOpenLogsFolder?: () => void;
  storagePaths?: { dataRoot?: string; screensDir?: string; logsDir?: string };
  isImportingScreens?: boolean;
  onExportScreen?: () => void;
  onImportScreenFromFile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddElement,
  onOpenSettings,
  persistenceAvailable,
  onImportScreens,
  onOpenScreensFolder,
  onOpenLogsFolder,
  storagePaths,
  isImportingScreens,
  onExportScreen,
  onImportScreenFromFile
}) => {
  return (
    <div className="w-64 bg-mc-panel border-r border-mc-border flex flex-col z-20 shadow-lg h-full">
      {/* App Logo/Header */}
      <div className="p-4 border-b border-mc-border flex items-center gap-3 bg-[#252525]">
        <img
          src={sidebarLogo}
          width={32}
          height={32}
          alt="FlowGUI logo"
          className="w-8 h-8 rounded border border-white/20 shadow object-cover bg-black/40"
          draggable={false}
        />
        <div>
          <h1 className="text-sm font-bold text-white leading-tight tracking-wide">FlowGUI</h1>
          <p className="text-[10px] text-gray-400">Layout Architect</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-6">

        {/* Tools Section */}
        <Section title="Tools">
          <ToolItem
            icon={<MousePointer2 size={16} />}
            label="Select"
            onClick={() => { }}
            disabled
            description="Select & Move elements"
          />
        </Section>

        <div className="w-full h-[1px] bg-mc-border/50" />

        {/* Controls Section */}
        <Section title="Controls" icon={<MousePointerClick size={12} />}>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              icon={<Box size={18} />}
              label="Button"
              onClick={() => onAddElement(ElementType.BUTTON)}
            />
            <ToolButton
              icon={<CheckSquare size={18} />}
              label="Checkbox"
              onClick={() => onAddElement(ElementType.CHECKBOX)}
            />
            <ToolButton
              icon={<ToggleRight size={18} />}
              label="Switch"
              onClick={() => onAddElement(ElementType.CHECKBOX, { variant: 'SWITCH', width: 40, height: 20, label: 'Toggle' })}
            />
            <ToolButton
              icon={<SlidersHorizontal size={18} />}
              label="Slider"
              onClick={() => onAddElement(ElementType.SLIDER)}
            />
            <ToolButton
              icon={<Type size={18} />}
              label="Input Field"
              onClick={() => onAddElement(ElementType.TEXT_FIELD)}
            />
            <ToolButton
              icon={<Layers size={18} />}
              label="Dropdown"
              onClick={() => onAddElement(ElementType.DROPDOWN)}
            />
          </div>
        </Section>

        {/* Display Section */}
        <Section title="Visuals" icon={<Monitor size={12} />}>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              icon={<Type size={18} />}
              label="Label"
              onClick={() => onAddElement(ElementType.LABEL)}
            />
            <ToolButton
              icon={<ImageIcon size={18} />}
              label="Image"
              onClick={() => onAddElement(ElementType.IMAGE)}
            />
            <ToolButton
              icon={<Box size={18} />}
              label="Item"
              onClick={() => onAddElement(ElementType.ITEM)}
            />
            <ToolButton
              icon={<Box size={18} />}
              label="Entity"
              onClick={() => onAddElement(ElementType.ENTITY)}
            />
            <ToolButton
              icon={<Box size={18} />}
              label="Progress"
              onClick={() => onAddElement(ElementType.PROGRESS_BAR)}
            />
          </div>
        </Section>

        {/* Containers Section */}
        <Section title="Containers" icon={<Layers size={12} />}>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              icon={<Grip size={18} />}
              label="Panel"
              onClick={() => onAddElement(ElementType.PANEL)}
            />
            <ToolButton
              icon={<Grid3x3 size={18} />}
              label="Slot"
              onClick={() => onAddElement(ElementType.SLOT)}
            />
            <ToolButton
              icon={<Box size={18} />}
              label="Scroll Panel"
              onClick={() => onAddElement(ElementType.SCROLL_PANEL)}
            />
          </div>
        </Section>

      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-mc-border bg-[#252525] space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors text-xs font-medium"
        >
          <Settings size={16} />
          <span>Project Settings</span>
        </button>
        <button
          onClick={onImportScreens}
          disabled={!persistenceAvailable || isImportingScreens}
          className="w-full flex items-center gap-3 px-3 py-2 border border-white/5 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 hover:text-white hover:bg-white/5"
        >
          <FolderOpen size={16} />
          <span>{isImportingScreens ? 'Reloading...' : 'Reload Saved Screens'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportScreen}
            disabled={!persistenceAvailable}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-black/20 border border-white/5 rounded text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white hover:bg-white/10"
            title="Export current screen to JSON"
          >
            <FolderOpen size={14} className="rotate-180" />
            <span>Export</span>
          </button>
          <button
            onClick={onImportScreenFromFile}
            disabled={!persistenceAvailable}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-black/20 border border-white/5 rounded text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white hover:bg-white/10"
            title="Import screen from JSON"
          >
            <FolderOpen size={14} />
            <span>Import</span>
          </button>
        </div>

        <button
          onClick={onOpenScreensFolder}
          disabled={!persistenceAvailable}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FolderOpen size={16} />
          <span>Open Screens Folder</span>
        </button>
        <button
          onClick={onOpenLogsFolder}
          disabled={!persistenceAvailable}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FolderOpen size={16} />
          <span>Open Logs Folder</span>
        </button>
        {persistenceAvailable && storagePaths?.screensDir && (
          <p className="text-[9px] text-gray-500 leading-tight break-words">
            Saved to: {storagePaths.screensDir}
          </p>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      {icon && <span className="text-gray-500">{icon}</span>}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-1">
      {children}
    </div>
  </div>
);

const ToolItem: React.FC<{ icon: React.ReactNode, label: string, description?: string, onClick: () => void, disabled?: boolean }> = ({
  icon, label, description, onClick, disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors border border-transparent
      ${disabled ? 'opacity-50 cursor-default bg-mc-bg/50' : 'bg-mc-btn hover:bg-mc-btnHover hover:border-gray-600'}
    `}
  >
    <div className="text-gray-300">{icon}</div>
    <div>
      <div className="text-xs text-white font-medium">{label}</div>
      {description && <div className="text-[9px] text-gray-500 leading-none mt-0.5">{description}</div>}
    </div>
  </button>
);

const ToolButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-3 bg-mc-btn hover:bg-mc-btnHover hover:border-gray-600 border border-transparent rounded transition-all group"
  >
    <div className="text-gray-400 group-hover:text-mc-accent transition-colors">{icon}</div>
    <span className="text-[10px] text-gray-300 font-medium">{label}</span>
  </button>
);

export default Sidebar;