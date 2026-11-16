// Zero-dependency static server: `npm start` then open http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg' };

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';       // check before normalizing (Windows turns / into \)
    const file = resolve(join(root, pathname));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const body = await readFile(file);                           // read first, so errors can still send a 404
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end('Not found');
  }
}).listen(process.env.PORT || 3000, () => console.log(`Open http://localhost:${process.env.PORT || 3000}`));
