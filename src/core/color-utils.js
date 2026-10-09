/**
 * src/core/color-utils.js
 * Color parsing and conversion utilities for canvas and WebGL/Three.js shaders.
 */

export function hexToRgb(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r, g, b };
}

export function hexToGlRgb(hex) {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

export function hexToRgbaString(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
