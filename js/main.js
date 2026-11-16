import { showScreen } from "./navigation.js";
import { SITE_CONFIG } from "./config.js";
import { play, toggleMute } from "./sound.js";
import { createCake } from "./cake/cake.js";
import { createGameManager } from "./games/game-manager.js";
import { renderPreview, runShuffle, renderReveal } from "./cards/cards.js";
import { burst } from "./confetti.js";
import { startFireworks } from "./cake/fireworks.js";

const $ = (id) => document.getElementById(id);
const cake = createCake($("cake-mount"), {
  onComplete: startGame,
  greeting: `Happy birthday ${SITE_CONFIG.herName || "girl"}`,
});
const games = createGameManager($("game-root"));
let stopShuffle = () => {};
let envelopeTimer = null;
let stopEnvelopeFireworks = null;

function buildSky() {
  const sky = $("sky");
  for (let i = 0; i < 34; i++) {
    const star = document.createElement("i");
    star.className = "star";
    star.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--s:${1 + Math.random() * 2}px;--d:${3 + Math.random() * 4}s;--star-color:${i % 4 === 0 ? "#d7b978" : "#f5efdf"}`;
    sky.appendChild(star);
  }
  for (let i = 0; i < 9; i++) {
    const particle = document.createElement("i");
    particle.className = "particle";
    particle.style.cssText = `left:${8 + Math.random() * 84}%;top:${14 + Math.random() * 72}%;--d:${4 + Math.random() * 5}s;--dx:${(Math.random() - 0.5) * 18}px;animation-delay:-${Math.random() * 6}s`;
    sky.appendChild(particle);
  }
}

function goWelcome() {
  clearTimeout(envelopeTimer);
  envelopeTimer = null;
  stopEnvelopeFireworksEffect();
  $("envelope-btn").disabled = false;
  $("envelope-btn").classList.remove("opening");
  stopShuffle();
  games.stop();
  cake.reset();
  showScreen("welcome");
}
function startCake() {
  cake.reset();
  showScreen("cake");
}
function openEnvelope() {
  const envelope = $("envelope-btn");
  if (envelope.disabled) return;
  envelope.disabled = true;
  envelope.classList.add("opening");
  play("chime");
  burst(envelope, 20);
  stopEnvelopeFireworks = startFireworks(envelope);
  envelopeTimer = setTimeout(() => {
    envelopeTimer = null;
    stopEnvelopeFireworksEffect();
    startCake();
  }, 1100);
}
function stopEnvelopeFireworksEffect() {
  stopEnvelopeFireworks?.();
  stopEnvelopeFireworks = null;
}
async function startGame() {
  await games.start(showPreview); // the game only reports completion; it never navigates
  showScreen("game");
}
function showPreview() {
  renderPreview($("preview-root"), showShuffle);
  showScreen("preview");
  setTimeout(() => games.stop(), 600);
}
function showShuffle() {
  stopShuffle = runShuffle($("shuffle-root"), showReveal);
  showScreen("shuffle");
}
function showReveal(card) {
  renderReveal($("reveal-root"), card, goWelcome);
  showScreen("reveal");
}

buildSky();
$("mute-btn").addEventListener("click", (event) => {
  const muted = toggleMute();
  event.currentTarget.textContent = muted ? "🔇" : "🔊";
  event.currentTarget.setAttribute("aria-pressed", muted);
});
$("envelope-btn").addEventListener("click", openEnvelope);

// Local design preview: append ?preview=cards to inspect cards without completing the puzzle.
if (new URLSearchParams(window.location.search).get("preview") === "cards") {
  showPreview();
}
