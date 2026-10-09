/**
 * src/backgrounds/structure-flow/emerald-horizon.js
 * Vast receding perspective horizon grid with undulating wireframe terrain streaming forward.
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
  scene.fog = new THREE.Fog(0x070914, 200, 1100);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 1600);
  camera.position.set(0, 45, 240);
  camera.lookAt(0, 30, -400);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Receding Grid Floor
  const GRID_W = 1400;
  const GRID_D = 1600;
  const SEGS_X = 60;
  const SEGS_Z = 70;
  const geometry = new THREE.PlaneGeometry(GRID_W, GRID_D, SEGS_X, SEGS_Z);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -20, -500);

  const posAttr = geometry.attributes.position;
  const origY = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    origY[i] = posAttr.getY(i);
  }

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    wireframe: true,
    transparent: true,
    opacity: 0.38
  });

  const terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);

  // Distant glowing horizon line
  const horizonGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-800, 30, -900),
    new THREE.Vector3(800, 30, -900)
  ]);
  const horizonMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255),
    transparent: true,
    opacity: 0.85
  });
  const horizonLine = new THREE.Line(horizonGeo, horizonMat);
  scene.add(horizonLine);

  let mouseX = 0;
  let targetMouseX = 0;

  function onMouseMove(e) {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.12;
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

    mouseX += (targetMouseX - mouseX) * 0.05;
    camera.position.x = mouseX;
    camera.lookAt(mouseX * 0.2, 30, -600);

    // Forward stream terrain undulation
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const wave = Math.sin((z * 0.015) + (elapsed * 2.2)) * 14.0 +
                   Math.cos(x * 0.012) * 10.0;
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
      horizonMat.color = threeColor;
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      geometry.dispose();
      material.dispose();
      horizonGeo.dispose();
      horizonMat.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}
