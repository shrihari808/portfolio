/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 * Orchestrates GSAP horizontal scroll on desktop (>= 769px),
 * vertical card deck stacking on mobile (< 769px) inspired by fancy.design,
 * and Three.js background lifecycle.
 */
import './styles/main.css';
import { loadActiveBackground } from './background-loader.js';
import { initAllSpecularButtons } from './specular-button.js';
import { initAllBorderGlowCards } from './border-glow.js';

(async function initApp() {
  'use strict';

  // --- Constant Electric Purple Accent ---
  const currentAccent = '#C490FF';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Mount Active Background ---
  const bgContainer = document.getElementById('bg-container');
  let activeBg = null;

  if (bgContainer) {
    try {
      activeBg = await loadActiveBackground(bgContainer, {
        accentColor: currentAccent,
        reducedMotion: prefersReducedMotion
      });
    } catch (err) {
      console.error('[Background] Failed to load active background:', err);
    }
  }

  // --- React Bits: SpecularButton & BorderGlow Initialization ---
  initAllSpecularButtons();
  initAllBorderGlowCards();

  // --- Universal React Bits <ScrollStack /> Architecture (Web & Mobile) ---
  // Uses native CSS position: sticky + pure RAF cover-based depth scaling.
  // Completely eliminates GSAP pin-spacer toggling, horizontal track fighting,
  // and scrub lag across all devices.
  function initScrollStack(trackId, progressBarId, options = {}) {
    const track = document.getElementById(trackId);
    const progressBar = document.getElementById(progressBarId);
    if (!track) return null;

    const cards = Array.from(track.children);
    if (cards.length <= 1) return null;

    const itemScale = options.itemScale ?? 0.04;
    const baseScale = options.baseScale ?? 0.88;
    const dimAmount = options.dimAmount ?? 0.16;
    const itemStackDistance = options.itemStackDistance ?? 10;

    // Assign ascending z-index so subsequent cards slide on top of previous cards
    cards.forEach((card, i) => {
      card.style.zIndex = `${i + 1}`;
    });

    let frame = 0;

    const update = () => {
      frame = 0;
      const computedTop = parseFloat(window.getComputedStyle(cards[0]).top) || 100;
      const heights = cards.map(c => c.offsetHeight);
      const tops = cards.map(c => c.getBoundingClientRect().top);

      const depths = cards.map(() => 0);
      let totalCover = 0;

      for (let j = 1; j < cards.length; j++) {
        const pinBefore = computedTop + (j - 1) * itemStackDistance;
        const start = pinBefore + heights[j - 1];
        const span = Math.max(1, start - pinBefore - itemStackDistance);
        const cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
        for (let i = 0; i < j; i++) {
          depths[i] += cover;
        }
        totalCover += cover;
      }

      cards.forEach((card, i) => {
        const depth = depths[i];
        const scale = Math.max(baseScale, 1 - depth * itemScale);
        const yOffset = depth * itemStackDistance;
        const transform = depth < 0.0005 ? '' : `scale(${scale.toFixed(4)}) translateY(${yOffset.toFixed(1)}px)`;
        card.style.transform = transform;

        // Depth dimming (React Bits shade concept)
        const dim = Math.min(0.35, 1 - Math.pow(1 - dimAmount, depth));
        card.style.filter = dim > 0.005 ? `brightness(${((1 - dim) * 100).toFixed(1)}%)` : '';
      });

      if (progressBar && cards.length > 1) {
        const maxCover = cards.length - 1;
        const pct = Math.min(100, Math.max(0, Math.round((totalCover / maxCover) * 100)));
        progressBar.style.width = `${pct}%`;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      cards.forEach(card => {
        card.style.transform = '';
        card.style.filter = '';
        card.style.zIndex = '';
      });
      if (progressBar) progressBar.style.width = '0%';
    };
  }

  // --- Initialize Universal ScrollStacks for Experience & Works ---
  if (!prefersReducedMotion) {
    initScrollStack('expHorizontalTrack', 'expProgressBar', {
      itemScale: 0.04,
      baseScale: 0.88,
      dimAmount: 0.16,
      itemStackDistance: 10
    });

    initScrollStack('worksHorizontalTrack', 'worksProgressBar', {
      itemScale: 0.038,
      baseScale: 0.88,
      dimAmount: 0.16,
      itemStackDistance: 10
    });
  }

  // --- Seamless Anchor Navigation ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const targetId = href.replace('#', '');
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    });
  });
})();
