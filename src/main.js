/**
 * src/main.js
 * Application entry point for Shrihari Engineering Portfolio
 */
import { loadActiveBackground } from './background-loader.js';

(async function initApp() {
  'use strict';

  // --- Palette & Theme State ---
  const palettes = ['#E6C879', '#7FC4FF', '#52c41a'];
  const themeNames = ['', 'cyan', 'green'];
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

  // --- GSAP Masked Staggered Word Reveals ---
  if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const revealElements = document.querySelectorAll('.masked-reveal');
    revealElements.forEach(el => {
      const html = el.innerHTML;
      const fragments = html.split(/(<br\s*\/?>|\s+)/);
      el.innerHTML = '';

      fragments.forEach(frag => {
        if (/<br/i.test(frag)) {
          el.appendChild(document.createElement('br'));
        } else if (frag.trim() !== '') {
          const wrapper = document.createElement('span');
          wrapper.style.cssText = 'overflow: hidden; display: inline-block; vertical-align: bottom;';

          const inner = document.createElement('span');
          inner.className = 'reveal-word';
          inner.innerHTML = frag;

          wrapper.appendChild(inner);
          el.appendChild(wrapper);
        } else {
          el.appendChild(document.createTextNode(frag));
        }
      });

      gsap.to(el.querySelectorAll('.reveal-word'), {
        y: '0%',
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.035,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
        }
      });
    });

    // Stagger reveal for architecture cards
    gsap.from('.arch-card', {
      opacity: 0,
      y: 28,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.arch-grid',
        start: 'top 85%',
      }
    });

    // Stagger reveal for works cards
    gsap.from('.work-card', {
      opacity: 0,
      y: 32,
      duration: 1.0,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.works-grid',
        start: 'top 85%',
      }
    });
  }
})();
