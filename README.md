# ⚡ SD Quick UI

A modern, fast, and feature-rich Vue 3 frontend for Stable Diffusion WebUI.

Designed for rapid iteration and efficient workflow with the unique **Prompt Slots System** that lets you quickly switch between different generation settings.

## ✨ Key Features

### 🎯 Unique Features
- **Prompt Slots System** - Save and switch between 3 different prompt/parameter sets instantly
- **Auto-save** - All settings automatically saved to slots
- **Fast Workflow** - Optimized UI for rapid generation iterations

### 🖼️ Generation Features
- **txt2img Generation** with full parameter control
- **Hires. fix** support with all upscalers
- **ADetailer** integration (up to 4 simultaneous detailers)
  - Individual prompts for each ADetailer
  - Face, hand, person, breast detection models
- **Infinite Generation Mode** - Continuous generation with random seeds
- **Real-time Progress** - Detailed progress tracking with ETA
- **Generation Controls** - Interrupt, skip, pause capabilities

### 🛠️ Productivity Tools
- **Queue System** - Batch generation with queue management
- **Bookmark Manager** - Save favorite prompt combinations
- **Preset Manager** - Quick parameter presets
- **LoRA Browser** - Easy LoRA selection and insertion
- **Prompt Helper** - Pre-built prompt fragments
- **PNG Info Reader** - Drag & drop PNG to load generation parameters

### 💾 Data Management
- **History Panel** - Last 15 generated images
- **Auto-save to Disk** - Images automatically saved to WebUI output folder
- **LocalStorage** - UI state and history persistence
- **Slot System** - 3 independent parameter slots

## 🚀 Quick Start

### Prerequisites

1. **Stable Diffusion WebUI** (AUTOMATIC1111)
   - Must be installed and working
   - Tested with WebUI v1.7.0+

2. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

### Option A: One-Click Launch (Recommended for Windows)

1. **Clone this repository** to the parent directory of your stable-diffusion-webui:
   ```
   F:\003.stable-diffusion\
   ├── stable-diffusion-webui\
   └── sd-vue-ui\              ← Clone here
   ```

2. **Double-click to run:**
   - `stable-diffusion-webui\start-all.bat` - Starts both WebUI API and Vue UI
   - OR run separately:
     - `stable-diffusion-webui\webui-api.bat` - WebUI API only
     - `sd-vue-ui\start-vue.bat` - Vue UI only

3. **Open your browser** when both servers are ready:
   ```
   http://localhost:5173
   ```

The batch files will automatically:
- Check Node.js installation
- Install dependencies on first run
- Start the development servers

### Option B: Manual Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/yourusername/sd-vue-ui.git
   cd sd-vue-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Stable Diffusion WebUI in API mode**

   Use the provided `webui-api.bat` or add `--api --nowebui` flags:
   ```bash
   # Windows
   webui-api.bat

   # Linux/Mac
   ./webui.sh --api --nowebui --cors-allow-origins=http://localhost:5173
   ```

4. **Start Vue UI development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📖 Usage Guide

### Prompt Slots System

The **Prompt Slots** are the core feature that sets SD Quick UI apart:

- **3 Independent Slots** - Each slot stores:
  - Prompt & Negative Prompt
  - All generation parameters (steps, CFG, sampler, size, etc.)
  - Hires fix settings
  - ADetailer configurations

- **Auto-save** - Settings automatically saved when changed
- **Instant Switch** - Click slot buttons to switch between configurations
- **Visual Indicators** - Filled slots show a colored badge

**Workflow Example:**
1. Slot 1: Character portraits (512x768, face ADetailer)
2. Slot 2: Landscapes (768x512, high CFG)
3. Slot 3: Experimental (various settings)

Switch between them with one click!

### Generation Controls

- **🚀 Generate** - Start generation
- **∞ Infinite Mode** - Continuous generation with random seeds
- **⏹️ Interrupt** - Stop current generation
- **⏭️ Skip** - Skip current image (batch generation)

### ADetailer Setup

1. Enable ADetailer checkboxes (1st, 2nd, 3rd, 4th)
2. Select detection model
3. Click **✏️ 편집** to set ADetailer-specific prompts
4. Adjust confidence, dilate/erode, denoising strength
5. Optional: Use separate steps

### PNG Info Loading

1. Drag and drop a PNG image onto the preview area
2. Review loaded parameters in the modal
3. Click **적용** to apply or **취소** to cancel

## ⚙️ Configuration

### WebUI Setup

Edit `webui-api.bat` (or `webui-user.bat`) to add required flags:

```batch
set COMMANDLINE_ARGS=--api --nowebui --cors-allow-origins=http://localhost:5173
```

**Recommended flags:**
- `--api` - Enable API (required)
- `--nowebui` - Disable Gradio UI (saves memory)
- `--cors-allow-origins=http://localhost:5173` - Allow Vue UI connection
- `--skip-torch-cuda-test` - Faster startup
- `--xformers` - Better performance (if installed)

### Output Directory

Images are saved to your WebUI output directory:
```
D:\stableDiffusion\txt2img-images\YYYY-MM-DD\
```

Check your WebUI settings at:
```
http://127.0.0.1:7860/sdapi/v1/options
```

Look for `outdir_txt2img_samples` to see your output path.

## 🏗️ Project Structure

```
sd-vue-ui/
├── src/
│   ├── components/          # Reusable components
│   │   ├── BookmarkManager.vue
│   │   ├── LoraSelector.vue
│   │   ├── PresetManager.vue
│   │   ├── PromptSelector.vue
│   │   └── QueueManager.vue
│   ├── composables/         # Vue composables
│   │   ├── useImageGeneration.js  # Image generation logic
│   │   ├── useLocalStorage.js     # Storage management
│   │   ├── useQueue.js            # Queue system
│   │   └── useSlotManagement.js   # Slot system
│   ├── views/               # Main views
│   │   └── Txt2ImgView.vue
│   ├── App.vue              # Root component
│   └── main.js              # Entry point
├── public/                  # Static assets
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Development

### Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

### Serve Production Build

```bash
npm run preview
```

### Code Style

This project uses:
- Vue 3 Composition API
- ES6+ JavaScript
- Scoped CSS

## 🎨 Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Stable Diffusion WebUI API** - Backend AI image generation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Known Limitations

- **txt2img only** - img2img, inpainting, extras not yet implemented
- **No ControlNet** - ControlNet integration planned for future
- **Chrome/Edge recommended** - Best compatibility with modern browsers
- **API dependency** - Requires WebUI backend running

## 🗺️ Roadmap

- [ ] img2img support
- [ ] Inpainting/Outpainting
- [ ] ControlNet integration
- [ ] Extension support
- [ ] Multi-language support
- [ ] Electron desktop app
- [ ] Image-to-image workflow
- [ ] Batch processing improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) - The amazing WebUI backend
- [Stability AI](https://stability.ai/) - Stable Diffusion models
- Vue.js team - Excellent frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/sd-vue-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sd-vue-ui/discussions)

---

**Made with ❤️ for the Stable Diffusion community**

*Replace `yourusername` with your actual GitHub username when publishing*
