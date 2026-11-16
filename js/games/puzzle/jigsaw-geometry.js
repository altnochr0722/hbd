// Pure geometry: builds SVG path strings for a cols×rows jigsaw in ONE coordinate system (board space).
// Each internal edge is generated once; the two neighbours use the same coordinates (one forward, one reversed),
// so tabs and holes always match exactly. Outer edges are straight lines.
const TAB = [  // edge shape in (t along edge, u across edge), as fractions of edge length
  ['L', .35, 0], ['C', .40, 0, .44, .06, .42, .12], ['C', .34, .26, .66, .26, .58, .12], ['C', .56, .06, .60, 0, .65, 0], ['L', 1, 0],
];
const fmt = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

function makeEdge(a, b, normal) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), sign = Math.random() < 0.5 ? -1 : 1;
  const at = (t, u) => [a[0] + dx * t + normal[0] * u * len * sign, a[1] + dy * t + normal[1] * u * len * sign];
  const segments = TAB.map(([type, ...n]) => type === 'L'
    ? { type, p: at(n[0], n[1]) }
    : { type, c1: at(n[0], n[1]), c2: at(n[2], n[3]), p: at(n[4], n[5]) });
  return { a, segments };
}
const forward = ({ segments }) => segments.map(s => s.type === 'L' ? `L${fmt(s.p)}` : `C${fmt(s.c1)} ${fmt(s.c2)} ${fmt(s.p)}`).join('');
const reversed = ({ a, segments }) => segments.map((_, k) => {
  const i = segments.length - 1 - k, s = segments[i], prev = i ? segments[i - 1].p : a;
  return s.type === 'L' ? `L${fmt(prev)}` : `C${fmt(s.c2)} ${fmt(s.c1)} ${fmt(prev)}`;
}).join('');

/** Returns cols*rows path strings (row-major) in board coordinates. */
export function buildPiecePaths(cols, rows, pw, ph) {
  const h = (r, c) => makeEdge([c * pw, r * ph], [(c + 1) * pw, r * ph], [0, 1]);
  const v = (r, c) => makeEdge([c * pw, r * ph], [c * pw, (r + 1) * ph], [1, 0]);
  const horizontal = Array.from({ length: rows + 1 }, (_, r) => Array.from({ length: cols }, (_, c) => (r > 0 && r < rows) ? h(r, c) : null));
  const vertical = Array.from({ length: rows }, (_, r) => Array.from({ length: cols + 1 }, (_, c) => (c > 0 && c < cols) ? v(r, c) : null));
  const paths = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = c * pw, y0 = r * ph, x1 = x0 + pw, y1 = y0 + ph;
    paths.push(`M${fmt([x0, y0])}`
      + (horizontal[r][c] ? forward(horizontal[r][c]) : `L${fmt([x1, y0])}`)
      + (vertical[r][c + 1] ? forward(vertical[r][c + 1]) : `L${fmt([x1, y1])}`)
      + (horizontal[r + 1][c] ? reversed(horizontal[r + 1][c]) : `L${fmt([x0, y1])}`)
      + (vertical[r][c] ? reversed(vertical[r][c]) : `L${fmt([x0, y0])}`) + 'Z');
  }
  return paths;
}
