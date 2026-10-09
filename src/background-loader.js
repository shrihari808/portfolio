/**
 * src/background-loader.js
 * Loads the active background configured in src/background.config.js
 */
import { ACTIVE_BACKGROUND } from './background.config.js';

const ENGINES = {
  // Constellation Family
  'constellation': () => import('./backgrounds/constellation/constellation.js'),
  'particle-drift': () => import('./backgrounds/constellation/particle-drift.js'),
  'particle-network': () => import('./backgrounds/constellation/particle-network.js'),
  'gateway-flow': () => import('./backgrounds/constellation/gateway-flow.js'),
  'topo-grid': () => import('./backgrounds/constellation/topo-grid.js'),

  // Structure Flow Family (Three.js)
  'structure-flow': () => import('./backgrounds/structure-flow/structure-flow.js'),
  'emerald-horizon': () => import('./backgrounds/structure-flow/emerald-horizon.js'),
  'orbital-sphere': () => import('./backgrounds/structure-flow/orbital-sphere.js'),
  'dot-matrix': () => import('./backgrounds/structure-flow/dot-matrix.js'),
  'flux-vortex': () => import('./backgrounds/structure-flow/flux-vortex.js'),

  // Matrix Laser Family (Raw WebGL)
  'matrix-junction': () => import('./backgrounds/matrix-laser/matrix-junction.js'),
  'atmospheric-blade': () => import('./backgrounds/matrix-laser/atmospheric-blade.js'),
  'vanishing-array': () => import('./backgrounds/matrix-laser/vanishing-array.js'),
};

const LABELS = {
  'constellation': '⚡ Constellation',
  'particle-drift': '✨ Particle Drift',
  'particle-network': '🕸️ Particle Network',
  'gateway-flow': '🚀 Gateway Flow',
  'topo-grid': '🌐 Topo Grid',
  'structure-flow': '🌊 Structure Flow',
  'emerald-horizon': '🌅 Emerald Horizon',
  'orbital-sphere': '🪐 Orbital Sphere',
  'dot-matrix': '░▒ Dot Matrix',
  'flux-vortex': '🌀 Flux Vortex',
  'matrix-junction': '⚡ Matrix Junction',
  'atmospheric-blade': '🗡️ Atmospheric Blade',
  'vanishing-array': '📐 Vanishing Array',
};

export async function loadActiveBackground(container, options = {}) {
  const key = ACTIVE_BACKGROUND || 'constellation';
  const loader = ENGINES[key] || ENGINES['constellation'];
  const module = await loader();
  const instance = module.initBackground(container, options);

  return {
    key,
    label: LABELS[key] || key,
    instance
  };
}
