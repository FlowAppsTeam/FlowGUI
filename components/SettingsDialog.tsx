import * as React from 'react';
const { useEffect } = React;
import { ProjectSettings, ModLoader, McVersion } from '../types';
import { X, Monitor, Cpu, Scaling, Palette } from 'lucide-react';
import { ColorPickerPopover } from './ColorPicker';

interface SettingsDialogProps {
  settings: ProjectSettings;
  onSave: (settings: ProjectSettings) => void;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState<ProjectSettings>(settings);
  const [guiScale, setGuiScale] = React.useState(2);
  const [baseRes, setBaseRes] = React.useState({ w: 1920, h: 1080 });

  // Update logical size when base res or scale changes
  const updateResolution = (w: number, h: number, scale: number) => {
    setBaseRes({ w, h });
    setGuiScale(scale);
    setLocalSettings(prev => ({
      ...prev,
      screenWidth: Math.ceil(w / scale),
      screenHeight: Math.ceil(h / scale)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-mc-panel border border-mc-border w-full max-w-lg shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-mc-border bg-[#252525]">
          <div>
            <h2 className="text-white font-bold text-lg">Project Settings</h2>
            <p className="text-xs text-gray-400 mt-1">Configure your environment and display settings</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">

          {/* Environment Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-mc-accent uppercase tracking-wider">
              <Cpu size={14} />
              Environment
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">Mod Loader / Platform</label>
                <select
                  value={localSettings.loader}
                  onChange={(e) => setLocalSettings({ ...localSettings, loader: e.target.value as ModLoader })}
                  className="w-full bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm text-white outline-none focus:border-mc-accent transition-colors"
                >
                  {Object.values(ModLoader).map(loader => (
                    <option key={loader} value={loader}>{loader}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">Minecraft Version</label>
                <select
                  value={localSettings.version}
                  onChange={(e) => setLocalSettings({ ...localSettings, version: e.target.value as McVersion })}
                  className="w-full bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm text-white outline-none focus:border-mc-accent transition-colors"
                >
                  {Object.values(McVersion).map(ver => (
                    <option key={ver} value={ver}>{ver}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-300">Java Class Name</label>
              <input
                type="text"
                value={localSettings.className}
                onChange={(e) => setLocalSettings({ ...localSettings, className: e.target.value })}
                className="w-full bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm text-white outline-none focus:border-mc-accent font-mono"
                placeholder="MyScreen"
              />
            </div>
          </div>

          <div className="w-full h-[1px] bg-mc-border/50" />

          {/* Display Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-mc-accent uppercase tracking-wider">
              <Monitor size={14} />
              Screen & Resolution
            </div>

            <div className="bg-black/20 rounded p-3 border border-white/5 space-y-3">
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateResolution(1920, 1080, 2)} className="flex-1 py-1.5 text-xs bg-mc-btn hover:bg-mc-btnHover border border-mc-border rounded text-gray-300 transition-colors">1080p (Scale 2)</button>
                <button onClick={() => updateResolution(1920, 1080, 3)} className="flex-1 py-1.5 text-xs bg-mc-btn hover:bg-mc-btnHover border border-mc-border rounded text-gray-300 transition-colors">1080p (Scale 3)</button>
                <button onClick={() => updateResolution(1280, 720, 2)} className="flex-1 py-1.5 text-xs bg-mc-btn hover:bg-mc-btnHover border border-mc-border rounded text-gray-300 transition-colors">720p (Scale 2)</button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase">Base Width</label>
                  <input type="number" value={baseRes.w} onChange={(e) => updateResolution(parseInt(e.target.value), baseRes.h, guiScale)} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1.5 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase">Base Height</label>
                  <input type="number" value={baseRes.h} onChange={(e) => updateResolution(baseRes.w, parseInt(e.target.value), guiScale)} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1.5 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase">GUI Scale</label>
                  <input type="number" value={guiScale} onChange={(e) => updateResolution(baseRes.w, baseRes.h, parseInt(e.target.value))} className="w-full bg-mc-bg border border-mc-border rounded px-2 py-1.5 text-xs text-white" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">Logical Canvas Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-500">W</span>
                    <input
                      type="number"
                      value={localSettings.screenWidth}
                      onChange={(e) => setLocalSettings({ ...localSettings, screenWidth: parseInt(e.target.value) })}
                      className="w-full bg-mc-bg border border-mc-border rounded pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-mc-accent font-mono"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-500">H</span>
                    <input
                      type="number"
                      value={localSettings.screenHeight}
                      onChange={(e) => setLocalSettings({ ...localSettings, screenHeight: parseInt(e.target.value) })}
                      className="w-full bg-mc-bg border border-mc-border rounded pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-mc-accent font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">Canvas Background</label>
                <ColorPickerPopover
                  color={localSettings.backgroundColor || '#000000'}
                  onChange={(c) => setLocalSettings({ ...localSettings, backgroundColor: c })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded bg-blue-500/10 border border-blue-500/30">
              <Scaling size={24} className="text-blue-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="responsive-chk" className="text-sm font-medium text-white cursor-pointer select-none">Adaptive Resolution</label>
                  <input
                    id="responsive-chk"
                    type="checkbox"
                    checked={localSettings.responsive}
                    onChange={(e) => setLocalSettings({ ...localSettings, responsive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Automatically generates code that adapts to any screen size using relative positioning (e.g. <code>this.width / 2</code>).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-mc-border bg-[#252525] flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-300 hover:bg-white/5 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(localSettings); onClose(); }}
            className="px-6 py-2 bg-mc-accent hover:bg-blue-600 text-white font-medium rounded shadow-lg transition-colors text-sm"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;