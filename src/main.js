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

  // --- Helper: Mobile Vertical Card Deck Stacking Timeline (Fancy.design style) ---
  function createMobileStackTimeline(sectionId, trackId, progressBarId) {
    const section = document.getElementById(sectionId);
    const track = document.getElementById(trackId);
    const progressBar = document.getElementById(progressBarId);

    if (!section || !track) return null;
    const cards = Array.from(track.children);
    if (cards.length <= 1) return null;

    const totalSteps = cards.length - 1;
    const scrollDistance = () => totalSteps * window.innerHeight * 0.85;

    // Initial state: Card 0 sits in place, remaining cards are poised below viewport
    gsap.set(cards[0], { yPercent: 0, scale: 1, opacity: 1, zIndex: 1 });
    for (let i = 1; i < cards.length; i++) {
      gsap.set(cards[i], { yPercent: 112, scale: 1, opacity: 1, zIndex: i + 1 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${scrollDistance()}`,
        pin: true,
        scrub: 0.35,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressBar) {
            const pct = Math.min(100, Math.max(0, Math.round(self.progress * 100)));
            progressBar.style.width = `${pct}%`;
          }
        }
      }
    });

    // Animate each card sliding up over the previous cards in sequential steps
    for (let i = 1; i < cards.length; i++) {
      const stepStartTime = i - 1;

      // Card i slides smoothly up from the bottom over the stack
      tl.to(cards[i], {
        yPercent: 0,
        duration: 1,
        ease: 'none'
      }, stepStartTime);

      // Previous cards slightly scale down and tuck underneath (tactile deck effect)
      for (let j = 0; j < i; j++) {
        const depth = i - j;
        const targetScale = Math.max(0.78, 1 - depth * 0.05);
        const targetY = depth * 8;
        const targetOpacity = Math.max(0.5, 1 - depth * 0.18);

        tl.to(cards[j], {
          scale: targetScale,
          y: targetY,
          opacity: targetOpacity,
          duration: 1,
          ease: 'none'
        }, stepStartTime);
      }
    }

    return () => {
      tl.kill();
      cards.forEach(card => {
        gsap.set(card, { clearProps: 'all' });
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
      // 2. Mobile Breakpoint (< 769px): Fancy.design Vertical Card Deck Stacking
      // =========================================================================
      "(max-width: 768px)": function() {
        const cleanupExp = createMobileStackTimeline('experience', 'expHorizontalTrack', 'expProgressBar');
        const cleanupWorks = createMobileStackTimeline('works', 'worksHorizontalTrack', 'worksProgressBar');

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
