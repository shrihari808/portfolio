/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 * Orchestrates GSAP horizontal scroll on desktop (>= 769px),
 * vertical card deck stacking on mobile (< 769px) inspired by fancy.design,
 * and Three.js background lifecycle.
 */
import { loadActiveBackground } from './background-loader.js';

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

  // --- React Bits <ScrollStack /> Architecture Adapted for Mobile Web ---
  // Uses native CSS position: sticky + RAF cover-based depth scaling.
  // Completely eliminates GSAP pin-spacer toggling and scrub lag on touch devices.
  function initScrollStack(trackId, progressBarId, options = {}) {
    const track = document.getElementById(trackId);
    const progressBar = document.getElementById(progressBarId);
    if (!track) return null;

    const cards = Array.from(track.children);
    if (cards.length <= 1) return null;

    const itemScale = options.itemScale ?? 0.05;
    const baseScale = options.baseScale ?? 0.85;
    const dimAmount = options.dimAmount ?? 0.18;
    const itemStackDistance = options.itemStackDistance ?? 8;

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

  // --- GSAP Orchestration: Desktop Horizontal Scroll & Mobile Card Stacking ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.matchMedia({
      // =========================================================================
      // 1. Desktop Breakpoint (>= 769px): Pinned Horizontal Smooth Scrubbing
      // =========================================================================
      "(min-width: 769px)": function() {
        // Experience section horizontal scroll
        const expSection = document.getElementById('experience');
        const expTrack = document.getElementById('expHorizontalTrack');
        const expProgressBar = document.getElementById('expProgressBar');

        if (expSection && expTrack) {
          const getDistance = () => Math.max(0, expTrack.scrollWidth - expSection.clientWidth);

          const expTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: expSection,
              start: 'top top',
              end: () => `+=${getDistance()}`,
              pin: true,
              scrub: 0.35,
              invalidateOnRefresh: true,
              snap: {
                snapTo: 1 / Math.max(1, expTrack.children.length - 1),
                duration: { min: 0.15, max: 0.35 },
                delay: 0.05,
                ease: 'power1.out'
              },
              onUpdate: (self) => {
                if (expProgressBar) {
                  const pct = Math.min(100, Math.max(0, Math.round(self.progress * 100)));
                  expProgressBar.style.width = `${pct}%`;
                }
              }
            }
          });

          expTimeline.to(expTrack, {
            x: () => -getDistance(),
            ease: 'none'
          });
        }

        // Works section horizontal scroll
        const worksSection = document.getElementById('works');
        const worksTrack = document.getElementById('worksHorizontalTrack');
        const worksProgressBar = document.getElementById('worksProgressBar');

        if (worksSection && worksTrack) {
          const getWorksDistance = () => Math.max(0, worksTrack.scrollWidth - worksSection.clientWidth);

          const worksTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: worksSection,
              start: 'top top',
              end: () => `+=${getWorksDistance()}`,
              pin: true,
              scrub: 0.35,
              invalidateOnRefresh: true,
              snap: {
                snapTo: 1 / Math.max(1, worksTrack.children.length - 1),
                duration: { min: 0.15, max: 0.35 },
                delay: 0.05,
                ease: 'power1.out'
              },
              onUpdate: (self) => {
                if (worksProgressBar) {
                  const pct = Math.min(100, Math.max(0, Math.round(self.progress * 100)));
                  worksProgressBar.style.width = `${pct}%`;
                }
              }
            }
          });

          worksTimeline.to(worksTrack, {
            x: () => -getWorksDistance(),
            ease: 'none'
          });
        }

        // Cleanup when switching away from desktop breakpoint
        return () => {
          gsap.set(['#expHorizontalTrack', '#worksHorizontalTrack'], { clearProps: 'transform' });
        };
      },

      // =========================================================================
      // 2. Mobile Breakpoint (< 769px): React Bits ScrollStack Native Sticky Deck
      // =========================================================================
      "(max-width: 768px)": function() {
        const cleanupExp = initScrollStack('expHorizontalTrack', 'expProgressBar', {
          itemScale: 0.05,
          baseScale: 0.85,
          itemStackDistance: 8
        });
        const cleanupWorks = initScrollStack('worksHorizontalTrack', 'worksProgressBar', {
          itemScale: 0.045,
          baseScale: 0.86,
          itemStackDistance: 8
        });

        return () => {
          if (cleanupExp) cleanupExp();
          if (cleanupWorks) cleanupWorks();
          gsap.set(['#expHorizontalTrack', '#worksHorizontalTrack'], { clearProps: 'all' });
        };
      }
    });

    // Seamless Anchor Navigation: Fixes anchor scroll jumping across pinned sections
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const targetId = href.replace('#', '');
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();

        const triggers = ScrollTrigger.getAll();
        const st = triggers.find((t) => t.trigger === target);
        if (st) {
          window.scrollTo({
            top: st.start,
            behavior: 'smooth'
          });
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top,
            behavior: 'smooth'
          });
        }
      });
    });

    // Refresh ScrollTrigger calculations after all fonts and resources settle
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 350);
  }
})();
