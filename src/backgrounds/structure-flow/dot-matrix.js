/**
 * src/backgrounds/structure-flow/dot-matrix.js
 * Undulating 3D wave dot matrix plane with interfering ripples and pointer response.
 */
import * as THREE from 'three';
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

  let currentAccent = options.accentColor || '#C490FF';
  const rgb = hexToRgb(currentAccent);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070914, 0.0016);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 220, 380);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const AMOUNT_X = 65;
  const AMOUNT_Y = 55;
  const SEPARATION = 22;
  const numParticles = AMOUNT_X * AMOUNT_Y;

  const positions = new Float32Array(numParticles * 3);
  const scales = new Float32Array(numParticles);

  let i = 0;
  for (let ix = 0; ix < AMOUNT_X; ix++) {
    for (let iy = 0; iy < AMOUNT_Y; iy++) {
      positions[i] = ix * SEPARATION - (AMOUNT_X * SEPARATION) / 2;
      positions[i + 1] = 0;
      positions[i + 2] = iy * SEPARATION - (AMOUNT_Y * SEPARATION) / 2;
      scales[i / 3] = 1;
      i += 3;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    size: 2.4,
    transparent: true,
    opacity: 0.75
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let mouseX = 0;
  let targetMouseX = 0;

  function onMouseMove(e) {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.15;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);

  let count = 0;
  let animId = null;

  function animate() {
    mouseX += (targetMouseX - mouseX) * 0.05;
    camera.position.x = mouseX * 0.5;
    camera.lookAt(0, 0, 0);

    const pos = geometry.attributes.position.array;
    let idx = 0;

    for (let ix = 0; ix < AMOUNT_X; ix++) {
      for (let iy = 0; iy < AMOUNT_Y; iy++) {
        // Multi-frequency wave calculation
        pos[idx + 1] = (Math.sin((ix + count) * 0.3) * 22) +
                       (Math.sin((iy + count) * 0.5) * 22);
        idx += 3;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    count += 0.06;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  if (!options.reducedMotion) {
    animId = requestAnimationFrame(animate);
  } else {
    renderer.render(scene, camera);
  }

  return {
    updatePalette(newColor) {
      currentAccent = newColor;
      const c = hexToRgb(newColor);
      material.color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
