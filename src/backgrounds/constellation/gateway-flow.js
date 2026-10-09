/**
 * src/backgrounds/constellation/gateway-flow.js
 * Cyber gateway directional stream lines and velocity particles accelerating along perspective lanes.
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
  let currentAccent = options.accentColor || '#E6C879';
  let rgb = hexToRgb(currentAccent);
  let animId = null;
  let beams = [];

  const LANES = width < 768 ? 16 : 32;
  const pointer = { x: -1000, y: -1000 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initBeams() {
    beams = [];
    for (let i = 0; i < LANES; i++) {
      beams.push({
        x: (width / LANES) * i + Math.random() * 20,
        y: Math.random() * height,
        speed: Math.random() * 2.5 + 1.2,
        length: Math.random() * 120 + 40,
        width: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.45 + 0.15
      });
    }
  }

  function animate() {
    ctx.fillStyle = 'rgba(7, 9, 20, 0.28)';
    ctx.fillRect(0, 0, width, height);

    // Subtle perspective grid lines
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < LANES; i++) {
      const lx = (width / LANES) * i;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }

    // Moving velocity beams
    beams.forEach(b => {
      b.y += b.speed;
      if (b.y - b.length > height) {
        b.y = -b.length;
        b.x = (width / LANES) * Math.floor(Math.random() * LANES) + Math.random() * 10;
        b.speed = Math.random() * 2.5 + 1.2;
      }

      // Pointer deflection
      const dx = b.x - pointer.x;
      const dy = b.y - pointer.y;
      const d = Math.hypot(dx, dy);
      let px = b.x;
      if (d < 120) {
        px += (dx / (d || 1)) * (1 - d / 120) * 20;
      }

      // Draw gradient stream
      const grad = ctx.createLinearGradient(px, b.y - b.length, px, b.y);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${b.alpha})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(px, b.y - b.length);
      ctx.lineTo(px, b.y);
      ctx.stroke();

      // Leading spark
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${b.alpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(px, b.y, b.width * 1.2, 0, Math.PI * 2);
      ctx.fill();
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
    initBeams();
  }

  resize();
  initBeams();

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
