# Shrihari — Engineering & Creative Technology Portfolio

> A Kyoto mountain temple night-walk experience built with Three.js, WebGL procedural shaders, and modern web architectures.

[![GitHub](https://img.shields.io/badge/GitHub-shrihari808-181717?logo=github)](https://github.com/shrihari808)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js-black?logo=three.js)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🏛️ Overview

This portfolio website showcases my work as a **Full-Stack Software Engineer & Systems Architect**. Designed around the contemplative Japanese **Kage** aesthetic (inspired by Kyoto mountain temples, charred cypress, vermilion ember tones, and lantern light), the site renders a multi-chapter live WebGL 3D environment that transitions dynamically as you navigate.

### Key Sections:
- **00. Sanctuary of Code**: Real-time 3D wordmark, responsive WebGL Kyoto landscape, and chapter navigational cards.
- **01. The Foundation (About)**: Core engineering philosophy, trade-offs in high-concurrency systems, and track record metrics.
- **02. Selected Works**: Interactive project showcase:
  - **Nebula Engine**: Distributed Event Stream & Microservices Platform (Go, Kafka, Raft).
  - **Spatial WebGL Studio**: Real-time 3D shader and lighting environment (Three.js, GLSL, WebGL).
  - **OmniSync Telemetry**: Enterprise IoT Real-time Analytics Mesh (TypeScript, TimescaleDB, GraphQL).
- **03. Technical Arsenal**: Deep breakdown of distributed systems, 3D graphics, cloud-native DevOps, and storage engines.
- **04. Let's Build Together (Contact)**: Direct channels to connect on GitHub, review code, or start collaborations.

---

## 🚀 Quick Start

### Option 1: Standalone (No Node Required)
Simply open `index.html` in any modern web browser or serve it with any local static HTTP server:
```bash
npx serve .
```

### Option 2: Vite Development Server
```bash
# Install dependencies
npm install

# Start local dev server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📂 Project Architecture

```text
portfolioweb/
├── index.html                   # Main entry point & WebGL runtime
├── package.json                 # Project configuration & scripts
├── vite.config.js               # Vite build configuration
├── secret-pathways-assets/      # Scene layer textures, WebP graphics & Three.js runtime
│   ├── fonts.css                # Typography & glyphs
│   ├── three.min.js             # Three.js runtime
│   ├── foreground/png/          # 10 botanical, stone, and architectural layers
│   └── generated/               # 4 atmospheric viewpoint plates
├── public/                      # Static assets mirror for frameworks / Vite
│   └── landing-pages/
│       ├── kage.html
│       └── secret-pathways-assets/
└── README.md
```

---

## 🌐 Deployment

### GitHub Pages
1. Push this repository to `https://github.com/shrihari808/portfolio.git` on branch `main`.
2. Go to **Settings > Pages** in your GitHub repository.
3. Select Source: **Deploy from a branch** -> Branch: `main` / `root`.
4. Your site will be live instantly!

---

## 📜 Credits

- Inspired by the Kage temple experience from `@designcodeio/threeui`.
- Powered by [Three.js](https://threejs.org/).
- Built & maintained by [Shrihari](https://github.com/shrihari808).
