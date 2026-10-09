---
name: add-kage-landing-page
description: "Create or prototype a personal portfolio landing page using the Kage temple experience (via @designcodeio/threeui or standalone HTML/Three.js). Use when the user wants to build, scaffold, or customize a Kage-themed portfolio webpage."
---

# Build Kage Portfolio Landing Page

This skill guides the implementation and customization of the **Kage** landing page experience for a personal portfolio website.

---

## Method 1: React Component via `@designcodeio/threeui` (Recommended for React/Next.js)

If your project is a React / Next.js / Vite app, you can install and use the component directly.

### 1. Install Package
```bash
npm install @designcodeio/threeui three
```

### 2. Implementation Component
```tsx
import { KageLandingPage } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function PortfolioHero() {
  return (
    <div className="shader-frame w-screen h-screen overflow-hidden">
      <KageLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        primaryColor="#e0231c"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
      />
    </div>
  );
}
```

### 3. Customization Options (Props Contract)
- `headingFont`: `'onest'` | `'instrument-serif'` | `'newsreader'` | `'geist'`
- `bodyFont`: `'onest'` | `'geist'` | `'newsreader'` | `'instrument-serif'`
- `headingWeight`: `'400'` | `'500'` | `'600'` | `'700'`
- `bodyWeight`: `'300'` | `'400'` | `'500'` | `'600'`
- `primaryColor`: Hex color (e.g., `#e0231c` for vermilion accent / ember tint)
- `headingSize`: number (30–72)
- `bodySize`: number (14–20)
- `headingLetterSpacing`: number

---

## Method 2: Standalone Local HTML + Three.js Runtime (Zero External Dependency)

If implementing without `@designcodeio/threeui`, embed the authored standalone bundle:

### 1. Asset Structure
Place files in `public/`:
- `public/landing-pages/kage.html`
- `public/landing-pages/secret-pathways-assets/fonts.css`
- `public/landing-pages/secret-pathways-assets/three.min.js`
- 14 WebP scene layers under `public/landing-pages/secret-pathways-assets/`

### 2. React Host Iframe
```tsx
export function KageLandingPage() {
  return (
    <iframe
      src="/landing-pages/kage.html"
      title="Kage Portfolio"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
```

---

## Portfolio Iteration Checklist

Once the base Kage scene is rendering:
1. **Personal Branding**: Replace placeholder copy, bio, and social links with your portfolio content.
2. **Color Palette**: Tweak `primaryColor` to match your personal brand theme.
3. **Sections to Add**:
   - About Me / Bio
   - Selected Projects & Case Studies
   - Tech Stack & Skills
   - Contact / Social links
4. **Responsive Verification**: Verify smooth performance across mobile devices, high-DPI displays, and reduced-motion settings.
