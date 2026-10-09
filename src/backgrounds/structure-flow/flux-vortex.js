/**
 * src/backgrounds/structure-flow/flux-vortex.js
 * Dynamic gravitational particle vortex in Three.js with accretion spiral and pointer pull.
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

  let currentAccent = options.accentColor || '#E6C879';
  const rgb = hexToRgb(currentAccent);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 240, 320);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const PARTICLE_COUNT = 1500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const angles = new Float32Array(PARTICLE_COUNT);
  const radii = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const vSpeeds = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.random() * 260 + 20;
    const theta = Math.random() * Math.PI * 2;
    radii[i] = r;
    angles[i] = theta;
    speeds[i] = (1 / Math.sqrt(r)) * 1.8 + Math.random() * 0.005;
    vSpeeds[i] = (Math.random() - 0.5) * 0.6;

    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20 - (260 - r) * 0.15; // funnel downward
    positions[i * 3 + 2] = r * Math.sin(theta);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    size: 2.2,
    transparent: true,
    opacity: 0.75
  });

  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function onMouseMove(e) {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.08;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.08;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);

  let animId = null;

  function animate() {
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    camera.position.x = mouseX * 2;
    camera.position.y = 240 - mouseY;
    camera.lookAt(0, 0, 0);

    const pos = geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] += speeds[i];
      radii[i] -= 0.18; // Inward gravitational drift

      if (radii[i] < 12) {
        radii[i] = 270;
        angles[i] = Math.random() * Math.PI * 2;
      }

      const r = radii[i];
      const theta = angles[i];

      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = Math.sin(theta * 3 + r * 0.05) * 8 - (270 - r) * 0.18;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }
    geometry.attributes.position.needsUpdate = true;

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
