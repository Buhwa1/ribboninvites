// Local development server: serves /public and the API exactly like vercel.json does.
// Run:  npm run dev   then open http://localhost:3000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import handler from './api/router.js';

const PORT = process.env.PORT || 3000;
const ROOT = path.join(process.cwd(), 'public');
const UPLOADS = path.join(process.cwd(), '.data', 'uploads');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const REWRITES = [[/^\/i\/[^/]+\/?$/, '/invite.html'], [/^\/dashboard\/[^/]+\/?$/, '/dashboard.html'], [/^\/checkin\/[^/]+\/?$/, '/checkin.html']];

function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://local');
  if (u.pathname.startsWith('/api/')) return handler(req, res);
  if (u.pathname.startsWith('/uploads/')) return serveFile(res, path.join(UPLOADS, path.basename(u.pathname)));
  let p = u.pathname;
  for (const [re, to] of REWRITES) if (re.test(p)) p = to;
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  serveFile(res, file);
}).listen(PORT, () => console.log(`Invitations running at http://localhost:${PORT}`));
