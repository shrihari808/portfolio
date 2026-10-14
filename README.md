# Shrihari Kulkarni — Systems Architect & Software Development Engineer

> High-throughput backend engineering, low-latency APIs, enterprise AI pipelines, and interactive WebGL experiences.

[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/Shaders-WebGL2-990000?style=flat-square&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-shrihari808-181717?style=flat-square&logo=github)](https://github.com/shrihari808)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-shrihari808-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/shrihari808)

---

## ⚡ Overview

This repository contains the source code for the personal engineering portfolio of **Shrihari Kulkarni**, Software Development Engineer (SDE) at Invendis and Systems Architect based in Bangalore, India.

Built with performance, tactile interaction, and clean typography at its core, the site showcases real-world distributed architectures, low-latency microservices, retrieval-augmented generation (RAG) engines, and published sequence telemetry research.

### ✨ Visual & Interaction Engineering Highlights

- **🪐 Three.js Orbital Sphere Background**: Custom 800-point spherical point-cloud lattice, dual concentric orbital rings, floating ambient particles, throttled resize handling to eliminate mobile WebGL framebuffer thrashing, and fine-pointer parallax tracking.
- **✨ React Bits SpecularButton**: WebGL2 fragment and vertex shaders computing directional specular edge illumination, physics-based pointer tracking, and variable glow lobes.
- **🔮 BorderGlow Proximity Cards**: Multi-layered directional HSL mesh gradients reacting dynamically to cursor distance and viewport coordinates.
- **📚 Universal `<ScrollStack />`**: Native CSS `position: sticky` paired with pure `requestAnimationFrame` cover-based depth scaling and exponential dimming, creating card stacking with top-peek silhouettes across desktop and mobile.
- **🟣 Electric Purple Design System**: Calibrated dark aesthetic (`#070914`, `#0E1222`, `#C490FF`), strict JetBrains Mono typography, zero framework bloat, and full `prefers-reduced-motion` compliance.

---

## 📊 Engineering Telemetry Highlights

| Metric | Target Achieved | Architectural Context |
| :--- | :--- | :--- |
| **77%** | Query Latency Reduction | Slashed response times from **6.5s → 1.5s** across 300+ MySQL tables in enterprise .NET reporting microservices |
| **80%** | LLM Overhead Slashed | Enterprise LLM gateway with RBAC, semantic Redis caching, and intelligent token rate limiting |
| **< 512MB** | RAG RAM Footprint | Lightweight multi-source live web RAG pipeline with automated query synthesis & time-decay reranking |
| **100+** | Dynamic Report Schemas | Dynamic schema-mapped report composition engine with multi-tenant data isolation |

---

## 🛠️ Tech Stack & Architecture

### Frontend & Graphics Runtime
- **Vite 6** — Lightning-fast ES module dev server & optimized rollup production bundler.
- **Three.js (r170)** — Scene graph, perspective projection, point-cloud particles, and procedural geometry rendering.
- **WebGL2** — Custom GLSL vertex and fragment shaders for physics-driven specular edge lighting.
- **Modular CSS3** — Native CSS variables (design tokens), sticky stacking architecture, and media-query responsive breakouts. No heavy UI framework overhead.
- **JetBrains Mono** — Editorial monospace typography loaded via Google Fonts.

### Backend & Systems Experience Featured
- **Languages**: C#, Go, Python, C++, TypeScript, SQL
- **Frameworks & Runtimes**: ASP.NET Core, FastAPI, Node.js, gRPC, REST
- **Distributed & Data**: Apache Kafka, Redis, MySQL, PostgreSQL, TimescaleDB
- **AI & ML**: RAG Pipelines, LangChain, Qdrant, Ollama, PyTorch, Scikit-Learn
- **Cloud & DevOps**: Docker, Linux/Unix, Git/CI/CD, Nginx, AWS, Vercel

---

## 📁 Repository Structure

```text
portfolioweb/
├── index.html                   # Semantic HTML5 entry point & content architecture
├── package.json                 # Project scripts, metadata, and dependencies
├── vite.config.js               # Vite build configuration (port 3000, sourcemaps)
├── vercel.json                  # Automated Vercel CI/CD deployment configuration
├── .gitignore                   # Ignored files (node_modules, dist, etc.)
│
├── src/
│   ├── main.js                  # Application entry point: initializes background, shaders & scroll stack
│   ├── background.js            # Three.js 3D rotating orbital sphere, concentric rings & particle field
│   ├── specular-button.js       # React Bits SpecularButton (WebGL2 hardware-accelerated edge shader)
│   ├── border-glow.js           # React Bits BorderGlow (HSL directional proximity mesh gradients)
│   │
│   ├── core/
│   │   └── color-utils.js       # Hex, RGB, RGBA color conversion utilities
│   │
│   └── styles/
│       ├── main.css             # Root stylesheet aggregating all modules
│       ├── tokens.css           # Design tokens: palette, typography, radii, elevation
│       ├── layout.css           # Container widths, background canvas stacking & resets
│       ├── nav.css              # Sticky navigation header & pill buttons
│       ├── hero.css             # Hero typographic hierarchy, status pill & telemetry grid
│       ├── experience.css       # Experience timeline cards & ScrollStack container
│       ├── works.css            # Selected projects & research cards
│       ├── arsenal.css          # Technical skills grid & categories
│       ├── credentials.css      # Education & published research cards
│       ├── contact.css          # Direct contact channels & connection links
│       ├── specular-button.css  # Canvas container & sizing rules for specular buttons
│       ├── border-glow.css      # Gradient overlays & proximity border glow styling
│       └── responsive.css       # Mobile (< 768px) and tablet adaptations
│
└── dist/                        # Production build output (generated on npm run build)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (comes with Node.js)

### Installation

Clone the repository and install the minimal dependencies:

```bash
git clone https://github.com/shrihari808/portfolio.git
cd portfolio
npm install
```

### Development Server

Start Vite's local development server with hot module replacement (HMR):

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

Compile and bundle the production assets into `dist/`:

```bash
npm run build
```

### Preview Production Build

Serve the local `dist/` directory to preview production performance:

```bash
npm run preview
```

---

## 🌐 Deployment

The repository is configured for zero-configuration continuous deployment via **Vercel** (`vercel.json`):

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Every push to `main` automatically deploys a fresh build.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Shrihari Kulkarni**
- GitHub: [@shrihari808](https://github.com/shrihari808)
- LinkedIn: [shrihari808](https://linkedin.com/in/shrihari808)
- Location: Bangalore, India
