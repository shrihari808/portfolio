/**
 * src/backgrounds/constellation/topo-grid.js
 * Raw WebGL 1px coordinate grid with Simplex noise topological contour lines.
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
    console.warn('WebGL not supported for Topo Grid');
    return { updatePalette() {}, destroy() { canvas.remove(); } };
  }

  const vsSource = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }';
  const fsSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_dpr;
    uniform vec3 u_accent;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.2113248654, 0.3660254038, -0.5773502692, 0.0243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox; m *= 1.792842914 - 0.85373472 * ( a0*a0 + h*h );
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;

      float gridSize = 56.0 * u_dpr;
      vec2 gridSt = gl_FragCoord.xy / gridSize;
      vec2 gridFract = fract(gridSt);
      float lineThickness = 1.0 / gridSize;
      float gridLines = step(1.0 - lineThickness, gridFract.x) + step(1.0 - lineThickness, gridFract.y);
      gridLines = clamp(gridLines, 0.0, 1.0) * 0.14;

      float n = snoise(st * 1.5 + vec2(u_time * 0.015, u_time * 0.02)) * 0.5 + 0.5;
      float triangleWave = abs(fract(n * 9.0) - 0.5) * 2.0;
      float topoLines = smoothstep(0.03, 0.00, triangleWave) * 0.42;

      vec3 baseColor = vec3(0.03, 0.04, 0.08);
      vec3 lines = u_accent * topoLines + vec3(0.3, 0.4, 0.6) * gridLines;

      gl_FragColor = vec4(baseColor + lines, 1.0);
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
  const uDpr = gl.getUniformLocation(prog, 'u_dpr');
  const uAccent = gl.getUniformLocation(prog, 'u_accent');

  let currentGlColor = hexToGlRgb(options.accentColor || '#E6C879');
  gl.uniform3fv(uAccent, currentGlColor);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uDpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  let animId = null;
  const tStart = performance.now();

  function render(t) {
    gl.uniform1f(uTime, (t - tStart) * 0.001);
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
