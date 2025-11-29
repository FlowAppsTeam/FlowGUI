import * as React from 'react';
const { useState } = React;
import { X, Plus } from 'lucide-react';

interface TabBarProps {
    screens: Array<{ id: string; name: string }>;
    activeScreenId: string;
    onTabClick: (screenId: string) => void;
    onNewTab: () => void;
    onCloseTab: (screenId: string) => void;
    onRenameTab: (screenId: string, newName: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({
    screens,
    activeScreenId,
    onTabClick,
    onNewTab,
    onCloseTab,
    onRenameTab
}) => {
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleDoubleClick = (screen: { id: string; name: string }) => {
        setEditingTabId(screen.id);
        setEditingName(screen.name);
    };

    const handleNameChange = (screenId: string) => {
        if (editingName.trim()) {
            onRenameTab(screenId, editingName.trim());
        }
        setEditingTabId(null);
    };

    return (
        <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="flex items-center gap-1 max-w-md overflow-x-auto scrollbar-thin">
                {screens.map((screen) => (
                    <div
                        key={screen.id}
                        className={`group relative flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${activeScreenId === screen.id
                                ? 'bg-mc-accent text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        onClick={() => onTabClick(screen.id)}
                    >
                        {editingTabId === screen.id ? (
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleNameChange(screen.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameChange(screen.id);
                                    if (e.key === 'Escape') setEditingTabId(null);
                                }}
                                autoFocus
                                className="bg-mc-bg border border-mc-accent rounded px-1 py-0 text-xs w-24 outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span onDoubleClick={() => handleDoubleClick(screen)}>{screen.name}</span>
                        )}

                        {screens.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(screen.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded p-0.5"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={onNewTab}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="New Screen"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};

export default TabBar;
