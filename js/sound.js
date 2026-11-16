// Tiny synthesized sound effects (Web Audio, no audio files). Starts after the first user click.
let audioContext = null, muted = false;
const tone = (freq, start, duration, type = 'sine', volume = 0.15) => {
  const osc = audioContext.createOscillator(), gain = audioContext.createGain(), t = audioContext.currentTime + start;
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(audioContext.destination); osc.start(t); osc.stop(t + duration);
};
const SOUNDS = {
  pop: () => tone(520, 0, 0.12, 'triangle', 0.2),
  tick: () => tone(660, 0, 0.1, 'square', 0.05),
  chime: () => { tone(784, 0, 0.25); tone(1047, 0.1, 0.35); },
};
export function play(name) {
  if (muted) return;
  try { audioContext ??= new AudioContext(); audioContext.resume?.(); SOUNDS[name]?.(); } catch { /* audio unavailable */ }
}
export function playBirthdaySong() {
  if (muted) return;
  const melody = [
    [392, 0.5], [392, 0.5], [440, 1], [392, 1], [523.25, 1], [493.88, 2],
    [392, 0.5], [392, 0.5], [440, 1], [392, 1], [587.33, 1], [523.25, 2],
    [392, 0.5], [392, 0.5], [783.99, 1], [659.25, 1], [523.25, 1], [493.88, 1], [440, 2],
    [698.46, 0.5], [698.46, 0.5], [659.25, 1], [523.25, 1], [587.33, 1], [523.25, 2],
  ];
  try {
    audioContext ??= new AudioContext();
    audioContext.resume?.();
    const beat = 0.26;
    let elapsed = 0;
    for (const [frequency, beats] of melody) {
      const length = beats * beat;
      tone(frequency, elapsed * beat, length * 0.88, 'sine', 0.12);
      tone(frequency * 2, elapsed * beat, length * 0.72, 'sine', 0.025);
      elapsed += beats;
    }
  } catch { /* audio unavailable */ }
}
export const toggleMute = () => (muted = !muted);
