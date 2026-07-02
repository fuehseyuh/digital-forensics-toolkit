/**
 * Tracks cursor position over an element and writes it to CSS custom
 * properties (--mx, --my), which the .tile-hover class in index.css
 * uses to position a radial-gradient glow — the Fluent Design "reveal"
 * hover effect, tracking the cursor across the tile.
 */
export function handleTileMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mx', `${x}px`);
  e.currentTarget.style.setProperty('--my', `${y}px`);
}