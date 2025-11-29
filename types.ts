
export enum ElementType {
  BUTTON = 'BUTTON',
  LABEL = 'LABEL',
  TEXT_FIELD = 'TEXT_FIELD',
  PANEL = 'PANEL',
  SCROLL_PANEL = 'SCROLL_PANEL',
  SLOT = 'SLOT',
  CHECKBOX = 'CHECKBOX',
  SLIDER = 'SLIDER',
  DROPDOWN = 'DROPDOWN',
  IMAGE = 'IMAGE',
  ENTITY = 'ENTITY',
  ITEM = 'ITEM',
  PROGRESS_BAR = 'PROGRESS_BAR'
}

export type ElementVariant = 'DEFAULT' | 'SWITCH' | 'ICON' | 'ROUNDED';

export enum ModLoader {
  FABRIC = 'Fabric',
  FORGE = 'Forge',
  NEOFORGE = 'NeoForge',
  QUILT = 'Quilt',
  LWJGL2 = 'Client (LWJGL 2)'
}

export enum McVersion {
  V1_21 = '1.21',
  V1_20_4 = '1.20.4',
  V1_19_4 = '1.19.4',
  V1_18_2 = '1.18.2',
  V1_16_5 = '1.16.5',
  V1_12_2 = '1.12.2',
  V1_8_9 = '1.8.9'
}

export interface ProjectSettings {
  loader: ModLoader;
  version: McVersion;
  className: string;
  screenWidth: number;
  screenHeight: number;
  responsive: boolean; // Auto-scale UI in generated code
  backgroundColor?: string;
}

export interface Screen {
  id: string;
  name: string;
  elements: GuiElement[];
  settings: ProjectSettings;
  history: GuiElement[][];
  historyIndex: number;
  clipboard: GuiElement | null;
}

export interface GradientConfig {
  enabled: boolean;
  startColor: string;
  endColor: string;
  direction: 'vertical' | 'horizontal';
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;
  xOffset: number;
  yOffset: number;
  blur: number;
}

export type HoverAnimationType = 'NONE' | 'SCALE' | 'LIFT' | 'SLIDE_RIGHT' | 'GLOW' | 'BORDER_PULSE';

export interface HoverConfig {
  enabled: boolean;
  type: HoverAnimationType;
  duration: number; // seconds
  scale: number; // e.g. 1.05
  liftAmount: number; // pixels
  slideAmount: number; // pixels
  glowColor: string;
  glowBlur: number;
  brightness: number; // e.g. 1.2
}

export enum EventType {
  ON_CLICK = 'ON_CLICK',
  ON_CHANGE = 'ON_CHANGE'
}

export enum ActionType {
  OPEN_SCREEN = 'OPEN_SCREEN',
  EXECUTE_COMMAND = 'EXECUTE_COMMAND',
  PLAY_SOUND = 'PLAY_SOUND',
  CUSTOM_CODE = 'CUSTOM_CODE'
}

export interface EventAction {
  type: ActionType;
  value: string; // Screen class name, command, sound ID, or custom code
}

export interface GuiElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  variableName: string;

  // Basic properties
  rotation?: number; // Degrees 0-360

  // Extended properties
  checked?: boolean;
  min?: number;
  max?: number;
  value?: number; // Current value for Slider
  step?: number;  // Step size for Slider
  texturePath?: string;
  variant?: ElementVariant;

  // Modern Styling
  borderRadius?: number; // For rounded corners
  opacity?: number;      // 0.0 - 1.0
  backdropBlur?: number; // 0 - 20px (Glassmorphism)

  // New Styling Features
  fontFamily?: 'Minecraft' | 'Modern' | 'Mono';
  textAlign?: 'left' | 'center' | 'right';
  textShadow?: boolean;
  borderColor?: string;
  borderWidth?: number;

  // Advanced Visuals (Lunar Client Style)
  gradient?: GradientConfig;
  shadow?: ShadowConfig;
  hover?: HoverConfig;

  // Events
  events?: Partial<Record<EventType, EventAction>>;

  // New Element Specifics
  entityType?: string; // For ENTITY
  itemId?: string;     // For ITEM
  scale?: number;      // For ITEM/ENTITY
  options?: string[];  // For DROPDOWN
  progress?: number;   // For PROGRESS_BAR (0-100)
  tooltip?: string;    // For all elements
}

export interface AiFeedbackState {
  isLoading: boolean;
  content: string | null;
  error: string | null;
}

export const DEFAULT_ELEMENT_PROPS: Record<ElementType, Partial<GuiElement>> = {
  [ElementType.BUTTON]: {
    width: 100, height: 20, label: 'Button', borderRadius: 4, variant: 'DEFAULT', fontFamily: 'Minecraft', textAlign: 'center', textShadow: true, rotation: 0,
    gradient: { enabled: true, startColor: '#3c3c3c', endColor: '#2b2b2b', direction: 'vertical' },
    shadow: { enabled: true, color: '#000000', xOffset: 2, yOffset: 2, blur: 0 },
    hover: { enabled: true, type: 'SCALE', duration: 0.2, scale: 1.05, liftAmount: 2, slideAmount: 0, glowColor: '#ffffff', glowBlur: 10, brightness: 1.1 }
  },
  [ElementType.LABEL]: { width: 100, height: 10, label: 'Text Label', color: '#FFFFFF', fontFamily: 'Minecraft', textAlign: 'left', textShadow: true, rotation: 0 },
  [ElementType.TEXT_FIELD]: { width: 100, height: 20, label: '', borderRadius: 2, fontFamily: 'Minecraft', borderColor: '#a0a0a0', borderWidth: 1, color: '#000000', opacity: 0.5, rotation: 0 },
  [ElementType.PANEL]: {
    width: 200, height: 100, color: '#000000', opacity: 0.6, borderRadius: 8, borderColor: '#ffffff', borderWidth: 0, rotation: 0,
    backdropBlur: 4,
    shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', xOffset: 0, yOffset: 4, blur: 10 }
  },
  [ElementType.SLOT]: { width: 18, height: 18, color: '#8b8b8b', borderRadius: 2, rotation: 0 },
  [ElementType.CHECKBOX]: { width: 20, height: 20, label: 'Check', checked: false, variant: 'DEFAULT', fontFamily: 'Minecraft', rotation: 0 },
  [ElementType.SLIDER]: { width: 120, height: 20, label: 'Value', min: 0, max: 100, value: 50, step: 1, fontFamily: 'Minecraft', borderRadius: 4, rotation: 0 },
  [ElementType.IMAGE]: { width: 32, height: 32, color: '#FFFFFF', rotation: 0 },
  [ElementType.ENTITY]: { width: 30, height: 50, entityType: 'zombie', rotation: 0 },
  [ElementType.ITEM]: { width: 16, height: 16, itemId: 'diamond_sword', rotation: 0, scale: 1 },
  [ElementType.SCROLL_PANEL]: { width: 150, height: 200, color: '#000000', opacity: 0.5, borderRadius: 4, borderColor: '#ffffff', borderWidth: 1 },
  [ElementType.DROPDOWN]: { width: 100, height: 20, label: 'Select...', options: ['Option 1', 'Option 2'], borderRadius: 2, fontFamily: 'Minecraft' },
  [ElementType.PROGRESS_BAR]: { width: 100, height: 10, progress: 50, color: '#00FF00', borderRadius: 2, borderColor: '#000000', borderWidth: 1 }
};

declare global {
  interface Window {
    electron?: {
      isElectron?: boolean;
      storage?: {
        loadScreens: () => Promise<Screen[]>;
        saveScreens: (screens: Screen[]) => Promise<unknown>;
        getPaths: () => Promise<{ dataRoot: string; screensDir: string; logsDir: string; }>;
        openScreensFolder: () => Promise<string>;
        openLogsFolder: () => Promise<string>;
        exportScreen: (screen: Screen) => Promise<boolean>;
        importScreen: () => Promise<Screen | null>;
      };
    };
  }
}

export { };
