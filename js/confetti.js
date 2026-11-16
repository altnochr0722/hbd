const COLORS = ['#d7b978', '#c28a98', '#f5efdf', '#9f92b9', '#e8d4b1'];
/** Burst of confetti from the centre of `parent` (parent must be position:relative). */
export function burst(parent, count = 28) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('i');
    const angle = Math.random() * Math.PI * 2, distance = 80 + Math.random() * 160;
    piece.className = 'confetti';
    piece.style.cssText = `--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance - 60}px;--c:${COLORS[i % COLORS.length]}`;
    parent.appendChild(piece);
    setTimeout(() => piece.remove(), 1400);
  }
}
