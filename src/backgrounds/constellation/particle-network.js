/**
 * src/backgrounds/constellation/particle-network.js
 * Dense geometric particle network with distance clustering and triangulation meshes.
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
  let nodes = [];

  const COUNT = width < 768 ? 55 : 120;
  const CONNECT_DIST = 140;
  const TRIANGLE_DIST = 90;
  const pointer = { x: -1000, y: -1000 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update positions
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      // Pointer interactive pull
      const pd = dist(n, pointer);
      if (pd < 180) {
        n.x -= (n.x - pointer.x) * 0.008;
        n.y -= (n.y - pointer.y) * 0.008;
      }
    }

    // Render mesh triangles for dense clusters
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d1 = dist(nodes[i], nodes[j]);
        if (d1 < CONNECT_DIST) {
          // Draw connecting line
          const alpha = (1 - d1 / CONNECT_DIST) * 0.4;
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // Check for 3-node triangular fill
          for (let k = j + 1; k < nodes.length; k++) {
            const d2 = dist(nodes[j], nodes[k]);
            const d3 = dist(nodes[i], nodes[k]);
            if (d2 < TRIANGLE_DIST && d3 < TRIANGLE_DIST) {
              const triAlpha = (1 - Math.max(d1, d2, d3) / CONNECT_DIST) * 0.08;
              ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${triAlpha})`;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.lineTo(nodes[k].x, nodes[k].y);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }
    }

    // Render nodes with subtle rhythmic glow
    const time = Date.now() * 0.002;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const glow = 0.7 + Math.sin(time + n.phase) * 0.3;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glow})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }

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
    initNodes();
  }

  resize();
  initNodes();

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
