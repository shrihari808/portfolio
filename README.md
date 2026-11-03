# Shrihari Kulkarni — Systems Architect & Software Development Engineer

> High-throughput backend engineering, low-latency APIs, enterprise AI pipelines, and interactive WebGL experiences.

[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/Shaders-WebGL2-990000?style=flat-square&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-shrihari808-181717?style=flat-square&logo=github)](https://github.com/shrihari808)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-kshrihari0611-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/kshrihari0611)

---

## Overview

This repository contains the source code for the personal engineering portfolio of **Shrihari Kulkarni**, Software Development Engineer (SDE) at Invendis and Systems Architect based in Bangalore, India.

Built with performance, tactile interaction, and clean typography at its core, the site showcases real-world distributed architectures, low-latency microservices, retrieval-augmented generation (RAG) engines, and published sequence telemetry research.

### Visual & Interaction Engineering Highlights

- **Three.js Orbital Sphere Background**: Custom 800-point spherical point-cloud lattice with shader-masked round points, dual concentric orbital rings, floating ambient particles, throttled resize handling to eliminate mobile WebGL framebuffer thrashing, and fine-pointer parallax tracking. A soft dark glow behind text blocks keeps copy legible over it.
- **React Bits SpecularButton**: WebGL2 fragment and vertex shaders computing directional specular edge illumination, physics-based pointer tracking, and variable glow lobes. Every button renders through **one shared WebGL2 context** and copies its light into its own 2D canvas, so the page uses 2 WebGL contexts in total instead of one per button.
- **BorderGlow Proximity Cards**: Multi-layered directional HSL mesh gradients reacting dynamically to cursor distance and viewport coordinates.
- **Universal `<ScrollStack />`**: Native CSS `position: sticky` paired with pure `requestAnimationFrame` cover-based depth scaling and opacity-overlay dimming, creating card stacking with top-peek silhouettes across desktop and mobile. Cards share a uniform height and a common release point, so the finished stack holds briefly and then leaves as one.
- **Specular CSS Rim**: Stack cards carry a 1px conic-gradient border highlight (key + back lobe) that rests at the top-left and follows BorderGlow's cursor angle on hover. No extra JS or WebGL.
- **Electric Purple Design System**: Calibrated dark aesthetic (`#070914`, `#0E1222`, `#C490FF`), JetBrains Mono for labels and metadata with a system sans-serif for body text, zero framework bloat, and full `prefers-reduced-motion` compliance.
- **Mobile Navigation & Sharing**: Menu-button dropdown below 960px, a résumé download, and Open Graph / Twitter preview tags with a generated 1200×630 preview image.

---

## Engineering Telemetry Highlights

| Metric | Target Achieved | Architectural Context |
| :--- | :--- | :--- |
| **77%** | Query Latency Reduction | Slashed response times from **6.5s → 1.5s** across 300+ MySQL tables in enterprise .NET reporting microservices |
| **80%** | LLM Overhead Slashed | Enterprise LLM gateway with RBAC, semantic Redis caching, and intelligent token rate limiting |
| **< 512MB** | RAG RAM Footprint | Lightweight multi-source live web RAG pipeline with automated query synthesis & time-decay reranking |
| **100+** | Dynamic Report Schemas | Dynamic schema-mapped report composition engine with multi-tenant data isolation |

---

## Tech Stack & Architecture

### Frontend & Graphics Runtime
- **Vite 6** — Lightning-fast ES module dev server & optimized rollup production bundler.
- **Three.js (r170)** — Scene graph, perspective projection, point-cloud particles, and procedural geometry rendering.
- **WebGL2** — Custom GLSL vertex and fragment shaders for physics-driven specular edge lighting.
- **Modular CSS3** — Native CSS variables (design tokens), sticky stacking architecture, and media-query responsive breakouts. No heavy UI framework overhead.
- **Typography** — JetBrains Mono (via Google Fonts) for labels, tags and metadata; the system sans-serif stack for headings and body text.

### Backend & Systems Experience Featured
- **Languages**: C#, Go, Python, C++, TypeScript, SQL
- **Frameworks & Runtimes**: ASP.NET Core, FastAPI, Node.js, gRPC, REST
- **Distributed & Data**: Apache Kafka, Redis, MySQL, PostgreSQL, TimescaleDB
- **AI & ML**: RAG Pipelines, LangChain, Qdrant, Ollama, PyTorch, Scikit-Learn
- **Cloud & DevOps**: Docker, Linux/Unix, Git/CI/CD, Nginx, AWS, Vercel

---

## Repository Structure

```text
portfolioweb/
├── index.html                   # Semantic HTML5 entry point & content architecture
├── package.json                 # Project scripts, metadata, and dependencies
├── vite.config.js               # Vite build configuration (port 3000, no production sourcemaps)
├── vercel.json                  # Automated Vercel CI/CD deployment configuration
├── .gitignore                   # Ignored files (node_modules, dist, etc.)
├── LICENSE                      # MIT License
│
├── public/                      # Static files copied as-is to the site root
│   ├── og-image.png             # 1200×630 social preview image (Open Graph / Twitter)
│   └── cv/                      # Résumé PDF: Shrihari_Kulkarni_CV.pdf (served at /cv/...)
│
├── scripts/
│   └── og/og-image.html         # Source for og-image.png (render with headless Edge/Chrome)
│
├── src/
│   ├── main.js                  # Entry point: background, shaders, ScrollStack, mobile menu & contact cards
│   ├── background.js            # Three.js 3D rotating orbital sphere, concentric rings & particle field
│   ├── specular-button.js       # React Bits SpecularButton (one shared WebGL2 context for all buttons)
│   ├── border-glow.js           # React Bits BorderGlow (HSL directional proximity mesh gradients)
│   │
│   ├── core/
│   │   └── color-utils.js       # Hex, RGB, RGBA color conversion utilities
│   │
│   └── styles/
│       ├── main.css             # Root stylesheet aggregating all modules
│       ├── tokens.css           # Design tokens: palette, typography, radii, elevation
│       ├── layout.css           # Container widths, background canvas stacking & resets
│       ├── nav.css              # Fixed navigation header, pill buttons & mobile menu toggle
│       ├── hero.css             # Hero typography, text glow, status pill & telemetry grid
│       ├── experience.css       # Shared ScrollStack section/card styles, specular rim & experience cards
│       ├── works.css            # Selected projects & research cards
│       ├── arsenal.css          # Technical skills grid & categories
│       ├── credentials.css      # Education & published research cards
│       ├── contact.css          # Direct contact channels & connection links
│       ├── specular-button.css  # Canvas container & sizing rules for specular buttons
│       ├── border-glow.css      # Gradient overlays & proximity border glow styling
│       └── responsive.css       # Tablet (< 960px, mobile menu) and mobile (< 768px) adaptations
│
└── dist/                        # Production build output (generated on npm run build)
```

---

## Getting Started

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

## Deployment

The repository is configured for zero-configuration continuous deployment via **Vercel** (`vercel.json`):

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Every push to `main` automatically deploys a fresh build.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

---

## Author

**Shrihari Kulkarni**
- GitHub: [@shrihari808](https://github.com/shrihari808)
- LinkedIn: [kshrihari0611](https://linkedin.com/in/kshrihari0611)
- Location: Bangalore, India
