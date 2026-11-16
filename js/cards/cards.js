import { CARDS } from './card-data.js';
import { burst } from '../confetti.js';
import { play } from '../sound.js';
import { SITE_CONFIG } from '../config.js';
import { PUZZLE_CONFIG } from '../games/puzzle/puzzle-config.js';

/** Screen 4: describe every card so the choice is informed. */
export function renderPreview(root, onContinue) {
  root.innerHTML = `<h2 tabindex="-1">Гурван дурсамжийн карт</h2><p>Карт бүрийг товшоод мэндчилгээг нь уншаарай.</p>
    <div class="preview-list">${CARDS.map(card => `<button type="button" class="card card-${card.theme}" aria-pressed="false" aria-label="${card.title}. Эргүүлж мэндчилгээг унших">
      <span class="card-inner"><span class="card-face front"><span class="card-photo"><span class="emoji">${card.emoji}</span></span><span class="polaroid-caption">${card.title}</span></span>
        <span class="card-face back"><span class="card-star" aria-hidden="true">✦</span><span class="kind">${card.kind}</span><span class="card-reason">${card.preview}</span><span class="flip-hint">Дахин товшоод буцаана</span></span></span></button>`).join('')}</div>
    <button class="btn">Картуудаа холих 🔀</button>`;
  root.querySelectorAll('.card').forEach(card => card.addEventListener('click', () => {
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(flipped));
  }));
  root.querySelector('.btn').addEventListener('click', onContinue);
}

/** Screen 5: flip, shuffle positions only (identity stays in data-id), then let the user pick. Returns a cleanup function. */
export function runShuffle(root, onPick) {
  root.innerHTML = `<h2 tabindex="-1">Анхааралтай хараарай!</h2><p class="status" aria-live="polite">Картууд байраа сольж байна…</p>
    <div class="deck">${CARDS.map((card, i) => `<button class="pick" data-id="${card.id}" style="--slot:${i}" disabled aria-label="Нууц карт ${i + 1}">
      <span class="inner"><span class="face front card-${card.theme}"><span class="emoji">${card.emoji}</span><strong>${card.title}</strong></span>
      <span class="face back">✦</span></span></button>`).join('')}</div>`;
  const status = root.querySelector('.status');
  const picks = [...root.querySelectorAll('.pick')];
  const slots = picks.map((_, i) => i);
  const timers = [];
  const animations = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const SHUFFLES = 5, STEP_MS = 650, FLIP_MS = 1200;
  const finalSlots = Math.random() < 0.5 ? [1, 2, 0] : [2, 0, 1];

  function setSlot(index, slot, tilt = 0) {
    picks[index].style.setProperty('--slot', slot);
    picks[index].style.setProperty('--tilt', `${tilt}deg`);
  }

  function animateToSlot(index, slot, lift) {
    const pick = picks[index];
    const from = getComputedStyle(pick).transform;
    setSlot(index, slot);
    const to = getComputedStyle(pick).transform;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tiltedArc = `${to} translateY(${lift}px) rotate(${(Math.random() - 0.5) * 12}deg) scale(1.05)`;
    if (typeof pick.animate === 'function') {
      const animation = pick.animate(
        reducedMotion
          ? [{ transform: from }, { transform: to }]
          : [
              { transform: from, offset: 0 },
              { transform: tiltedArc, offset: 0.5 },
              { transform: to, offset: 1 },
            ],
        { duration: reducedMotion ? 240 : STEP_MS - 80, easing: 'cubic-bezier(.3,.75,.2,1)' },
      );
      animations.push(animation);
    }
    pick.classList.add('changing');
    later(() => pick.classList.remove('changing'), STEP_MS - 40);
  }

  function swapPair(a, b) {
    [slots[a], slots[b]] = [slots[b], slots[a]];
    // The pair crosses in opposite arcs, so their exchange is easy to follow.
    animateToSlot(a, slots[a], -26);
    animateToSlot(b, slots[b], 26);
  }

  later(() => {
    picks.forEach(pick => pick.classList.add('down'));
    status.textContent = 'Картууд байраа сольж байна…';
  }, FLIP_MS);
  for (let round = 0; round < SHUFFLES; round++) {
    later(() => {
      const a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      swapPair(a, b);
    }, FLIP_MS + 900 + round * STEP_MS);
  }
  later(() => {
    // Finish with a derangement so every card has visibly changed places.
    finalSlots.forEach((slot, i) => {
      if (slots[i] !== slot) animateToSlot(i, slot, i % 2 ? 24 : -24);
      slots[i] = slot;
    });
  }, FLIP_MS + 900 + SHUFFLES * STEP_MS);
  later(() => {
    picks.forEach(pick => { pick.disabled = false; });
    status.textContent = 'Нэг карт сонгоорой!';
    picks[0].focus();
  }, FLIP_MS + 900 + (SHUFFLES + 1) * STEP_MS + 300);

  picks.forEach(pick => pick.addEventListener('click', () => {
    picks.forEach(other => { other.disabled = true; if (other !== pick) other.classList.add('dim'); });
    pick.classList.remove('down');
    burst(root.querySelector('.deck'), 24);
    status.textContent = 'Сонголт хийгдлээ!';
    later(() => onPick(CARDS.find(card => card.id === pick.dataset.id)), 1300);
  }));
  return () => {
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
  };
}

/** Screen 6: a gift box first; opening it reveals only the chosen card (plus her photo as a small polaroid). */
export function renderReveal(root, card, onReplay) {
  const spots = [['-6%', '-4%'], ['88%', '2%'], ['2%', '90%']];
  const heading = card.id === 'warm' && SITE_CONFIG.herName ? `Happy birthday, ${SITE_CONFIG.herName}!` : card.reveal.heading;
  root.innerHTML = `<div class="reveal-stage">
    <button class="gift" aria-label="Gift box нээх"><span class="gift-lid"></span><span class="gift-body"></span><span class="gift-hint">Tap to open 🎁</span></button>
    <article class="reveal-card card-${card.theme}" hidden><span class="emoji big">${card.emoji}</span><h2 tabindex="-1">${heading}</h2>
      ${card.reveal.paragraphs.map(text => `<p>${text}</p>`).join('')}
      <img class="polaroid" src="${PUZZLE_CONFIG.imagePath}" alt="" onerror="this.remove()">
      ${card.decor.map((symbol, i) => `<span class="deco" aria-hidden="true" style="left:${spots[i][0]};top:${spots[i][1]};animation-delay:${i * 0.6}s">${symbol}</span>`).join('')}
    </article></div><p class="screenshot-note" hidden>Send me a screenshot of your gift! ✨</p><button class="btn" hidden>Play again ↻</button>`;
  const gift = root.querySelector('.gift'), cardEl = root.querySelector('.reveal-card'), replay = root.querySelector('.btn'), screenshotNote = root.querySelector('.screenshot-note');
  gift.addEventListener('click', () => {
    gift.classList.add('open'); play('chime'); burst(root.querySelector('.reveal-stage'), 40);
    setTimeout(() => { gift.hidden = true; cardEl.hidden = false; screenshotNote.hidden = false; replay.hidden = false; cardEl.querySelector('h2').focus(); }, 700);
  }, { once: true });
  replay.addEventListener('click', onReplay);
  setTimeout(() => gift.focus(), 700);
}
