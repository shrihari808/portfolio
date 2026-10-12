/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 * Orchestrates GSAP pinning for desktop, fluid touch swipe for mobile,
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

  // --- Mobile Touch Carousel Progress Synchronization ---
  function setupMobileTrackProgress(viewportSelector, progressBarId) {
    const viewport = document.querySelector(viewportSelector);
    const progressBar = document.getElementById(progressBarId);
    if (!viewport || !progressBar) return;

    const onScroll = () => {
      // Only active on mobile/tablet viewports (< 769px)
      if (window.innerWidth > 768) return;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (maxScroll <= 0) {
        progressBar.style.width = '0%';
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((viewport.scrollLeft / maxScroll) * 100)));
      progressBar.style.width = `${pct}%`;
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    // Initial sync
    onScroll();
  }

  setupMobileTrackProgress('.exp-horizontal-viewport', 'expProgressBar');
  setupMobileTrackProgress('.works-horizontal-viewport', 'worksProgressBar');

  // --- GSAP Orchestration & Horizontal Pinned Scroll ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Only enable pinning on desktop/laptop screens (>= 769px)
    // Mobile (< 769px) uses native fluid touch snap scrolling
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

        // Cleanup when switching away from desktop breakpoint
        return () => {
          gsap.set(['#expHorizontalTrack', '#worksHorizontalTrack'], { clearProps: 'transform' });
        };
      },

      "(max-width: 768px)": function() {
        // Ensure no lingering GSAP inline transforms affect native touch scroll on mobile
        gsap.set(['#expHorizontalTrack', '#worksHorizontalTrack'], { clearProps: 'transform' });
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
        if (st && window.innerWidth >= 769) {
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
