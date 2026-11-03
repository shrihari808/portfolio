/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 * Orchestrates universal React Bits <ScrollStack /> sticky card stacking,
 * Three.js orbital sphere background lifecycle, SpecularButton WebGL shaders,
 * BorderGlow interactive proximity effects, and the mobile navigation menu.
 * Styles are loaded by the <link> in index.html.
 */
import { initBackground } from './background.js';
import { initAllSpecularButtons } from './specular-button.js';
import { initAllBorderGlowCards } from './border-glow.js';

(async function initApp() {
  'use strict';

  // --- Constant Electric Purple Accent ---
  const currentAccent = '#C490FF';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Mount Background ---
  const bgContainer = document.getElementById('bg-container');
  let activeBg = null;

  if (bgContainer) {
    try {
      activeBg = initBackground(bgContainer, {
        accentColor: currentAccent,
        reducedMotion: prefersReducedMotion
      });
    } catch (err) {
      console.error('[Background] Failed to load background:', err);
    }
  }

  // --- React Bits: SpecularButton & BorderGlow Initialization ---
  initAllSpecularButtons();
  initAllBorderGlowCards();

  // --- Specular CSS rim on ScrollStack cards ---
  // A border-only conic highlight that follows BorderGlow's --cursor-angle (see border-glow.css).
  document.querySelectorAll('.exp-card, .work-card').forEach((card) => {
    const rim = document.createElement('span');
    rim.className = 'stack-rim';
    rim.setAttribute('aria-hidden', 'true');
    card.appendChild(rim);
  });

  // --- Universal React Bits <ScrollStack /> Architecture (Web & Mobile) ---
  // Uses native CSS position: sticky + pure RAF cover-based depth scaling.
  // Exactly follows the React Bits ScrollStack architecture with top peeking silhouettes.
  function initScrollStack(trackId, progressBarId, options = {}) {
    const track = document.getElementById(trackId);
    const progressBar = document.getElementById(progressBarId);
    if (!track) return null;

    const cards = Array.from(track.children).filter(el => el.classList.contains('border-glow-card'));
    if (cards.length <= 1) return null;

    // Depth dimming overlay: animating opacity is cheaper than filter: brightness()
    const shades = cards.map((card) => {
      const shade = document.createElement('span');
      shade.className = 'stack-shade';
      shade.setAttribute('aria-hidden', 'true');
      card.appendChild(shade);
      return shade;
    });

    // Spacer after the last card: the completed stack stays pinned across it before releasing
    const stackEnd = document.createElement('div');
    stackEnd.className = 'stack-end';
    stackEnd.setAttribute('aria-hidden', 'true');
    track.appendChild(stackEnd);

    function getLayout() {
      const isMobile = window.innerWidth <= 768;
      return {
        isMobile,
        baseTop: isMobile ? 72 : 96,
        stackOffset: isMobile ? 16 : 22,
        itemScale: isMobile ? 0.035 : 0.045,
        baseScale: isMobile ? 0.88 : 0.85,
        stepGap: isMobile ? 'clamp(90px, 16vh, 140px)' : 'clamp(140px, 22vh, 200px)',
        holdBuffer: isMobile ? 'clamp(180px, 26vh, 260px)' : 'clamp(280px, 36vh, 400px)',
        dimAmount: options.dimAmount ?? 0.16
      };
    }

    let heights = [];

    function applyLayout() {
      const { baseTop, stackOffset, stepGap, holdBuffer } = getLayout();
      const numCards = cards.length;

      // Uniform height: every card matches the tallest card's natural content height
      cards.forEach(card => { card.style.minHeight = ''; });
      const tallest = Math.max(...cards.map(c => c.offsetHeight));

      cards.forEach((card, i) => {
        card.style.top = `${baseTop + i * stackOffset}px`;
        card.style.zIndex = `${i + 1}`;
        card.style.minHeight = `${tallest}px`;
        // A sticky card releases when its margin box reaches the end of the track, so
        // top + height + margin-bottom must match for every card (the last one included)
        // for the whole stack to leave together instead of leaving cards hanging below.
        card.style.marginBottom = `calc(${stepGap} + ${(numCards - 1 - i) * stackOffset}px)`;
      });

      stackEnd.style.height = holdBuffer;
      heights = cards.map(c => c.offsetHeight);
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const { baseTop, stackOffset, itemScale, baseScale, dimAmount } = getLayout();
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
          shades[i].style.opacity = '0';
          return;
        }

        const scale = Math.max(baseScale, 1 - depth * itemScale);
        card.style.transform = `scale(${scale.toFixed(4)})`;

        // Exponential dimming (React Bits shade model)
        const dim = 1 - Math.pow(1 - Math.min(Math.max(dimAmount, 0), 1), depth);
        const brightness = Math.max(65, (1 - dim * 0.75) * 100);
        shades[i].style.opacity = (1 - brightness / 100).toFixed(3);
      });

      if (progressBar) {
        const progress = Math.min(1, Math.max(0, totalCover / (cards.length - 1)));
        progressBar.style.transform = `scaleX(${progress.toFixed(3)})`;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      applyLayout();
      schedule();
    };

    // Card text reflows whenever the track width changes, so re-measure on width changes only
    // (setting min-height changes heights, which must not re-trigger the observer).
    let trackWidth = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.round(entries[entries.length - 1].contentRect.width);
      if (width === trackWidth) return;
      trackWidth = width;
      onResize();
    });

    applyLayout();
    window.addEventListener('scroll', schedule, { passive: true });
    resizeObserver.observe(track);
    // Web fonts change text metrics, so re-measure card heights once they are ready
    document.fonts?.ready.then(onResize);
    schedule();

    return () => {
      window.removeEventListener('scroll', schedule);
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      cards.forEach(card => {
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.top = '';
        card.style.minHeight = '';
        card.style.marginBottom = '';
      });
      shades.forEach(shade => shade.remove());
      stackEnd.remove();
      if (progressBar) progressBar.style.transform = '';
    };
  }

  // --- Initialize Universal ScrollStacks for Experience & Works ---
  if (!prefersReducedMotion) {
    initScrollStack('expStack', 'expProgressBar', {
      dimAmount: 0.16
    });

    initScrollStack('worksStack', 'worksProgressBar', {
      dimAmount: 0.16
    });
  }

  // --- Mobile Navigation Menu (< 960px) ---
  const nav = document.getElementById('topNav');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (nav && navToggle && navMenu) {
    const setMenuOpen = (open, { focus = false } = {}) => {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.querySelector('.nav-toggle-label').textContent = open ? 'Close' : 'Menu';
      if (open && focus) navMenu.querySelector('a')?.focus();
    };

    navToggle.addEventListener('click', () => {
      setMenuOpen(!nav.classList.contains('is-open'), { focus: true });
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenuOpen(false);
        navToggle.focus();
      }
    });

    document.addEventListener('pointerdown', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenuOpen(false);
    });
  }

  // --- Contact Cards: allow selecting and copying text inside the links ---
  // A drag that ends with a text selection should not follow the link (e.g. open mailto:).
  document.querySelectorAll('.contact-channel-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim() && card.contains(selection.anchorNode)) {
        e.preventDefault();
      }
    });
  });

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
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });
})();
