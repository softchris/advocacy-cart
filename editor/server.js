const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const GAME_ROOT = path.join(__dirname, '..'); // parent = game root (static files)
const EDITOR_DIR = __dirname;               // editor/ folder
const LEVELS_DIR = path.join(GAME_ROOT, 'levels');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: Save level
  if (req.method === 'POST' && url.pathname === '/api/save-level') {
    try {
      const body = JSON.parse(await readBody(req));
      const filename = body.filename;
      if (!filename || !filename.match(/^[a-zA-Z0-9_-]+\.json$/)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid filename. Use alphanumeric with .json extension.' }));
        return;
      }
      const filePath = path.join(LEVELS_DIR, filename);
      const exists = fs.existsSync(filePath);
      fs.writeFileSync(filePath, JSON.stringify(body.data, null, 2));

      // Update manifest
      updateManifest();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, created: !exists, filename }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: List levels
  if (req.method === 'GET' && url.pathname === '/api/list-levels') {
    try {
      const files = fs.readdirSync(LEVELS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
      const levels = files.map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(LEVELS_DIR, f), 'utf8'));
        return { filename: f, name: data.name, description: data.description, emoji: data.emoji, type: data.type };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(levels));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Check if level exists
  if (req.method === 'GET' && url.pathname === '/api/level-exists') {
    const filename = url.searchParams.get('filename');
    const exists = filename && fs.existsSync(path.join(LEVELS_DIR, filename));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ exists }));
    return;
  }

  // Static file serving — editor files from editor/, everything else from game root
  let filePath;
  if (url.pathname === '/editor.html' || url.pathname.startsWith('/editor/')) {
    const editorPath = url.pathname === '/editor.html' ? 'editor.html' : url.pathname.slice('/editor/'.length);
    filePath = path.join(EDITOR_DIR, editorPath);
  } else {
    filePath = path.join(GAME_ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  }
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(GAME_ROOT) && !filePath.startsWith(EDITOR_DIR)) { res.writeHead(403); res.end(); return; }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

function updateManifest() {
  const files = fs.readdirSync(LEVELS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json').sort();
  const manifest = { levels: files.map(f => `levels/${f}`) };
  fs.writeFileSync(path.join(LEVELS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

server.listen(PORT, () => {
  console.log(`AdvoCart Editor Server running at http://localhost:${PORT}`);
  console.log(`Game:   http://localhost:${PORT}/`);
  console.log(`Editor: http://localhost:${PORT}/editor.html`);
});
