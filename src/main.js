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
  // Exactly follows the React Bits ScrollStack architecture with top peeking silhouettes.
  function initScrollStack(trackId, progressBarId, options = {}) {
    const track = document.getElementById(trackId);
    const progressBar = document.getElementById(progressBarId);
    if (!track) return null;

    const cards = Array.from(track.children).filter(el => el.classList.contains('border-glow-card'));
    if (cards.length <= 1) return null;

    function getLayout() {
      const isMobile = window.innerWidth <= 768;
      return {
        isMobile,
        baseTop: isMobile ? 66 : 80,
        stackOffset: isMobile ? 16 : 22,
        itemScale: isMobile ? 0.035 : 0.045,
        baseScale: isMobile ? 0.88 : 0.85,
        dimAmount: options.dimAmount ?? 0.16
      };
    }

    function applyLayout() {
      const { baseTop, stackOffset } = getLayout();
      cards.forEach((card, i) => {
        const topVal = baseTop + i * stackOffset;
        card.style.top = `${topVal}px`;
        card.style.setProperty('--stack-top', `${topVal}px`);
        card.style.zIndex = `${i + 1}`;
        card.style.transformOrigin = '50% 0%';
      });
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const { baseTop, stackOffset, itemScale, baseScale, dimAmount } = getLayout();
      const heights = cards.map(c => c.offsetHeight);
      const tops = cards.map(c => c.getBoundingClientRect().top);

      const depths = cards.map(() => 0);
      let totalCover = 0;

      for (let j = 1; j < cards.length; j++) {
        const pinBefore = baseTop + (j - 1) * stackOffset;
        const pinCurrent = baseTop + j * stackOffset;
        const start = pinBefore + heights[j - 1];
        const span = Math.max(1, start - pinCurrent);
        const cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
        for (let i = 0; i < j; i++) {
          depths[i] += cover;
        }
        totalCover += cover;
      }

      cards.forEach((card, i) => {
        const depth = depths[i];
        if (depth < 0.0005) {
          card.style.transform = '';
          card.style.filter = '';
          return;
        }

        const scale = Math.max(baseScale, 1 - depth * itemScale);
        card.style.transform = `scale(${scale.toFixed(4)})`;

        // Exponential dimming (React Bits shade model)
        const dim = 1 - Math.pow(1 - Math.min(Math.max(dimAmount, 0), 1), depth);
        const brightness = Math.max(65, (1 - dim * 0.75) * 100);
        card.style.filter = `brightness(${brightness.toFixed(1)}%)`;
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

    applyLayout();
    window.addEventListener('scroll', schedule, { passive: true });
    const onResize = () => {
      applyLayout();
      schedule();
    };
    window.addEventListener('resize', onResize, { passive: true });
    schedule();

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
      cards.forEach(card => {
        card.style.transform = '';
        card.style.filter = '';
        card.style.zIndex = '';
        card.style.top = '';
      });
      if (progressBar) progressBar.style.width = '0%';
    };
  }

  // --- Initialize Universal ScrollStacks for Experience & Works ---
  if (!prefersReducedMotion) {
    initScrollStack('expHorizontalTrack', 'expProgressBar', {
      dimAmount: 0.16
    });

    initScrollStack('worksHorizontalTrack', 'worksProgressBar', {
      dimAmount: 0.16
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
