// Lightweight canvas fireworks. startFireworks(parent) returns a stop() that removes everything.
const COLORS = ['#d7b978', '#c28a98', '#f5efdf', '#9f92b9', '#e8d4b1'];
export function startFireworks(parent) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const canvas = document.createElement('canvas'); canvas.className = 'fireworks'; parent.appendChild(canvas);
  const ctx = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  let w, h, rockets = [], sparks = [], timer = 0, last = performance.now(), frameId, stopped = false;
  const resize = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  function explode(x, y) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < 48; i++) { const a = (Math.PI * 2 * i) / 48, speed = 1.5 + Math.random() * 2.8; sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, color }); }
  }
  function frame(now) {
    if (stopped) return;
    const dt = Math.min((now - last) / 16.7, 3); last = now;
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    if ((timer -= dt) <= 0) { rockets.push({ x: w * (0.15 + Math.random() * 0.7), y: h, targetY: h * (0.1 + Math.random() * 0.3), vy: -h / 50 }); timer = 14 + Math.random() * 14; }
    rockets = rockets.filter(r => { r.y += r.vy * dt; ctx.fillStyle = '#d7b978'; ctx.fillRect(r.x, r.y, 3, 9); if (r.y <= r.targetY) { explode(r.x, r.y); return false; } return true; });
    sparks = sparks.filter(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.04 * dt; s.vx *= 0.985; s.life -= 0.016 * dt; ctx.globalAlpha = Math.max(s.life, 0); ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 3, 3); return s.life > 0; });
    ctx.globalAlpha = 1; frameId = requestAnimationFrame(frame);
  }
  resize(); addEventListener('resize', resize); frameId = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(frameId); removeEventListener('resize', resize); canvas.remove(); };
}
