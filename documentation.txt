# FlowGUI Documentation

Welcome to the official documentation for **FlowGUI**, the advanced layout architect for Minecraft GUIs. This tool allows you to visually design, prototype, and generate Java code for Minecraft screens across multiple mod loaders and versions.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Core Features](#core-features)
4. [Project Settings](#project-settings)
5. [Code Generation](#code-generation)
6. [Advanced Features](#advanced-features)
7. [Shortcuts](#shortcuts)

---

## Getting Started

FlowGUI is a desktop application built with Electron. Once installed, you can immediately start designing your first screen.

### Creating a New Project
When you open FlowGUI, you start with a default "Screen 1". You can configure your project settings immediately to match your target Minecraft version and Mod Loader.

1. Click the **Settings** gear icon in the Sidebar.
2. Select your **Mod Loader** (Fabric, Forge, NeoForge, Quilt, or Legacy LWJGL 2).
3. Select your **Minecraft Version** (1.8.9 up to 1.21).
4. Set your **Class Name** (e.g., `MyCustomScreen`).

---

## Interface Overview

The interface is divided into three main sections:

### 1. Sidebar (Left)
The Sidebar contains your toolset and project controls.
- **Tools**: Select, Move.
- **Controls**: Add interactive elements like Buttons, Checkboxes, Switches, Sliders, and Input Fields.
- **Visuals**: Add static elements like Labels and Images.
- **Containers**: Add Panels and Slots for inventory-like interfaces.
- **Footer**: Access Project Settings, Export/Import screens, and open data folders.

### 2. Canvas (Center)
The central area is your workspace.
- **Drag & Drop**: Move elements freely.
- **Resize**: Drag handles to resize elements.
- **Tabs**: Manage multiple screens within a single project using the tab bar at the top.
- **Preview Mode**: Toggle the "Play" button in the top toolbar to interact with your UI (test hover effects, clicks, etc.) without editing.

### 3. Inspector (Right)
The Inspector allows you to fine-tune the selected element. It has four tabs:
- **Design**: Edit properties like position, size, color, gradients, shadows, and typography.
- **Events**: Configure what happens when users interact with the element (e.g., On Click).
- **Code**: View the real-time generated Java code for the selected element or the entire screen.
- **AI**: Use the AI assistant to analyze your layout and get design suggestions.

---

## Core Features

### Element Types
FlowGUI supports a variety of standard Minecraft GUI elements:
- **Button**: Standard Minecraft button. Supports text, icons, and custom styling.
- **Label**: Text labels with support for Minecraft font, Modern font (Inter), or Monospace.
- **TextField**: Input fields for user text entry.
- **Checkbox / Switch**: Boolean toggles.
- **Slider**: Numeric value selectors.
- **Panel**: Background containers, useful for grouping elements or creating "glass" effects.
- **Slot**: Item slots, typically used in inventory GUIs.
- **Image**: Display textures or external images.

### Styling System
FlowGUI offers a powerful styling engine that goes beyond vanilla Minecraft:
- **Colors**: Full RGB/Hex color support with opacity.
- **Gradients**: Create vertical or horizontal gradients for backgrounds and buttons.
- **Shadows**: Add drop shadows with customizable blur, offset, and color.
- **Borders**: Add borders with custom width and color.
- **Rounded Corners**: Modernize your UI with adjustable border radius.
- **Glassmorphism**: Apply backdrop blur (requires shader support in-game) for a frosted glass effect.

### Layout Tools
- **Alignment**: Quickly align elements to the center, edges, or specific quadrants of the screen.
- **Z-Index**: (Implicit) Elements added later render on top. You can reorder them by cutting and pasting.

---

## Project Settings

Access the settings via the Sidebar to configure your environment.

### Environment
- **Mod Loader**: Choose the target platform. The code generator adjusts imports and rendering logic accordingly.
- **Version**: Select the Minecraft version. FlowGUI handles the API differences (e.g., `MatrixStack` vs `DrawContext`, `GL11` vs `RenderSystem`).

### Screen & Resolution
- **Resolution**: Set the base canvas size (e.g., 1920x1080).
- **GUI Scale**: Simulate different GUI scales (Auto, Normal, Large) to ensure your UI looks good on all screens.
- **Adaptive Resolution**: When enabled, the generated code uses relative positioning (e.g., `this.width / 2 - 50`) instead of hardcoded coordinates. This ensures your GUI centers or stretches correctly on different window sizes.

---

## Code Generation

FlowGUI generates production-ready Java code in real-time.

1. **View Code**: Select the **Code** tab in the Inspector to see the code for the current screen.
2. **Copy Code**: Click the Copy button to copy the entire class to your clipboard.
3. **Structure**: The generated code includes:
    - **Imports**: Correctly selected based on your Loader/Version.
    - **Class Definition**: Extends `Screen` or `GuiScreen`.
    - **Init Method**: Initializes widgets and layouts.
    - **Render Method**: Handles drawing, including custom effects like gradients and rotation.

**Supported APIs:**
- Fabric / Quilt / NeoForge (Modern)
- Forge (1.16+)
- Legacy MCP (1.8.9 - 1.12.2)

---

## Advanced Features

### Event System
Make your GUI interactive without writing code manually. In the **Events** tab of the Inspector, you can assign actions to triggers (like `On Click`):
- **Open Screen**: Switch to another screen in your project.
- **Execute Command**: Run a chat command (e.g., `gamemode creative`).
- **Play Sound**: Trigger a sound effect.
- **Custom Code**: Inject arbitrary Java code into the event handler.

### Multi-Screen Management
- **Tabs**: Work on multiple screens simultaneously.
- **Linking**: Use the "Open Screen" event to create navigation flows between your screens.

### Export & Import
- **Export**: Save your screen as a `.json` file to share with others or back up.
- **Import**: Load a `.json` screen file into your current project.
- **Auto-Save**: FlowGUI automatically saves your work locally.

### AI Assistant
- **Analyze Layout**: Click the "Analyze" button in the AI tab. The assistant will review your layout and offer suggestions on alignment, color harmony, and user experience.

---

## Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Undo** | `Ctrl + Z` |
| **Redo** | `Ctrl + Y` or `Ctrl + Shift + Z` |
| **Copy** | `Ctrl + C` |
| **Paste** | `Ctrl + V` |
| **Delete** | `Delete` or `Backspace` |
| **Save** | (Auto-saved) |

---

*FlowGUI is a tool designed to accelerate Minecraft mod development. It is not affiliated with Mojang Studios.*
