/**
 * src/backgrounds/matrix-laser/matrix-junction.js
 * Cyber laser matrix junction grid with laser pulse intersections and pointer illumination.
 */
import { hexToGlRgb } from '../../core/color-utils.js';

export function initBackground(container, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) {
    console.warn('WebGL not supported for Matrix Junction');
    return { updatePalette() {}, destroy() { canvas.remove(); } };
  }

  const vsSource = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }';
  const fsSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec3 u_accent;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 p = st * aspect;
      vec2 m = u_mouse * aspect;

      // Laser grid lines
      float gridSize = 0.06;
      vec2 grid = fract(p / gridSize);
      float lineX = smoothstep(0.04, 0.0, abs(grid.x - 0.5));
      float lineY = smoothstep(0.04, 0.0, abs(grid.y - 0.5));
      float gridIntensity = max(lineX, lineY) * 0.12;

      // Junction points
      float junction = lineX * lineY * 1.8;

      // Scanning laser beams
      float scanX = smoothstep(0.015, 0.0, abs(fract(st.y * 2.0 - u_time * 0.25) - 0.5)) * 0.35;
      float scanY = smoothstep(0.015, 0.0, abs(fract(st.x * 2.0 + u_time * 0.2) - 0.5)) * 0.35;

      // Mouse interactive laser glow
      float distM = length(p - m);
      float mouseGlow = smoothstep(0.45, 0.0, distM) * 0.45;

      // Base void color
      vec3 bg = vec3(0.025, 0.035, 0.07);
      vec3 laserColor = u_accent * (gridIntensity + junction + scanX + scanY + mouseGlow);

      gl_FragColor = vec4(bg + laserColor, 1.0);
    }
  `;

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  }

  const vShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fShader = createShader(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vShader);
  gl.attachShader(prog, fShader);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uAccent = gl.getUniformLocation(prog, 'u_accent');

  let currentGlColor = hexToGlRgb(options.accentColor || '#E6C879');
  gl.uniform3fv(uAccent, currentGlColor);

  let mouseX = 0.5;
  let mouseY = 0.5;

  function onMouseMove(e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = 1.0 - (e.clientY / window.innerHeight);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouseMove);
  resize();

  let animId = null;
  const tStart = performance.now();

  function render(t) {
    gl.uniform1f(uTime, (t - tStart) * 0.001);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform3fv(uAccent, currentGlColor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animId = requestAnimationFrame(render);
  }

  if (!options.reducedMotion) {
    animId = requestAnimationFrame(render);
  } else {
    render(tStart);
  }

  return {
    updatePalette(newColor) {
      currentGlColor = hexToGlRgb(newColor);
      gl.useProgram(prog);
      gl.uniform3fv(uAccent, currentGlColor);
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      try {
        gl.deleteBuffer(posBuf);
        gl.deleteProgram(prog);
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
      } catch (_) {}
      canvas.remove();
    }
  };
}
