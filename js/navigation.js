const screens = [...document.querySelectorAll('.screen')];
/** Shows one screen by its data-screen name; hidden screens become inert (no focus). */
export function showScreen(name) {
  screens.forEach(screen => {
    const isActive = screen.dataset.screen === name;
    screen.classList.toggle('active', isActive);
    screen.inert = !isActive;
  });
  document.querySelector('.screen.active h1, .screen.active h2')?.focus({ preventScroll: true });
}
