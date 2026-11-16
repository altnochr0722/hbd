# Birthday Adventure project context

This file carries forward decisions from the shared planning conversation. Treat it as the agreed product direction; inspect the current code before making changes and adapt the plan to the implementation that is actually present.

## Current visual direction

- Use a calm midnight-indigo and deep navy theme with dusty rose, champagne gold, and warm ivory accents.
- Keep the atmosphere magical, elegant, warm, and personal using a few softly glowing stars and drifting particles. Avoid bunting, polka dots, excess balloons, and clutter.
- The welcome screen uses an interactive envelope and wax seal that opens into the existing cake flow.
- Restyle memory cards as accessible, touch-friendly Polaroid flip cards. Use the existing card content as the reverse side; do not invent messages or add another screen.

## Experience flow

Keep the existing experience and card behavior intact. The intended flow is:

`Welcome → Cake → Countdown → Birthday song → Puzzle → Completion → Preview → Shuffle → Reveal`

The existing welcome screen, cake design, individual candle interactions, card content and mapping, shuffle/reveal behavior, and restart flow should remain working.

## Cake countdown

- Preserve the existing three-tier cake, individual candle interactions, and countdown while restyling it in ivory, dusty rose, and champagne gold. The current requirement is exactly 19 candles.
- Keep individual candle clicking.
- Pressing `Үлээх` starts one countdown; lock the button while it runs.
- Show `3 — Бэлэн үү?`, `2 — Хүслээ бодоорой...`, then `1 — Хоёулаа зэрэг үлээгээрэй!`.
- At the end, extinguish all candles still lit at once, show subtle smoke, and reuse the existing confetti effect.
- Play the synthesized birthday melody after the candles go out. Do not use the low repeated boom sound effect.
- If some candles were put out individually, only extinguish the remaining ones. Handle the all-out case gracefully and prevent duplicate countdowns.
- Continue to the puzzle after the celebration finishes. Keep cake behavior independent of navigation and clean up timers/listeners on teardown.

## Photo jigsaw

- Replace the number/square-tile puzzle with a genuine classic jigsaw using SVG geometry, with curved tabs and matching holes.
- Use the local photo at `assets/images/her-photo.jpg` (already present in this checkout). Keep its path configurable in one clear place, preserve its aspect ratio, and show a useful error if it cannot load.
- Use a 5 × 5 grid (25 pieces). Generate all pieces from one consistent image coordinate system so their edges and image align exactly when assembled.
- On each fresh game, shuffle the pieces, place them scattered outside the central board, and randomize their initial rotation. Do not show a photo preview, reference thumbnail, or hint.
- Support mouse and touch dragging with Pointer Events. Pieces snap and lock when placed correctly; a wrong placement returns smoothly to its previous position. Initial rotation is corrected automatically on successful placement; there is no manual rotation.
- Show progress from `0 / 25` through `25 / 25`. Keep pieces selectable, avoid excessive overlap, keep them within the play area, and make the layout usable on phones without horizontal overflow.
- On completion, reveal the connected photo, celebrate, display `Чи зургийг нь оллоо! 🎉`, and offer `Картуудаа үзэх`.

## Architecture and implementation preferences

- Preserve the modular architecture and working screens; modify only the modules and styles needed.
- The planning conversation identified `js/cake/cake.js`, `js/games/puzzle/puzzle.js`, `js/games/puzzle/jigsaw-geometry.js`, `js/games/game-manager.js`, `js/main.js`, and `js/confetti.js` as relevant. Verify actual responsibilities before editing.
- Preserve the existing game interface (`mount(root, { onComplete })` and `destroy()`) where applicable. Game modules should not control navigation directly.
- Reuse existing effects and avoid unnecessary dependencies or rewrites.
- Clean up event listeners, pointer capture, timers, and animations in `destroy()`; prevent races and ensure restart creates a fresh random puzzle.
- When working on this project, collaborate on major design choices, preserve existing functionality unless asked to change it, and keep implementation modular. Final reports should state files changed, photo setup, how to run the project, what was actually verified, and any remaining limitations.
