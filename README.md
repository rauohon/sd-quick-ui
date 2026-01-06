# SD Quick UI

[한국어](README-KR.md)

> Vue 3 frontend for Stable Diffusion WebUI (AUTOMATIC1111)

Alternative UI for txt2img, img2img, inpaint/outpaint, ControlNet, and workflow pipelines.

![SD Quick UI - txt2img](screenshots/tabs_txt2img.png)

## Features

### Generation Modes

| Mode | Description |
|------|-------------|
| txt2img | Text-to-image generation |
| img2img | Image-to-image transformation |
| Inpaint/Outpaint | Mask-based editing and canvas expansion |
| Workflow | Multi-step pipelines (txt2img → img2img → inpaint) |

### Main Features

- **Prompt Slots** - 3 configuration slots per tab (prompts + parameters)
- **ControlNet** - OpenPose, Canny, Depth, Lineart, Tile presets
- **ADetailer** - Up to 4 detailers with individual prompts
- **Hires Fix** - Upscaler support
- **Infinite Mode** - Continuous generation with random seeds
- **Queue System** - Batch generation
- **Bookmarks & Presets** - Save/load prompts and parameters

### Other Features

- Progress display with preview
- History panel
- PNG Info (drag & drop)
- LoRA browser
- Dark/Light mode
- Korean/English support
- Keyboard shortcuts

## Screenshots

### Generation Tabs

| txt2img | img2img | inpaint | workflow |
|---------|---------|---------|----------|
| ![txt2img](screenshots/tabs_txt2img.png) | ![img2img](screenshots/tabs_img2img.png) | ![inpaint](screenshots/tabs_inpaint.png) | ![workflow](screenshots/tabs_workflow.png) |

### ControlNet

![ControlNet Panel](screenshots/controlnet.png)

### Inpaint Canvas

![Inpaint with Mask](screenshots/inpaint.png)

### Workflow Pipeline

![Workflow Editor](screenshots/workflow.png)

### Dark Mode

![Dark Mode](screenshots/dark-mode.png)

## Installation

### Requirements

- [Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) (AUTOMATIC1111) v1.7.0+
- [Node.js](https://nodejs.org/) v18+

### Setup

```bash
git clone https://github.com/rauohon/sd-quick-ui.git
cd sd-quick-ui
npm install
npm run dev
```

### WebUI Configuration

Start WebUI with API enabled:

```bash
# Windows (webui-user.bat)
set COMMANDLINE_ARGS=--api --cors-allow-origins=http://localhost:5173

# Linux/Mac
./webui.sh --api --cors-allow-origins=http://localhost:5173
```

Open http://localhost:5173

## Usage

### Prompt Slots

Each slot stores:
- Prompts (positive/negative)
- Parameters (steps, CFG, sampler, size, seed)
- Hires Fix settings
- ADetailer configurations
- Batch settings

Switch slots with click or Ctrl+1/2/3.

### Workflow Pipelines

Chain generation steps:

```
txt2img → img2img → inpaint
```

Each step can override parameters.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Generate |
| `Ctrl+1/2/3` | Switch slot |
| `Ctrl+/` | Focus prompt |
| `ESC` | Close modal |
| `B` | Brush (inpaint) |
| `E` | Eraser (inpaint) |

## Development

```bash
npm run dev        # Development server
npm run dev:mock   # Mock API (no WebUI needed)
npm run build      # Production build
```

## Tech Stack

- Vue 3 (Composition API)
- Vite
- vue-i18n

## Project Structure

```
src/
├── views/           # Main views
├── components/      # UI components
├── composables/     # State & logic
├── config/          # Constants
├── i18n/            # Translations
└── utils/           # Utilities
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

This project is licensed under the [MIT License](LICENSE).

### Third-Party Components

| Component | License | Notes |
|-----------|---------|-------|
| Vue.js, Vite, vue-i18n | MIT | Dependencies |
| Stable Diffusion WebUI | AGPL-3.0 | API server (not included) |
| Patch files (`patches/`) | AGPL-3.0 | Modifies SD WebUI code |

### Important Notes

- This project is a **frontend client** that communicates with SD WebUI via API
- It does **not include or redistribute** any SD WebUI code
- The `patches/` directory contains optional patches for SD WebUI (AGPL-3.0)
  - Only required for LoRA browser functionality
  - When applied to SD WebUI, they fall under AGPL-3.0

### Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Stability AI,
AUTOMATIC1111, or any related entities. "Stable Diffusion" is a trademark of Stability AI.

## Acknowledgments

- [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stability AI](https://stability.ai/)
- [Vue.js](https://vuejs.org/)
