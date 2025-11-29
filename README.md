# FlowGUI - Minecraft GUI Designer

![FlowGUI Banner](https://github.com/FlowAppsTeam/FlowGUI/raw/main/icon.png)

FlowGUI is a powerful visual editor for creating and designing Minecraft modding GUIs with an intuitive drag-and-drop interface. It generates clean, production-ready Java code for popular mod loaders like Fabric and Forge.

## ✨ Features

- 🎨 **Visual Editor**: Intuitive drag-and-drop interface for designing Minecraft GUIs
- ⚡ **Real-time Preview**: See your GUI changes instantly
- 🧩 **Component Library**: Wide range of Minecraft UI components
- 🎯 **Responsive Design**: Design GUIs that work across different screen sizes
- 🤖 **AI-Powered Assistance**: Get smart suggestions and code completions
- 📦 **Multi-Screen Support**: Manage multiple GUI screens in a single project
- 🛠 **Mod Loader Support**: Generate code for Fabric, Forge, and more
- 📝 **Custom Styling**: Fine-tune every aspect of your GUI elements
- 🔄 **Version Control Ready**: Clean, maintainable code output

## 🚀 Getting Started

### Download the Latest Release

1. Go to the [Releases](https://github.com/FlowAppsTeam/FlowGUI/releases) page
2. Download the latest version for your operating system
3. Run the application

## 🖥️ Project Structure

```
FlowGUI/
├── components/         # React components
│   ├── Canvas.tsx     # Main canvas for GUI design
│   ├── Inspector.tsx  # Property inspector
│   ├── Sidebar.tsx    # Component library
│   └── ...
├── services/          # Business logic
│   ├── codeGenerator.ts # Code generation logic
│   └── geminiService.ts # AI integration
├── public/            # Static assets
├── App.tsx            # Main application component
└── main.js            # Electron entry point
```

## 🛠 Usage

1. **Create a New Screen**: Click the "+" button to add a new GUI screen
2. **Add Components**: Drag and drop components from the sidebar
3. **Customize Properties**: Select any element to edit its properties
4. **Preview**: Toggle preview mode to see how your GUI will look in-game
5. **Generate Code**: Click the "Generate Code" button to get the Java code
6. **Export**: Save your project or export the generated code

## 🤖 AI Features

FlowGUI includes AI-powered features to enhance your workflow:

- **Smart Suggestions**: Get component recommendations based on your design
- **Code Optimization**: Let AI suggest improvements to your GUI code
- **Natural Language**: Describe what you want in plain English and let AI help build it

## 📦 Building for Production

To create a production build:

```bash
# Build the React app
npm run build

# Package the Electron app
npm run dist
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow the standard GitHub workflow for submitting pull requests.

## 📧 Contact

For support or questions, please open an issue on our [GitHub repository](https://github.com/FlowAppsTeam/FlowGUI).

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/FlowAppsTeam/FlowGUI?style=social)
![GitHub forks](https://img.shields.io/github/forks/FlowAppsTeam/FlowGUI?style=social)
![GitHub license](https://img.shields.io/github/license/FlowAppsTeam/FlowGUI)

---

Made with ❤️ by the FlowApps Team
