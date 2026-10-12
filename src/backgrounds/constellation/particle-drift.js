/**
 * src/backgrounds/constellation/particle-drift.js
 * Subtle flowing cosmic particulate field with flowing stream vectors and luminous drift.
 */
import { hexToRgb } from '../../core/color-utils.js';

export function initBackground(container, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  let currentAccent = options.accentColor || '#C490FF';
  let rgb = hexToRgb(currentAccent);
  let animId = null;
  let particles = [];

  // Tripled particle density: 1,200 on desktop, 540 on mobile
  const COUNT = width < 768 ? 540 : 1200;
  const pointer = { x: -1000, y: -1000 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      const layer = Math.random();
      let size, alpha, speedMult, trailLength;

      if (layer < 0.5) {
        // Deep cosmic micro-dust (50%)
        size = Math.random() * 0.7 + 0.4;
        alpha = Math.random() * 0.28 + 0.12;
        speedMult = 0.55 + Math.random() * 0.35;
        trailLength = 8;
      } else if (layer < 0.85) {
        // Mid-plane particulate (35%)
        size = Math.random() * 1.1 + 0.8;
        alpha = Math.random() * 0.4 + 0.28;
        speedMult = 0.85 + Math.random() * 0.45;
        trailLength = 14;
      } else {
        // Foreground luminous nodes (15%)
        size = Math.random() * 1.4 + 1.6;
        alpha = Math.random() * 0.35 + 0.65;
        speedMult = 1.15 + Math.random() * 0.55;
        trailLength = 22;
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.18) * 0.65 * speedMult,
        vy: (Math.random() - 0.5) * 0.38 * speedMult,
        size,
        alpha,
        trailLength,
        history: []
      });
    }
  }

  function animate() {
    // Slower alpha clear (0.14) creates expansive, luminous comet tails
    ctx.fillStyle = 'rgba(7, 9, 20, 0.14)';
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      // Store history for elongated comet trail
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > p.trailLength) p.history.shift();

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around bounds (clear history on wrap to avoid streak artifacts)
      if (p.x < 0) { p.x = width; p.history = []; }
      if (p.x > width) { p.x = 0; p.history = []; }
      if (p.y < 0) { p.y = height; p.history = []; }
      if (p.y > height) { p.y = 0; p.history = []; }

      // Pointer deflection
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 160) {
        const force = (1 - d / 160) * 1.8;
        p.x += (dx / (d || 1)) * force;
        p.y += (dy / (d || 1)) * force;
      }

      // Draw elongated luminous trail
      if (p.history.length > 1) {
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha * 0.38})`;
        ctx.lineWidth = p.size * 0.85;
        ctx.beginPath();
        ctx.moveTo(p.history[0].x, p.history[0].y);
        for (let i = 1; i < p.history.length; i++) {
          ctx.lineTo(p.history[i].x, p.history[i].y);
        }
        ctx.stroke();
      }

      // Draw particle core
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow halo for foreground nodes
      if (p.size > 1.8) {
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    animId = requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }

  function onMouseLeave() {
    pointer.x = -1000;
    pointer.y = -1000;
  }

  function onResize() {
    resize();
    initParticles();
  }

  resize();
  initParticles();

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  if (!options.reducedMotion) {
    animId = requestAnimationFrame(animate);
  }

  return {
    updatePalette(newColor) {
      currentAccent = newColor;
      rgb = hexToRgb(currentAccent);
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      canvas.remove();
    }
  };
}
