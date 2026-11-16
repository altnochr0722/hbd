import { GAME_CONFIG } from './game-config.js';

/** Loads and runs the configured game inside `root`; games never touch other screens. */
export function createGameManager(root) {
  let current = null;
  function stop() { current?.destroy?.(); current = null; root.innerHTML = ''; }
  async function start(onComplete) {
    stop();
    const module = await GAME_CONFIG.games[GAME_CONFIG.activeGame]();
    current = module.default();
    current.mount(root, { onComplete });
  }
  return { start, stop };
}
