/**
 * src/core/utils/webgl-utils.js
 *
 * WebGL Lifecycle & GPU Resource Management Utilities.
 * Provides safe shader compilation, program linking, buffer allocation,
 * comprehensive GPU resource teardown, and intentional context loss handling.
 *
 * Targets raw WebGL background engines:
 * - Matrix Laser suite (Matrix Junction, Atmospheric Blade, Vanishing Array)
 * - Constellation suite (Topo Grid)
 */

/**
 * Compiles a WebGL shader and verifies compilation status.
 * Safely deletes the allocated shader object if compilation fails.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source - GLSL shader source code
 * @returns {WebGLShader} Compiled WebGL shader
 * @throws {Error} If compilation fails
 */
export function compileShader(gl, type, source) {
  if (!gl) {
    throw new Error('[WebGLUtils] compileShader: gl context is null or undefined');
  }
  if (!source || typeof source !== 'string') {
    throw new Error('[WebGLUtils] compileShader: shader source must be a non-empty string');
  }

  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('[WebGLUtils] compileShader: gl.createShader returned null (context may be lost)');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    const infoLog = gl.getShaderInfoLog(shader) || 'Unknown compilation error';
    try { gl.deleteShader(shader); } catch (_) {}
    const typeStr = type === gl.VERTEX_SHADER ? 'VERTEX_SHADER' : 'FRAGMENT_SHADER';
    throw new Error(`[WebGLUtils] Failed to compile ${typeStr}:\n${infoLog}`);
  }

  return shader;
}

/**
 * Creates and links a WebGL program from vertex and fragment shaders (or source strings).
 * If linking fails, attached shaders are detached and any internally compiled shaders are deleted.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {WebGLShader|string} vertexShaderOrSource
 * @param {WebGLShader|string} fragmentShaderOrSource
 * @returns {WebGLProgram} Linked WebGL program with attached shader references on program._attachedShaders
 * @throws {Error} If program creation or linking fails
 */
export function createProgram(gl, vertexShaderOrSource, fragmentShaderOrSource) {
  if (!gl) {
    throw new Error('[WebGLUtils] createProgram: gl context is null or undefined');
  }

  let vs = vertexShaderOrSource;
  let fs = fragmentShaderOrSource;
  let ownsVs = false;
  let ownsFs = false;

  try {
    if (typeof vs === 'string') {
      vs = compileShader(gl, gl.VERTEX_SHADER, vs);
      ownsVs = true;
    }
    if (typeof fs === 'string') {
      fs = compileShader(gl, gl.FRAGMENT_SHADER, fs);
      ownsFs = true;
    }

    const program = gl.createProgram();
    if (!program) {
      throw new Error('[WebGLUtils] createProgram: gl.createProgram returned null');
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const infoLog = gl.getProgramInfoLog(program) || 'Unknown link error';
      try { gl.detachShader(program, vs); } catch (_) {}
      try { gl.detachShader(program, fs); } catch (_) {}
      if (ownsVs && vs) { try { gl.deleteShader(vs); } catch (_) {} }
      if (ownsFs && fs) { try { gl.deleteShader(fs); } catch (_) {} }
      try { gl.deleteProgram(program); } catch (_) {}
      throw new Error(`[WebGLUtils] Failed to link shader program:\n${infoLog}`);
    }

    // Attach references to program for deterministic teardown tracking
    program._attachedShaders = [vs, fs];
    program._ownsShaders = ownsVs || ownsFs;

    return program;
  } catch (err) {
    if (ownsVs && vs) {
      try { gl.deleteShader(vs); } catch (_) {}
    }
    if (ownsFs && fs) {
      try { gl.deleteShader(fs); } catch (_) {}
    }
    throw err;
  }
}

/**
 * Convenience alias to create a program directly from two GLSL source strings.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {string} vertexSource
 * @param {string} fragmentSource
 * @returns {WebGLProgram}
 */
export function createProgramFromSources(gl, vertexSource, fragmentSource) {
  return createProgram(gl, vertexSource, fragmentSource);
}

/**
 * Allocates and populates a WebGLBuffer.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {number} target - gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER
 * @param {ArrayBuffer|ArrayBufferView} data - TypedArray data (e.g. Float32Array)
 * @param {number} [usage=gl.STATIC_DRAW] - Buffer usage hint
 * @returns {WebGLBuffer}
 */
export function createBuffer(gl, target, data, usage) {
  if (!gl) throw new Error('[WebGLUtils] createBuffer: gl is null');
  const bufferUsage = usage !== undefined ? usage : gl.STATIC_DRAW;

  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error('[WebGLUtils] createBuffer: gl.createBuffer returned null');
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, bufferUsage);
  gl.bindBuffer(target, null);

  return buffer;
}

/**
 * Allocates a 2-triangle full-screen quad buffer covering NDC [-1, 1].
 * Layout: Float32Array [-1, -1,  1, -1,  -1, 1,  1, 1] (TRIANGLE_STRIP).
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @returns {{ buffer: WebGLBuffer, count: number, mode: number }}
 */
export function createFullscreenQuadBuffer(gl) {
  const quadVertices = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
     1.0,  1.0
  ]);
  const buffer = createBuffer(gl, gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  return {
    buffer,
    count: 4,
    mode: gl.TRIANGLE_STRIP
  };
}

/**
 * Allocates an empty 2D texture with default clamping and filtering.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {Object} [options]
 * @param {number} [options.filter=gl.LINEAR]
 * @param {number} [options.wrap=gl.CLAMP_TO_EDGE]
 * @returns {WebGLTexture}
 */
export function createTexture2D(gl, options = {}) {
  if (!gl) throw new Error('[WebGLUtils] createTexture2D: gl is null');
  const filter = options.filter || gl.LINEAR;
  const wrap = options.wrap || gl.CLAMP_TO_EDGE;

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('[WebGLUtils] createTexture2D: gl.createTexture returned null');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

/**
 * Detaches and deletes all shaders attached to a program, then deletes the program.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {WebGLShader[]} [explicitShaders] - Optional list of shaders if not attached
 */
export function deleteShadersAndProgram(gl, program, explicitShaders = null) {
  if (!gl || !program) return;

  try {
    let shadersToDetach = [];
    if (Array.isArray(explicitShaders) && explicitShaders.length > 0) {
      shadersToDetach = explicitShaders;
    } else if (Array.isArray(program._attachedShaders)) {
      shadersToDetach = program._attachedShaders;
    } else if (typeof gl.getAttachedShaders === 'function') {
      shadersToDetach = gl.getAttachedShaders(program) || [];
    }

    for (const shader of shadersToDetach) {
      if (shader) {
        try { gl.detachShader(program, shader); } catch (_) {}
        try { gl.deleteShader(shader); } catch (_) {}
      }
    }

    gl.deleteProgram(program);
  } catch (err) {
    console.warn('[WebGLUtils] Warning during deleteShadersAndProgram:', err);
  }
}

/**
 * Safely deletes a collection of WebGLBuffers.
 * Accepts an Array, a Set, or an Object mapping keys to buffers.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {WebGLBuffer[]|Set<WebGLBuffer>|Object<string, WebGLBuffer>} buffers
 */
export function deleteBuffers(gl, buffers) {
  if (!gl || !buffers) return;
  const list = Array.isArray(buffers)
    ? buffers
    : buffers instanceof Set
      ? Array.from(buffers)
      : Object.values(buffers);

  for (const buf of list) {
    if (buf) {
      try { gl.deleteBuffer(buf); } catch (_) {}
    }
  }
}

/**
 * Safely deletes a collection of WebGLTextures.
 * Accepts an Array, a Set, or an Object mapping keys to textures.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {WebGLTexture[]|Set<WebGLTexture>|Object<string, WebGLTexture>} textures
 */
export function deleteTextures(gl, textures) {
  if (!gl || !textures) return;
  const list = Array.isArray(textures)
    ? textures
    : textures instanceof Set
      ? Array.from(textures)
      : Object.values(textures);

  for (const tex of list) {
    if (tex) {
      try { gl.deleteTexture(tex); } catch (_) {}
    }
  }
}

/**
 * Safely deletes a collection of WebGLFramebuffers.
 * Accepts an Array, a Set, or an Object mapping keys to framebuffers.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {WebGLFramebuffer[]|Set<WebGLFramebuffer>|Object<string, WebGLFramebuffer>} framebuffers
 */
export function deleteFramebuffers(gl, framebuffers) {
  if (!gl || !framebuffers) return;
  const list = Array.isArray(framebuffers)
    ? framebuffers
    : framebuffers instanceof Set
      ? Array.from(framebuffers)
      : Object.values(framebuffers);

  for (const fb of list) {
    if (fb) {
      try { gl.deleteFramebuffer(fb); } catch (_) {}
    }
  }
}

/**
 * Resets WebGL pipeline state:
 * - Disables all enabled vertex attribute arrays
 * - Unbinds active buffers (ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER)
 * - Unbinds textures (TEXTURE_2D, TEXTURE_CUBE_MAP)
 * - Unbinds framebuffers and renderbuffers
 * - Clears active shader program (`gl.useProgram(null)`)
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 */
export function resetWebGLState(gl) {
  if (!gl) return;
  if (gl.isContextLost && gl.isContextLost()) return;

  try {
    let maxAttribs = 16;
    try {
      const param = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      if (typeof param === 'number' && param > 0) maxAttribs = param;
    } catch (_) {}

    for (let i = 0; i < maxAttribs; i++) {
      try { gl.disableVertexAttribArray(i); } catch (_) {}
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (gl.TEXTURE_CUBE_MAP) gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (gl.RENDERBUFFER) gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.useProgram(null);
  } catch (err) {
    console.warn('[WebGLUtils] Warning during resetWebGLState:', err);
  }
}

/**
 * Triggers driver-level WebGL context loss via WEBGL_lose_context extension.
 * Attaches a one-time `webglcontextlost` event handler to canvas to call `event.preventDefault()`,
 * suppressing uncaught browser warnings in DevTools console.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {HTMLCanvasElement} [canvas] - Target canvas (defaults to gl.canvas)
 * @returns {boolean} True if extension was found and loseContext was invoked
 */
export function loseWebGLContext(gl, canvas = null) {
  if (!gl) return false;

  const targetCanvas = canvas || gl.canvas;
  if (targetCanvas && typeof targetCanvas.addEventListener === 'function') {
    targetCanvas.addEventListener(
      'webglcontextlost',
      (e) => {
        if (typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      },
      { once: true }
    );
  }

  try {
    const ext =
      gl.getExtension('WEBGL_lose_context') ||
      gl.getExtension('WEBKIT_WEBGL_lose_context') ||
      gl.getExtension('MOZ_WEBGL_lose_context');

    if (ext && typeof ext.loseContext === 'function') {
      ext.loseContext();
      return true;
    }
  } catch (err) {
    console.warn('[WebGLUtils] Error invoking loseContext:', err);
  }

  return false;
}

/**
 * Master teardown orchestrator for raw WebGL engines.
 * Executes the complete teardown sequence:
 * 1. Resets state & unbinds active objects
 * 2. Deletes shaders and shader programs
 * 3. Deletes buffers, textures, framebuffers
 * 4. Triggers driver context loss (if requested)
 * 5. Sizes canvas down to 0x0 to immediately reclaim VRAM backing store
 * 6. Detaches canvas from DOM container (if attached)
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {Object} [options]
 * @param {WebGLProgram|WebGLProgram[]} [options.programs]
 * @param {WebGLBuffer[]|Object<string, WebGLBuffer>} [options.buffers]
 * @param {WebGLTexture[]|Object<string, WebGLTexture>} [options.textures]
 * @param {WebGLFramebuffer[]|Object<string, WebGLFramebuffer>} [options.framebuffers]
 * @param {HTMLCanvasElement} [options.canvas]
 * @param {boolean} [options.loseContext=true]
 * @param {boolean} [options.zeroCanvas=true]
 * @param {boolean} [options.detachDom=true]
 */
export function teardownWebGL(gl, options = {}) {
  if (!gl) return;

  const {
    programs = [],
    buffers = [],
    textures = [],
    framebuffers = [],
    canvas = gl.canvas,
    loseContext = true,
    zeroCanvas = true,
    detachDom = true
  } = options;

  // 1. Reset pipeline state
  resetWebGLState(gl);

  // 2. Delete programs and attached shaders
  const programList = Array.isArray(programs) ? programs : [programs].filter(Boolean);
  for (const prog of programList) {
    deleteShadersAndProgram(gl, prog);
  }

  // 3. Delete buffers, textures, framebuffers
  deleteBuffers(gl, buffers);
  deleteTextures(gl, textures);
  deleteFramebuffers(gl, framebuffers);

  // 4. Force hardware context loss
  if (loseContext) {
    loseWebGLContext(gl, canvas);
  }

  // 5. Zero-size canvas to instantly release framebuffer allocation in browser compositor
  if (zeroCanvas && canvas) {
    try {
      canvas.width = 0;
      canvas.height = 0;
    } catch (_) {}
  }

  // 6. Detach canvas from DOM
  if (detachDom && canvas && canvas.parentNode) {
    try {
      canvas.parentNode.removeChild(canvas);
    } catch (_) {}
  }
}

export default {
  compileShader,
  createProgram,
  createProgramFromSources,
  createBuffer,
  createFullscreenQuadBuffer,
  createTexture2D,
  deleteShadersAndProgram,
  deleteBuffers,
  deleteTextures,
  deleteFramebuffers,
  resetWebGLState,
  loseWebGLContext,
  teardownWebGL
};
