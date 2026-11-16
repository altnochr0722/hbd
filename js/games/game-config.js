// To swap the mini-game: add a loader here and change activeGame. Nothing else needs to change.
// A game module's default export is a factory returning { mount(root, { onComplete }), destroy() }.
export const GAME_CONFIG = {
  activeGame: 'puzzle',
  games: { puzzle: () => import('./puzzle/puzzle.js') },
};
