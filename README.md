# ⚡ SD Quick UI

> **Personal Project** | A lightweight Vue 3 alternative UI for Stable Diffusion WebUI

A simple, Korean-friendly frontend focused on rapid prompt iteration through the unique **Prompt Slots System**.

**⚠️ This is a personal project built for my own workflow.** It's not meant to replace powerful tools like ComfyUI or Invoke AI. If you need advanced features like img2img, ControlNet, or complex workflows, use those instead.

## 🎯 Who is this for?

This project is specifically designed for:

✅ **You might like this if:**
- You primarily use **txt2img** and don't need img2img/inpainting
- You want **Korean language support** with proper translations
- You frequently switch between **multiple prompt sets** (portraits, landscapes, etc.)
- You find ComfyUI/Invoke too complex and prefer a **simple, focused UI**
- You're a **beginner** who wants an easy-to-use interface
- You already use SD WebUI and just want a **cleaner frontend**

❌ **This is NOT for you if:**
- You need **img2img, inpainting, or ControlNet** (use official WebUI/ComfyUI)
- You want **advanced node-based workflows** (use ComfyUI)
- You need a **standalone application** (this requires WebUI backend)
- You want **cutting-edge features** (this is a personal side project)

**Target user**: Korean-speaking SD beginners who mainly do txt2img generation and value simplicity over features.

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

**Bug fixes and small improvements are welcome!** However, please understand:
- This is a personal project with limited maintenance time
- I may not respond quickly to issues/PRs
- Large feature requests will likely be declined (keep it simple!)
- For major features, consider forking instead

If you want to contribute:
1. Fork the project
2. Create your feature branch (`git checkout -b fix/SomeBugFix`)
3. Keep changes small and focused
4. Submit a PR with clear description

**Better yet**: If you have big ideas, fork this project and make it your own! That's what open source is for.

## ⚠️ Limitations & Trade-offs

**This is intentionally a minimal, focused project.** Here's what's missing:

### Not Implemented (and probably won't be)
- ❌ **img2img / inpainting** - Use official WebUI for these
- ❌ **ControlNet** - Too complex for this project's scope
- ❌ **Batch processing UI** - Basic queue only
- ❌ **Extension system** - Not planned
- ❌ **Standalone app** - Requires WebUI backend running

### Technical Limitations
- 🔧 **Requires WebUI API patch** - Adds LoRA endpoints (3 files modified)
- 🌐 **Chrome/Edge recommended** - Best compatibility
- 💾 **LocalStorage only** - No cloud sync
- 🖥️ **Windows-optimized** - Install scripts are Windows .bat files

### Why these limitations exist
This is a **personal side project** built for my specific use case (txt2img workflow with quick prompt switching). I'm not trying to build a ComfyUI competitor - that would take a full-time team. This is just a cleaner UI for basic txt2img work.

## 🗺️ Roadmap (Maybe?)

**Honest disclaimer**: This is a side project. I built it for myself and I'm sharing it in case it's useful to others. Don't expect regular updates or new features.

**Possible improvements** (if I have time and motivation):
- [ ] Bug fixes and stability improvements
- [ ] Better error handling
- [ ] Performance optimizations
- [ ] Additional language support (if requested)
- [ ] Documentation improvements

**Unlikely to happen**:
- ❌ img2img / inpainting (too much work, use official WebUI)
- ❌ ControlNet (complex integration)
- ❌ Mobile app (not my use case)
- ❌ Cloud features (privacy concerns)

If you want these features, I encourage you to fork the project or use more mature alternatives like ComfyUI.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

**Please read the documentation first** (INSTALLATION-KR.md for Korean, README.md for English).

- **Issues**: [GitHub Issues](https://github.com/yourusername/sd-vue-ui/issues) - For bugs only
- **Questions**: Check existing issues first, or open a new one

**Response time**: This is a side project, so responses may be slow or nonexistent. Sorry in advance!

---

## 🙏 Acknowledgments

This project wouldn't exist without:
- **[AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)** - The amazing backend that does all the real work
- **[Stability AI](https://stability.ai/)** - For making Stable Diffusion open source
- **Vue.js team** - For the excellent framework

---

**A personal side project shared in case it's useful to others** 🤷

*Note: Replace `yourusername` with your actual GitHub username before publishing*
