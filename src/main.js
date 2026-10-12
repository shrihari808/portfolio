/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 */
import { loadActiveBackground } from './background-loader.js';

(async function initApp() {
  'use strict';

  // --- Palette & Theme State ---
  const palettes = ['#F2D27A', '#C490FF'];
  const themeNames = ['', 'purple'];
  let palIdx = 0;
  let currentAccent = palettes[palIdx];

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

      // Update navbar engine indicator badge
      const engineBadgeText = document.getElementById('engineBadgeText');
      if (engineBadgeText && activeBg) {
        engineBadgeText.textContent = activeBg.label;
      }
    } catch (err) {
      console.error('[Background] Failed to load active background:', err);
    }
  }

  // --- Palette Toggle Handler ---
  const paletteToggleBtn = document.getElementById('paletteToggleBtn');
  paletteToggleBtn?.addEventListener('click', () => {
    palIdx = (palIdx + 1) % palettes.length;
    currentAccent = palettes[palIdx];
    document.body.setAttribute('data-theme', themeNames[palIdx]);

    if (activeBg && activeBg.instance && typeof activeBg.instance.updatePalette === 'function') {
      activeBg.instance.updatePalette(currentAccent);
    }
  });

  // --- GSAP Orchestration & Horizontal Pinned Scroll ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Only enable pinning on desktop/laptop screens; mobile uses fluid touch scroll
    ScrollTrigger.matchMedia({
      "(min-width: 769px)": function() {
        // 1. Pinned horizontal scroll for Experience section
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

        // 2. Pinned horizontal scroll for Projects & Research section
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
      }
    });

    // Seamless Anchor Navigation: Fixes anchor scroll jumping past pinned sections
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
