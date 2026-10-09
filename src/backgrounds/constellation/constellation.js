/**
 * src/backgrounds/constellation/constellation.js
 * Classic interactive constellation node network with link thresholds and pointer gravity.
 */
import { hexToRgbaString } from '../../core/color-utils.js';

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
  let animId = null;
  let nodes = [];

  const LINK = 160;
  const MAX_NODES = width < 768 ? 45 : 90;
  const pointer = { x: -1000, y: -1000 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < MAX_NODES; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1.6
      });
    }
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Links
    ctx.strokeStyle = currentAccent;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = dist(nodes[i], nodes[j]);
        if (d < LINK) {
          ctx.globalAlpha = 0.16 + (1 - d / LINK) * 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      // Pointer gravity
      const pd = dist(node, pointer);
      if (pd < 200) {
        node.x -= (node.x - pointer.x) * 0.006;
        node.y -= (node.y - pointer.y) * 0.006;
      }

      const pulse = 0.78 + Math.sin(Date.now() * 0.0012 + node.x) * 0.22;
      ctx.fillStyle = currentAccent;

      // Halo
      ctx.globalAlpha = pulse * 0.25;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
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
