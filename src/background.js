/**
 * src/background.js
 * 3D rotating spherical point-cloud lattice and concentric orbital rings in Three.js.
 * Enhanced for mobile viewport stability, aspect ratio framing, and hardware acceleration.
 */
import * as THREE from 'three';
import { hexToRgb } from './core/color-utils.js';

export function initBackground(container, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1';
  canvas.style.pointerEvents = 'none';
  canvas.style.transform = 'translate3d(0, 0, 0)';
  canvas.style.webkitTransform = 'translate3d(0, 0, 0)';
  canvas.style.backfaceVisibility = 'hidden';
  canvas.style.webkitBackfaceVisibility = 'hidden';
  canvas.style.willChange = 'transform';
  container.appendChild(canvas);

  let currentAccent = options.accentColor || '#C490FF';
  const rgb = hexToRgb(currentAccent);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1500);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  // Responsive camera distance and group scale to prevent near-plane clipping
  // and ensure rings and sphere fit comfortably inside narrow mobile portrait screens.
  function updateResponsiveFraming() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    if (aspect < 0.65) {
      // Mobile portrait (e.g. 375x667, 390x844)
      camera.position.z = 580;
      group.scale.set(0.72, 0.72, 0.72);
    } else if (aspect < 1.0) {
      // Tablet portrait / square viewports
      camera.position.z = 480;
      group.scale.set(0.85, 0.85, 0.85);
    } else {
      // Desktop & wide landscape
      camera.position.z = 360;
      group.scale.set(1.0, 1.0, 1.0);
    }
  }

  updateResponsiveFraming();

  // 1. Spherical point cloud
  const SPHERE_POINTS = 800;
  const sphereGeo = new THREE.BufferGeometry();
  const spherePos = new Float32Array(SPHERE_POINTS * 3);
  const RADIUS = 140;

  for (let i = 0; i < SPHERE_POINTS; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / SPHERE_POINTS);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    spherePos[i * 3] = RADIUS * Math.sin(phi) * Math.cos(theta);
    spherePos[i * 3 + 1] = RADIUS * Math.sin(phi) * Math.sin(theta);
    spherePos[i * 3 + 2] = RADIUS * Math.cos(phi);
  }
  sphereGeo.setAttribute('position', new THREE.BufferAttribute(spherePos, 3));

  const pointsMat = new THREE.PointsMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    size: 2.8,
    transparent: true,
    opacity: 0.72
  });
  const spherePoints = new THREE.Points(sphereGeo, pointsMat);
  group.add(spherePoints);

  // 2. Orbital rings
  const ringGeo = new THREE.RingGeometry(180, 181.5, 90);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 3;
  group.add(ring1);

  const ring2 = new THREE.Mesh(ringGeo, ringMat);
  ring2.rotation.x = -Math.PI / 4;
  ring2.rotation.y = Math.PI / 5;
  group.add(ring2);

  // 3. Floating ambient space particles
  const BG_POINTS = 350;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(BG_POINTS * 3);
  for (let i = 0; i < BG_POINTS; i++) {
    bgPos[i * 3] = (Math.random() - 0.5) * 800;
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 600;
    bgPos[i * 3 + 2] = (Math.random() - 0.5) * 500;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  const bgMat = new THREE.PointsMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    size: 1.5,
    transparent: true,
    opacity: 0.28
  });
  const bgParticles = new THREE.Points(bgGeo, bgMat);
  scene.add(bgParticles);

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function onMouseMove(e) {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.001;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.001;
  }

  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  function onResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // Mobile URL bar retracting/expanding fires resize events with only ~50-100px height delta.
    // Calling renderer.setSize on every scroll pixel reallocates WebGL framebuffers and causes severe visual glitches.
    const widthChanged = Math.abs(newWidth - lastWidth) > 2;
    const heightSignificant = Math.abs(newHeight - lastHeight) > 140;

    camera.aspect = newWidth / newHeight;
    updateResponsiveFraming();
    camera.updateProjectionMatrix();

    if (widthChanged || heightSignificant) {
      lastWidth = newWidth;
      lastHeight = newHeight;
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
  }

  window.addEventListener('resize', onResize);

  // Only listen to mouse movements on devices that support hover pointer to prevent
  // touch scrolls from firing synthetic jumpy mouse coordinates:
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover) {
    window.addEventListener('mousemove', onMouseMove);
  }

  let animId = null;

  function animate() {
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    group.rotation.y += 0.003;
    group.rotation.x += 0.0015;

    ring1.rotation.z += 0.002;
    ring2.rotation.z -= 0.0025;

    if (canHover) {
      camera.position.x = mouseX * 60;
      camera.position.y = -mouseY * 60;
    }
    camera.lookAt(0, 0, 0);

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
      pointsMat.color = threeColor;
      ringMat.color = threeColor;
      bgMat.color = threeColor;
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (canHover) {
        window.removeEventListener('mousemove', onMouseMove);
      }
      sphereGeo.dispose();
      pointsMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
