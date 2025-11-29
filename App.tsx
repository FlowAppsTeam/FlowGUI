import * as React from 'react';
const { useState, useMemo, useEffect, useCallback, useRef } = React;
import { GuiElement, ElementType, DEFAULT_ELEMENT_PROPS, AiFeedbackState, ProjectSettings, ModLoader, McVersion, Screen } from './types';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import SettingsDialog from './components/SettingsDialog';
import TabBar from './components/TabBar';
import { generateJavaCode } from './services/codeGenerator';
import { analyzeGuiWithGemini } from './services/geminiService';
import { Play, PenTool, Undo, Redo } from 'lucide-react';

const App: React.FC = () => {
  // Multi-screen state
  const [screens, setScreens] = useState<Screen[]>([{
    id: '1',
    name: 'Screen 1',
    elements: [],
    settings: {
      loader: ModLoader.FABRIC,
      version: McVersion.V1_20_4,
      className: 'MyCustomScreen',
      screenWidth: 427,
      screenHeight: 240,
      responsive: true,
      backgroundColor: '#000000'
    },
    history: [[]],
    historyIndex: 0,
    clipboard: null
  }]);

  const [activeScreenId, setActiveScreenId] = useState('1');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [aiState, setAiState] = useState<AiFeedbackState>({ isLoading: false, content: null, error: null });
  const persistenceAvailable = typeof window !== 'undefined' && !!window.electron?.storage;
  const hasHydratedScreensRef = useRef(!persistenceAvailable);
  const [storagePaths, setStoragePaths] = useState<{ dataRoot?: string; screensDir?: string; logsDir?: string }>({});
  const [isImportingScreens, setIsImportingScreens] = useState(false);
  // Load persisted screens from disk
  useEffect(() => {
    if (!persistenceAvailable || !window.electron?.storage?.loadScreens) {
      hasHydratedScreensRef.current = true;
      return;
    }

    let cancelled = false;
    window.electron.storage.loadScreens()
      .then((savedScreens) => {
        if (cancelled || !savedScreens || savedScreens.length === 0) return;
        setScreens(savedScreens);
        setActiveScreenId(savedScreens[0].id);
      })
      .catch((err) => {
        console.error('[SCREEN STORAGE] Failed to load saved screens', err);
      })
      .finally(() => {
        if (!cancelled) {
          hasHydratedScreensRef.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [persistenceAvailable]);

  // Persist screens whenever they change
  useEffect(() => {
    if (!persistenceAvailable || !window.electron?.storage?.saveScreens) return;
    if (!hasHydratedScreensRef.current) return;

    window.electron.storage.saveScreens(screens).catch((err) => {
      console.error('[SCREEN STORAGE] Failed to save screens', err);
    });
  }, [screens, persistenceAvailable]);

  // Fetch storage paths for UI helpers
  useEffect(() => {
    if (!persistenceAvailable || !window.electron?.storage?.getPaths) return;
    window.electron.storage.getPaths()
      .then((paths) => setStoragePaths(paths || {}))
      .catch((err) => console.error('[SCREEN STORAGE] Failed to load storage paths', err));
  }, [persistenceAvailable]);

  const handleImportSavedScreens = useCallback(async () => {
    if (!persistenceAvailable || !window.electron?.storage?.loadScreens) return;
    setIsImportingScreens(true);
    try {
      const savedScreens = await window.electron.storage.loadScreens();
      if (savedScreens && savedScreens.length > 0) {
        setScreens(savedScreens);
        setActiveScreenId(savedScreens[0].id);
      }
    } catch (err) {
      console.error('[SCREEN STORAGE] Failed to import saved screens', err);
    } finally {
      setIsImportingScreens(false);
    }
  }, [persistenceAvailable]);

  const handleOpenScreensFolder = useCallback(() => {
    if (!persistenceAvailable || !window.electron?.storage?.openScreensFolder) return;
    window.electron.storage.openScreensFolder().catch((err) => {
      console.error('[SCREEN STORAGE] Failed to open screens folder', err);
    });
  }, [persistenceAvailable]);

  const handleOpenLogsFolder = useCallback(() => {
    if (!persistenceAvailable || !window.electron?.storage?.openLogsFolder) return;
    window.electron.storage.openLogsFolder().catch((err) => {
      console.error('[SCREEN STORAGE] Failed to open logs folder', err);
    });
  }, [persistenceAvailable]);


  // Get active screen
  const activeScreen = useMemo(() =>
    screens.find(s => s.id === activeScreenId) || screens[0],
    [screens, activeScreenId]
  );

  // Generate ID helper
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleExportScreen = useCallback(async () => {
    if (!persistenceAvailable || !window.electron?.storage?.exportScreen) return;
    try {
      await window.electron.storage.exportScreen(activeScreen);
    } catch (err) {
      console.error('[SCREEN STORAGE] Failed to export screen', err);
    }
  }, [persistenceAvailable, activeScreen]);

  const handleImportScreenFromFile = useCallback(async () => {
    if (!persistenceAvailable || !window.electron?.storage?.importScreen) return;
    try {
      const importedScreen = await window.electron.storage.importScreen();
      if (importedScreen) {
        // Generate a new ID to avoid conflicts
        const newScreen = { ...importedScreen, id: generateId() };
        setScreens(prev => [...prev, newScreen]);
        setActiveScreenId(newScreen.id);
      }
    } catch (err) {
      console.error('[SCREEN STORAGE] Failed to import screen', err);
    }
  }, [persistenceAvailable]);

  // Update active screen
  const updateActiveScreen = (updates: Partial<Screen>) => {
    setScreens(prev => prev.map(s =>
      s.id === activeScreenId ? { ...s, ...updates } : s
    ));
  };

  // Snapshot current elements to history
  const snapshot = useCallback(() => {
    setScreens(prev => prev.map(s => {
      if (s.id !== activeScreenId) return s;

      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(s.elements);

      return {
        ...s,
        history: newHistory,
        historyIndex: s.historyIndex + 1
      };
    }));
  }, [activeScreenId]);

  // Initial Snapshot
  useEffect(() => {
    if (activeScreen.historyIndex === 0 && activeScreen.history.length === 1 && activeScreen.history[0].length === 0 && activeScreen.elements.length > 0) {
      snapshot();
    }
  }, [snapshot, activeScreen.elements.length, activeScreen.history.length, activeScreen.historyIndex]);

  const undo = () => {
    if (activeScreen.historyIndex > 0) {
      const newIndex = activeScreen.historyIndex - 1;
      updateActiveScreen({
        historyIndex: newIndex,
        elements: activeScreen.history[newIndex]
      });
    }
  };

  const redo = () => {
    if (activeScreen.historyIndex < activeScreen.history.length - 1) {
      const newIndex = activeScreen.historyIndex + 1;
      updateActiveScreen({
        historyIndex: newIndex,
        elements: activeScreen.history[newIndex]
      });
    }
  };

  const handleCopy = () => {
    const firstSelectedId = Array.from(selectedIds)[0];
    const selected = activeScreen.elements.find(el => el.id === firstSelectedId);
    if (selected) {
      updateActiveScreen({ clipboard: selected });
    }
  };

  const handlePaste = () => {
    if (activeScreen.clipboard) {
      const newId = generateId();
      const newElement = {
        ...activeScreen.clipboard,
        id: newId,
        x: activeScreen.clipboard.x + 10,
        y: activeScreen.clipboard.y + 10,
        variableName: `${activeScreen.clipboard.type.toLowerCase()}_${activeScreen.elements.length + 1}`
      };
      const newElements = [...activeScreen.elements, newElement];

      const newHistory = activeScreen.history.slice(0, activeScreen.historyIndex + 1);
      newHistory.push(newElements);

      updateActiveScreen({
        elements: newElements,
        history: newHistory,
        historyIndex: activeScreen.historyIndex + 1
      });
      setSelectedIds(new Set([newId]));
    }
  };

  const handleAddElement = (type: ElementType, extraProps: Partial<GuiElement> = {}) => {
    if (isPreview) return;

    const defaults = DEFAULT_ELEMENT_PROPS[type];
    const id = generateId();

    const newElement: GuiElement = {
      id,
      type,
      x: 20 + (activeScreen.elements.length * 10),
      y: 20 + (activeScreen.elements.length * 10),
      width: defaults.width || 50,
      height: defaults.height || 50,
      label: defaults.label,
      color: defaults.color,
      borderRadius: defaults.borderRadius,
      opacity: defaults.opacity,
      rotation: defaults.rotation || 0,
      variant: extraProps.variant || defaults.variant,
      checked: defaults.checked,
      min: defaults.min,
      max: defaults.max,
      value: defaults.value,
      step: defaults.step,
      texturePath: defaults.texturePath,
      variableName: `${type.toLowerCase()}_${activeScreen.elements.length + 1}`,
      ...extraProps,
      ...defaults.hover && { hover: defaults.hover },
      ...defaults.gradient && { gradient: defaults.gradient },
      ...defaults.shadow && { shadow: defaults.shadow }
    };

    const newElements = [...activeScreen.elements, newElement];
    const newHistory = activeScreen.history.slice(0, activeScreen.historyIndex + 1);
    newHistory.push(newElements);

    updateActiveScreen({
      elements: newElements,
      history: newHistory,
      historyIndex: activeScreen.historyIndex + 1
    });
    setSelectedIds(new Set([id]));
  };

  const handleUpdateElement = (id: string, updates: Partial<GuiElement>) => {
    // If updating position and multiple selected, calculate delta and apply to all
    if ((updates.x !== undefined || updates.y !== undefined) && selectedIds.size > 1 && selectedIds.has(id)) {
      const element = activeScreen.elements.find(el => el.id === id);
      if (element) {
        const deltaX = updates.x !== undefined ? updates.x - element.x : 0;
        const deltaY = updates.y !== undefined ? updates.y - element.y : 0;

        updateActiveScreen({
          elements: activeScreen.elements.map(el =>
            selectedIds.has(el.id) ? { ...el, x: el.x + deltaX, y: el.y + deltaY } : el
          )
        });
        return;
      }
    }

    // Single element update or non-position update
    updateActiveScreen({
      elements: activeScreen.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  const handleDeleteElement = (id?: string) => {
    // If id is provided, delete that one. Otherwise delete all selected.
    const idsToDelete = id ? new Set([id]) : selectedIds;
    const newElements = activeScreen.elements.filter(el => !idsToDelete.has(el.id));
    const newHistory = activeScreen.history.slice(0, activeScreen.historyIndex + 1);
    newHistory.push(newElements);

    updateActiveScreen({
      elements: newElements,
      history: newHistory,
      historyIndex: activeScreen.historyIndex + 1
    });

    setSelectedIds(new Set());
  };

  // Tab management
  const handleNewTab = () => {
    const newId = generateId();
    const newScreen: Screen = {
      id: newId,
      name: `Screen ${screens.length + 1}`,
      elements: [],
      settings: { ...screens[0].settings, className: `Screen${screens.length + 1}` },
      history: [[]],
      historyIndex: 0,
      clipboard: null
    };
    setScreens(prev => [...prev, newScreen]);
    setActiveScreenId(newId);
    setSelectedIds(new Set());
  };

  const handleCloseTab = (screenId: string) => {
    if (screens.length === 1) return;

    const screenIndex = screens.findIndex(s => s.id === screenId);
    const newScreens = screens.filter(s => s.id !== screenId);
    setScreens(newScreens);

    if (activeScreenId === screenId) {
      const newActiveIndex = Math.max(0, screenIndex - 1);
      setActiveScreenId(newScreens[newActiveIndex].id);
    }
    setSelectedIds(new Set());
  };

  const handleRenameTab = (screenId: string, newName: string) => {
    setScreens(prev => prev.map(s =>
      s.id === screenId ? { ...s, name: newName } : s
    ));
  };

  const handleTabClick = (screenId: string) => {
    setActiveScreenId(screenId);
    setSelectedIds(new Set());
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreview) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !isInput) {
        e.preventDefault();
        const allIds = new Set(activeScreen.elements.map(el => el.id));
        setSelectedIds(allIds);
        return;
      }

      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedIds.size > 0) {
          handleDeleteElement();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            if (!isInput) {
              e.preventDefault();
              handleCopy();
            }
            break;
          case 'v':
            if (!isInput) {
              e.preventDefault();
              handlePaste();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, isPreview, activeScreen.elements, activeScreen.historyIndex, activeScreen.clipboard]);

  const handleAnalyze = async () => {
    setAiState({ isLoading: true, content: null, error: null });
    try {
      const result = await analyzeGuiWithGemini(activeScreen.elements, activeScreen.settings);
      setAiState({ isLoading: false, content: result, error: null });
    } catch (err) {
      setAiState({ isLoading: false, content: null, error: "Failed to connect to AI service." });
    }
  };

  const handleSaveSettings = (newSettings: ProjectSettings) => {
    updateActiveScreen({ settings: newSettings });
    setShowSettings(false);
  };

  // Derive generated code
  const generatedCode = useMemo(() => generateJavaCode(activeScreen.elements, activeScreen.settings, screens), [activeScreen.elements, activeScreen.settings, screens]);

  const selectedElement = useMemo(() =>
    selectedIds.size === 1 ? activeScreen.elements.find(el => el.id === Array.from(selectedIds)[0]) || null : null,
    [activeScreen.elements, selectedIds]);

  return (
    <div className="flex h-screen bg-mc-bg text-mc-text font-sans overflow-hidden">
      <Sidebar
        onAddElement={handleAddElement}
        onOpenSettings={() => setShowSettings(true)}
        persistenceAvailable={persistenceAvailable}
        onImportScreens={handleImportSavedScreens}
        onOpenScreensFolder={handleOpenScreensFolder}
        onOpenLogsFolder={handleOpenLogsFolder}
        storagePaths={storagePaths}
        isImportingScreens={isImportingScreens}
        onExportScreen={handleExportScreen}
        onImportScreenFromFile={handleImportScreenFromFile}
      />

      <div className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden">
        <header
          className="h-12 border-b border-mc-border bg-mc-panel flex items-center px-4 justify-between shrink-0 shadow-sm z-30"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase block leading-none mb-1">Project Class</span>
              <h1 className="text-sm font-bold text-white tracking-wide leading-none">
                {activeScreen.settings.className}
              </h1>
            </div>
            <div className="h-6 w-[1px] bg-mc-border/50 mx-2"></div>

            {/* Tab Bar */}
            <TabBar
              screens={screens.map(s => ({ id: s.id, name: s.name }))}
              activeScreenId={activeScreenId}
              onTabClick={handleTabClick}
              onNewTab={handleNewTab}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
            />

            <div className="h-6 w-[1px] bg-mc-border/50 mx-2"></div>

            {/* History Controls */}
            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <button onClick={undo} disabled={activeScreen.historyIndex <= 0} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)">
                <Undo size={14} className="text-gray-300" />
              </button>
              <button onClick={redo} disabled={activeScreen.historyIndex >= activeScreen.history.length - 1} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)">
                <Redo size={14} className="text-gray-300" />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-mc-border/50 mx-2"></div>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-[10px] text-gray-400 font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded hover:bg-black/60 hover:text-white transition-colors cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
              {activeScreen.settings.loader} {activeScreen.settings.version}
            </button>
          </div>

          <div className="flex items-center bg-black/30 p-1 rounded-lg border border-white/5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={() => { setIsPreview(false); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${!isPreview ? 'bg-mc-accent text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <PenTool size={12} />
              Edit
            </button>
            <button
              onClick={() => { setIsPreview(true); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${isPreview ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Play size={12} />
              Preview
            </button>
          </div>
        </header>

        <Canvas
          elements={activeScreen.elements}
          selectedIds={selectedIds}
          onSelect={(id, multi) => {
            if (!id) {
              // Clicking on empty canvas - clear selection
              setSelectedIds(new Set());
              return;
            }

            if (multi) {
              // Shift+Click - toggle selection
              const newSet = new Set(selectedIds);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              setSelectedIds(newSet);
            } else {
              // Normal click - if clicking on already selected item and multiple are selected, don't change
              // This prevents accidental deselection when starting to drag
              if (selectedIds.size > 1 && selectedIds.has(id)) {
                // Don't change selection when clicking on an already-selected item
                return;
              }
              // Single select
              setSelectedIds(new Set([id]));
            }
          }}
          onSelectMultiple={(ids) => {
            setSelectedIds(new Set(ids));
          }}
          onUpdateElement={handleUpdateElement}
          onSnapshot={snapshot}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          settings={activeScreen.settings}
          isPreview={isPreview}
          screens={screens.map(s => ({ id: s.id, name: s.name, settings: { className: s.settings.className } }))}
          activeScreenId={activeScreenId}
          onPreviewScreenChange={setActiveScreenId}
        />
      </div>

      <Inspector
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onSnapshot={snapshot}
        generatedCode={generatedCode}
        onAnalyze={handleAnalyze}
        aiState={aiState}
        canvasWidth={activeScreen.settings.screenWidth}
        canvasHeight={activeScreen.settings.screenHeight}
        screens={screens.map(s => ({ id: s.id, name: s.name, settings: { className: s.settings.className } }))}
      />

      {showSettings && (
        <SettingsDialog
          settings={activeScreen.settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;