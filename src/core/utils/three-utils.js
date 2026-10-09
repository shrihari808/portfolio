/**
 * src/core/utils/three-utils.js
 *
 * Three.js Lifecycle & GPU Resource Management Utilities.
 * Provides hierarchical scene graph traversal, recursive geometry/material/texture disposal,
 * renderer teardown, safe context loss handling, and canvas backing-store release.
 *
 * Targets Structure Flow Three.js suite:
 * - Emerald Horizon
 * - Structure Flow
 * - Orbital Sphere
 * - Dot Matrix
 * - Flux Vortex
 */

/**
 * Traverses a Three.js Material and disposes all referenced textures,
 * including map, envMap, normalMap, roughnessMap, alphaMap, and textures
 * embedded inside ShaderMaterial uniforms or uniform arrays.
 * Finally disposes the material itself.
 *
 * @param {Object} material - The Three.js material to dispose
 * @param {Set<Object>} [seenTextures] - Set to deduplicate texture disposal
 */
export function disposeThreeMaterial(material, seenTextures = new Set()) {
  if (!material) return;

  try {
    // 1. Inspect standard material properties for Texture instances
    for (const key of Object.keys(material)) {
      const val = material[key];
      if (!val) continue;

      if (typeof val === 'object' && val.isTexture && !seenTextures.has(val)) {
        seenTextures.add(val);
        if (typeof val.dispose === 'function') {
          val.dispose();
        }
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && item.isTexture && !seenTextures.has(item)) {
            seenTextures.add(item);
            if (typeof item.dispose === 'function') {
              item.dispose();
            }
          }
        }
      }
    }

    // 2. Inspect ShaderMaterial uniforms for textures and render targets
    if (material.uniforms && typeof material.uniforms === 'object') {
      for (const uKey of Object.keys(material.uniforms)) {
        const uniform = material.uniforms[uKey];
        const uVal = uniform?.value;
        if (!uVal) continue;

        if (typeof uVal === 'object') {
          if (uVal.isTexture && !seenTextures.has(uVal)) {
            seenTextures.add(uVal);
            if (typeof uVal.dispose === 'function') {
              uVal.dispose();
            }
          } else if (uVal.isRenderTarget && typeof uVal.dispose === 'function') {
            uVal.dispose();
          } else if (Array.isArray(uVal)) {
            for (const item of uVal) {
              if (item && typeof item === 'object' && item.isTexture && !seenTextures.has(item)) {
                seenTextures.add(item);
                if (typeof item.dispose === 'function') {
                  item.dispose();
                }
              }
            }
          }
        }
      }
    }

    // 3. Dispose the material itself
    if (typeof material.dispose === 'function') {
      material.dispose();
    }
  } catch (err) {
    console.warn('[ThreeUtils] Warning during disposeThreeMaterial:', err);
  }
}

/**
 * Traverses a Three.js Scene hierarchy recursively and disposes all geometries,
 * materials, and textures attached to Meshes, Points, Lines, or Sprites.
 * Also disposes scene.background and scene.environment if they are textures,
 * and finally removes all child nodes from the scene.
 *
 * @param {Object} scene - The Three.js Scene to dispose
 * @returns {{ geometriesCount: number, materialsCount: number, texturesCount: number }} Disposed counts
 */
export function disposeThreeScene(scene) {
  if (!scene) {
    return { geometriesCount: 0, materialsCount: 0, texturesCount: 0 };
  }

  const seenGeometries = new Set();
  const seenMaterials = new Set();
  const seenTextures = new Set();

  try {
    if (typeof scene.traverse === 'function') {
      scene.traverse((obj) => {
        if (!obj) return;

        // 1. Dispose Geometry (Mesh, Points, Line, LineSegments)
        if (obj.geometry && typeof obj.geometry.dispose === 'function') {
          if (!seenGeometries.has(obj.geometry)) {
            seenGeometries.add(obj.geometry);
            obj.geometry.dispose();
          }
        }

        // 2. Dispose Material(s)
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of materials) {
            if (mat && !seenMaterials.has(mat)) {
              seenMaterials.add(mat);
              disposeThreeMaterial(mat, seenTextures);
            }
          }
        }

        // 3. Dispose Skeleton (if SkinnedMesh)
        if (obj.skeleton && typeof obj.skeleton.dispose === 'function') {
          obj.skeleton.dispose();
        }
      });
    }

    // 4. Dispose Scene-level background & environment textures
    if (scene.background && scene.background.isTexture && !seenTextures.has(scene.background)) {
      seenTextures.add(scene.background);
      if (typeof scene.background.dispose === 'function') {
        scene.background.dispose();
      }
    }

    if (scene.environment && scene.environment.isTexture && !seenTextures.has(scene.environment)) {
      seenTextures.add(scene.environment);
      if (typeof scene.environment.dispose === 'function') {
        scene.environment.dispose();
      }
    }

    // 5. Clear all child nodes from the scene
    if (typeof scene.clear === 'function') {
      scene.clear();
    } else if (Array.isArray(scene.children)) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }
  } catch (err) {
    console.warn('[ThreeUtils] Warning during disposeThreeScene:', err);
  }

  return {
    geometriesCount: seenGeometries.size,
    materialsCount: seenMaterials.size,
    texturesCount: seenTextures.size
  };
}

/**
 * Safely tears down a WebGLRenderer:
 * - Attaches safe `webglcontextlost` handler with `event.preventDefault()` to suppress browser warnings
 * - Stops active internal animation loop
 * - Disposes renderer internal caches (render states, programs, pipelines)
 * - Forces hardware context loss via `renderer.forceContextLoss()`
 * - Sets canvas resolution to 0x0 to release default framebuffer backing store
 * - Detaches canvas element from its DOM parent
 *
 * @param {Object} renderer - The Three.js WebGLRenderer to dispose
 * @param {Object} [options]
 * @param {boolean} [options.forceContextLoss=true] - Whether to invoke renderer.forceContextLoss()
 * @param {boolean} [options.zeroCanvas=true] - Whether to resize canvas to 0x0
 * @param {boolean} [options.detachDom=true] - Whether to remove canvas from DOM
 */
export function disposeThreeRenderer(renderer, options = {}) {
  if (!renderer) return;

  const {
    forceContextLoss = true,
    zeroCanvas = true,
    detachDom = true
  } = options;

  const canvas = renderer.domElement;

  // 1. Safe context loss handling to suppress browser console warnings
  if (canvas && typeof canvas.addEventListener === 'function') {
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        if (typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      },
      { once: true }
    );
  }

  // 2. Stop Three.js internal animation loop
  if (typeof renderer.setAnimationLoop === 'function') {
    try {
      renderer.setAnimationLoop(null);
    } catch (_) {}
  }

  // 3. Dispose renderer GPU caches and programs
  if (typeof renderer.dispose === 'function') {
    try {
      renderer.dispose();
    } catch (err) {
      console.warn('[ThreeUtils] Warning in renderer.dispose():', err);
    }
  }

  // 4. Force driver-level WebGL context release
  if (forceContextLoss && typeof renderer.forceContextLoss === 'function') {
    try {
      renderer.forceContextLoss();
    } catch (err) {
      console.warn('[ThreeUtils] Warning in renderer.forceContextLoss():', err);
    }
  }

  // 5. Zero-size canvas to immediately reclaim framebuffer memory
  if (zeroCanvas) {
    if (typeof renderer.setSize === 'function') {
      try {
        renderer.setSize(0, 0, false);
      } catch (_) {}
    }
    if (canvas) {
      try {
        canvas.width = 0;
        canvas.height = 0;
      } catch (_) {}
    }
  }

  // 6. Detach canvas from DOM
  if (detachDom && canvas && canvas.parentNode) {
    try {
      canvas.parentNode.removeChild(canvas);
    } catch (_) {}
  }
}

/**
 * Master teardown orchestrator for Three.js background engines.
 * Safely disposes scene, renderer, extra textures/render targets, and detaches canvas.
 *
 * @param {Object} params
 * @param {Object} [params.scene]
 * @param {Object} [params.renderer]
 * @param {Array<Object>} [params.extraResources] - Additional textures, materials, or render targets
 * @param {boolean} [params.forceContextLoss=true]
 * @param {boolean} [params.zeroCanvas=true]
 * @param {boolean} [params.detachDom=true]
 * @returns {{ sceneStats: { geometriesCount: number, materialsCount: number, texturesCount: number } }}
 */
export function teardownThreeExperience(params = {}) {
  const {
    scene = null,
    renderer = null,
    extraResources = [],
    forceContextLoss = true,
    zeroCanvas = true,
    detachDom = true
  } = params;

  // 1. Dispose any manually allocated extra resources
  if (Array.isArray(extraResources)) {
    for (const res of extraResources) {
      if (res && typeof res.dispose === 'function') {
        try {
          res.dispose();
        } catch (_) {}
      }
    }
  }

  // 2. Recursively dispose Scene graph
  let sceneStats = { geometriesCount: 0, materialsCount: 0, texturesCount: 0 };
  if (scene) {
    sceneStats = disposeThreeScene(scene);
  }

  // 3. Teardown Renderer & WebGL context
  if (renderer) {
    disposeThreeRenderer(renderer, {
      forceContextLoss,
      zeroCanvas,
      detachDom
    });
  }

  return { sceneStats };
}

/**
 * Attaches a defensive `webglcontextlost` handler to a canvas to suppress
 * uncaught browser warnings during unmount or testing.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Function} Unsubscribe function
 */
export function setupContextLossHandler(canvas) {
  if (!canvas || typeof canvas.addEventListener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
  };

  canvas.addEventListener('webglcontextlost', handler);
  return () => {
    if (typeof canvas.removeEventListener === 'function') {
      canvas.removeEventListener('webglcontextlost', handler);
    }
  };
}

export default {
  disposeThreeMaterial,
  disposeThreeScene,
  disposeThreeRenderer,
  teardownThreeExperience,
  setupContextLossHandler
};
