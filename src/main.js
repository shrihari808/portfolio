/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 */
import { loadActiveBackground } from './background-loader.js';

(async function initApp() {
  'use strict';

  // --- Palette & Theme State ---
  const palettes = ['#E6C879', '#B37FEB'];
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

    const expSection = document.getElementById('experience');
    const expTrack = document.getElementById('expHorizontalTrack');
    const expProgressBar = document.getElementById('expProgressBar');

    if (expSection && expTrack) {
      const getDistance = () => {
        const trackWidth = expTrack.scrollWidth;
        const viewportWidth = expSection.clientWidth;
        // Total distance needed for the last card to scroll fully into view
        return Math.max(0, trackWidth - viewportWidth);
      };

      const expTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: expSection,
          start: 'top top',
          end: () => `+=${getDistance() + 250}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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
        const getWorksDistance = () => {
          const trackWidth = worksTrack.scrollWidth;
          const viewportWidth = worksSection.clientWidth;
          return Math.max(0, trackWidth - viewportWidth);
        };

        const worksTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: worksSection,
            start: 'top top',
            end: () => `+=${getWorksDistance() + 250}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
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

    // Refresh ScrollTrigger calculations after all resources settle
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);
  }
})();
