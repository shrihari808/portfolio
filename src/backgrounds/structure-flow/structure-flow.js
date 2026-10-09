/**
 * src/backgrounds/structure-flow/structure-flow.js
 * 3D undulating wave plane topology mesh in Three.js with pointer response and camera drift.
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
  scene.fog = new THREE.FogExp2(0x070914, 0.0018);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 180, 420);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Plane Mesh
  const SEGMENTS_X = 75;
  const SEGMENTS_Y = 55;
  const geometry = new THREE.PlaneGeometry(1200, 900, SEGMENTS_X, SEGMENTS_Y);
  geometry.rotateX(-Math.PI / 2.3);

  const posAttr = geometry.attributes.position;
  const origY = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    origY[i] = posAttr.getY(i);
  }

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    wireframe: true,
    transparent: true,
    opacity: 0.32
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Vertices points
  const pointsMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    size: 2.2,
    transparent: true,
    opacity: 0.65
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  scene.add(points);

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function onMouseMove(e) {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.15;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.15;
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
  let clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();

    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    camera.position.x = mouseX * 0.4;
    camera.position.y = 180 - mouseY * 0.3;
    camera.lookAt(0, 0, 0);

    // Deform terrain with undulating waves
    for (let i = 0; i < posAttr.count; i++) {
      const u = (i % (SEGMENTS_X + 1)) / SEGMENTS_X;
      const v = Math.floor(i / (SEGMENTS_X + 1)) / SEGMENTS_Y;
      const wave = Math.sin(u * 12.0 + elapsed * 1.4) * 25.0 + Math.cos(v * 10.0 + elapsed * 1.1) * 20.0;
      posAttr.setY(i, origY[i] + wave);
    }
    posAttr.needsUpdate = true;

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
      const threeColor = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
      material.color = threeColor;
      pointsMaterial.color = threeColor;
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      geometry.dispose();
      material.dispose();
      pointsMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
