/**
 * src/background-loader.js
 * Loads the active background configured in src/background.config.js
 */
import { ACTIVE_BACKGROUND } from './background.config.js';

const ENGINES = {
  'particle-drift': () => import('./backgrounds/constellation/particle-drift.js'),
  'particle-network': () => import('./backgrounds/constellation/particle-network.js'),
  'orbital-sphere': () => import('./backgrounds/structure-flow/orbital-sphere.js'),
  'dot-matrix': () => import('./backgrounds/structure-flow/dot-matrix.js'),
};

const LABELS = {
  'particle-drift': '✨ Particle Drift',
  'particle-network': '🕸️ Particle Network',
  'orbital-sphere': '🪐 Orbital Sphere',
  'dot-matrix': '░▒ Dot Matrix',
};

export async function loadActiveBackground(container, options = {}) {
  const key = ACTIVE_BACKGROUND || 'particle-drift';
  const loader = ENGINES[key] || ENGINES['particle-drift'];
  const module = await loader();
  const instance = module.initBackground(container, options);

  return {
    key,
    label: LABELS[key] || key,
    instance
  };
}
