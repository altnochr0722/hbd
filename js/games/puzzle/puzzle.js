import { burst } from '../../confetti.js';
import { play } from '../../sound.js';
import { PUZZLE_CONFIG } from './puzzle-config.js';
import { buildPiecePaths } from './jigsaw-geometry.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}, parent) => {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  parent?.appendChild(node);
  return node;
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };

export default function createPuzzle() {
  const { columns, rows, imagePath, snapTolerance } = PUZZLE_CONFIG, TOTAL = columns * rows;
  let root, area, counterEl, statusEl, nextBtn, abort, photo;
  let svg, lockedLayer, freeLayer, boardRect, completeImage;
  let pieces = [], placed = 0, drag = null, done = false, destroyed = false, mode = null;
  let bw, bh, pw, ph, pad, home, viewW, viewH;

  const movePiece = (piece, x, y) => { piece.x = x; piece.y = y; piece.group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); };
  const toSvgPoint = event => { const pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  const wantedMode = () => innerWidth >= innerHeight * 1.1 ? 'wide' : 'tall';

  function loadPhoto() {
    area.innerHTML = '<p class="puzzle-msg">Зургийг ачаалж байна…</p>';
    photo = new Image();
    photo.onload = () => { if (!destroyed) buildBoard(photo); };
    photo.onerror = () => {
      if (destroyed) return;
      area.innerHTML = `<p class="puzzle-msg">Зураг олдсонгүй: <code>${imagePath}</code><br>Зургаа энэ нэрээр хуулаад дахин оролдоорой.</p><button class="btn retry">Дахин оролдох</button>`;
      area.querySelector('.retry').addEventListener('click', loadPhoto, { signal: abort.signal });
    };
    photo.src = imagePath;
  }

  function buildBoard(img) {
    const aspect = img.naturalWidth / img.naturalHeight;     // keeps the photo undistorted
    bw = aspect >= 1 ? 1000 : 1000 * aspect; bh = bw / aspect;
    pw = bw / columns; ph = bh / rows; pad = 0.3 * Math.max(pw, ph); home = { x: pad, y: pad };
    area.innerHTML = '';
    svg = svgEl('svg', { class: 'puzzle-svg', role: 'group', 'aria-label': 'Оньсогын талбай' }, area);
    const defs = svgEl('defs', {}, svg);
    boardRect = svgEl('rect', { class: 'board', rx: 14 }, svg);
    lockedLayer = svgEl('g', {}, svg); freeLayer = svgEl('g', {}, svg);
    completeImage = svgEl('image', { class: 'complete-img', href: imagePath, width: bw, height: bh, preserveAspectRatio: 'none' }, svg);
    pieces = buildPiecePaths(columns, rows, pw, ph).map((d, index) => {
      svgEl('path', { d }, svgEl('clipPath', { id: `pz-clip-${index}` }, defs));
      const group = svgEl('g', { class: 'piece', 'data-index': index }, freeLayer);
      svgEl('image', { href: imagePath, width: bw, height: bh, preserveAspectRatio: 'none', 'clip-path': `url(#pz-clip-${index})` }, group);
      svgEl('path', { d, class: 'edge' }, group);
      return { index, col: index % columns, row: Math.floor(index / columns), group, x: 0, y: 0, locked: false };
    });
    const { signal } = abort;
    svg.addEventListener('pointerdown', onPointerDown, { signal });
    svg.addEventListener('pointermove', onPointerMove, { signal });
    svg.addEventListener('pointerup', onPointerEnd, { signal });
    svg.addEventListener('pointercancel', onPointerEnd, { signal });
    layout();
  }

  /** Sets the view box (pieces go below the board in portrait, beside it in landscape) and scatters unplaced pieces. */
  function layout() {
    mode = wantedMode();
    const slotW = pw * 1.15, slotH = ph * 1.15, bandW = columns * slotW, bandH = rows * slotH;
    let band;
    if (mode === 'wide') { band = { x: pad + bw + pad * 1.5, y: pad }; viewW = band.x + bandW + pad; viewH = Math.max(bh, bandH) + 2 * pad; }
    else { band = { x: pad, y: pad + bh + pad * 1.5 }; viewW = Math.max(bw, bandW) + 2 * pad; viewH = band.y + bandH + pad; }
    svg.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
    [['x', home.x], ['y', home.y], ['width', bw], ['height', bh]].forEach(([k, v]) => boardRect.setAttribute(k, v));
    completeImage.setAttribute('x', home.x); completeImage.setAttribute('y', home.y);
    const slots = shuffle([...Array(TOTAL).keys()]);
    pieces.forEach((piece, k) => {
      if (piece.locked) return movePiece(piece, home.x, home.y);
      const s = slots[k], jitterX = (Math.random() - 0.5) * pw * 0.2, jitterY = (Math.random() - 0.5) * ph * 0.2;
      movePiece(piece, band.x + (s % columns) * slotW + (slotW - pw) / 2 + jitterX - piece.col * pw,
                       band.y + Math.floor(s / columns) * slotH + (slotH - ph) / 2 + jitterY - piece.row * ph);
    });
  }

  function onPointerDown(event) {
    if (drag || done) return;
    const group = event.target.closest?.('.piece');
    if (!group) return;
    const piece = pieces[Number(group.dataset.index)];
    if (piece.locked) return;
    event.preventDefault();
    const pt = toSvgPoint(event);
    drag = { piece, pointerId: event.pointerId, offsetX: pt.x - piece.x, offsetY: pt.y - piece.y };
    svg.setPointerCapture(event.pointerId);
    freeLayer.appendChild(group);                          // bring to front
    group.classList.add('dragging');
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { piece } = drag, pt = toSvgPoint(event);
    movePiece(piece, clamp(pt.x - drag.offsetX, -piece.col * pw, viewW - pw - piece.col * pw),
                     clamp(pt.y - drag.offsetY, -piece.row * ph, viewH - ph - piece.row * ph));
  }

  function onPointerEnd(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { piece, pointerId } = drag; drag = null;
    try { svg.releasePointerCapture(pointerId); } catch { /* already released */ }
    piece.group.classList.remove('dragging');
    if (Math.hypot(piece.x - home.x, piece.y - home.y) < Math.min(pw, ph) * snapTolerance) lockPiece(piece);
  }

  function lockPiece(piece) {
    movePiece(piece, home.x, home.y);
    piece.locked = true;
    piece.group.classList.add('locked');
    lockedLayer.appendChild(piece.group);
    play('chime');
    counterEl.textContent = `${++placed} / ${TOTAL}`;
    if (placed === TOTAL) complete();
  }

  function complete() {
    done = true;
    svg.classList.add('done');
    statusEl.textContent = 'Чи зургийг нь оллоо! 🎉';
    burst(area, 40);
    nextBtn.hidden = false;
    nextBtn.focus();
  }

  return {
    mount(rootElement, { onComplete }) {
      root = rootElement; abort = new AbortController();
      root.innerHTML = `<h2 tabindex="-1">Jigsaw puzzle</h2>
        <p class="puzzle-intro">Хэсгүүдийг чирээд зөв газар нь тавь. Зөв хэсэг нь автоматаар түгжигдэнэ.</p>
        <div class="puzzle-area"></div>
        <div class="puzzle-bar"><span class="counter" aria-live="polite">0 / ${TOTAL}</span><span class="status" aria-live="polite"></span></div>
        <button class="btn" hidden>Картуудаа үзэх</button>`;
      area = root.querySelector('.puzzle-area'); counterEl = root.querySelector('.counter');
      statusEl = root.querySelector('.status'); nextBtn = root.querySelector('.btn');
      nextBtn.addEventListener('click', onComplete, { signal: abort.signal });
      window.addEventListener('resize', () => { if (svg && !done && wantedMode() !== mode) layout(); }, { signal: abort.signal });
      loadPhoto();
    },
    destroy() {
      destroyed = true; done = true;
      if (drag) { try { svg.releasePointerCapture(drag.pointerId); } catch { /* ignore */ } drag = null; }
      abort?.abort();
      if (photo) { photo.onload = photo.onerror = null; }
      pieces = []; if (root) root.innerHTML = '';
    },
  };
}
