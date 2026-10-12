/**
 * BorderGlow Component from React Bits
 * Directional mesh gradient border & multi-layered glow with edge proximity
 */

function parseHSL(hslStr) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 188, s: 95, l: 65 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x) { return x * x * x; }

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
  const t0 = performance.now() + delay;
  let rafId;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else if (onEnd) {
      onEnd();
    }
  }
  const timer = setTimeout(() => {
    rafId = requestAnimationFrame(tick);
  }, delay);

  return () => {
    clearTimeout(timer);
    if (rafId) cancelAnimationFrame(rafId);
  };
}

function getCenterOfElement(el) {
  const { width, height } = el.getBoundingClientRect();
  return [width / 2, height / 2];
}

function getEdgeProximity(el, x, y) {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function getCursorAngle(el, x, y) {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) return 0;
  const radians = Math.atan2(dy, dx);
  let degrees = radians * (180 / Math.PI) + 90;
  if (degrees < 0) degrees += 360;
  return degrees;
}

/**
 * Initializes BorderGlow on a card element.
 */
export function initBorderGlow(card, userOptions = {}) {
  if (!card || card.__borderGlowInit) return null;
  card.__borderGlowInit = true;

  // Ensure card has .border-glow-card
  card.classList.add('border-glow-card');

  // Ensure edge-light span exists
  let edgeLight = card.querySelector(':scope > .edge-light');
  if (!edgeLight) {
    edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light';
    edgeLight.setAttribute('aria-hidden', 'true');
    card.prepend(edgeLight);
  }

  // Ensure inner container exists
  let inner = card.querySelector(':scope > .border-glow-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'border-glow-inner';
    const children = Array.from(card.childNodes).filter(node => node !== edgeLight);
    children.forEach(node => inner.appendChild(node));
    card.appendChild(inner);
  }

  // Read dataset / options
  const ds = card.dataset;
  const edgeSensitivity = userOptions.edgeSensitivity ?? (ds.edgeSensitivity ? parseFloat(ds.edgeSensitivity) : 25);
  const glowColor = userOptions.glowColor ?? (ds.glowColor || '188 95 65');
  const backgroundColor = userOptions.backgroundColor ?? (ds.bgColor || '#0B0F1C');
  const borderRadius = userOptions.borderRadius ?? (ds.borderRadius ? parseFloat(ds.borderRadius) : 20);
  const glowRadius = userOptions.glowRadius ?? (ds.glowRadius ? parseFloat(ds.glowRadius) : 40);
  const glowIntensity = userOptions.glowIntensity ?? (ds.glowIntensity ? parseFloat(ds.glowIntensity) : 1.2);
  const coneSpread = userOptions.coneSpread ?? (ds.coneSpread ? parseFloat(ds.coneSpread) : 25);
  const fillOpacity = userOptions.fillOpacity ?? (ds.fillOpacity ? parseFloat(ds.fillOpacity) : 0.45);
  const animated = userOptions.animated ?? (ds.animated !== 'false');

  let colors = ['#00f5ff', '#38bdf8', '#c084fc'];
  if (userOptions.colors) {
    colors = userOptions.colors;
  } else if (ds.colors) {
    colors = ds.colors.split(',').map(s => s.trim());
  }

  // Set CSS Custom Properties
  card.style.setProperty('--card-bg', backgroundColor);
  card.style.setProperty('--edge-sensitivity', `${edgeSensitivity}`);
  card.style.setProperty('--border-radius', `${borderRadius}px`);
  card.style.setProperty('--glow-padding', `${glowRadius}px`);
  card.style.setProperty('--cone-spread', `${coneSpread}`);
  card.style.setProperty('--fill-opacity', `${fillOpacity}`);

  const glowVars = buildGlowVars(glowColor, glowIntensity);
  Object.entries(glowVars).forEach(([k, v]) => card.style.setProperty(k, v));

  const gradientVars = buildGradientVars(colors);
  Object.entries(gradientVars).forEach(([k, v]) => card.style.setProperty(k, v));

  // Pointer move handler
  const handlePointerMove = (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  };

  card.addEventListener('pointermove', handlePointerMove, { passive: true });

  // Intro sweep animation triggered when card intersects viewport
  let cancelAnimations = [];
  const runSweep = () => {
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    cancelAnimations.push(
      animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`) })
    );
    cancelAnimations.push(
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(2)}deg`);
      }})
    );
    cancelAnimations.push(
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(2)}deg`);
      }})
    );
    cancelAnimations.push(
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`),
        onEnd: () => card.classList.remove('sweep-active'),
      })
    );
  };

  let sweepFired = false;
  let observer = null;
  if (animated) {
    observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && !sweepFired) {
        sweepFired = true;
        runSweep();
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(card);
  }

  return () => {
    card.removeEventListener('pointermove', handlePointerMove);
    if (observer) observer.disconnect();
    cancelAnimations.forEach(c => c && c());
  };
}

/**
 * Initializes all .border-glow-card elements across the page.
 */
export function initAllBorderGlowCards() {
  const cards = Array.from(document.querySelectorAll('.border-glow-card'));
  const cleanups = cards.map(c => initBorderGlow(c)).filter(Boolean);
  return () => {
    cleanups.forEach(c => c());
  };
}
