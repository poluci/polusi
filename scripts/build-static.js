// Собирает статическую витрину (главная, демо-приглашения, демо-кабинет) в dist/
// для GitHub Pages. Формы в витрине не работают: им нужен сервер.
// Запуск: BASE_PATH=/polusi SITE_URL=https://poluci.github.io/polusi node scripts/build-static.js
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
const SITE_URL = process.env.SITE_URL || `http://localhost${BASE}`;
const PORT = 3999;

const PAGES = ['/', '/privacy', '/new', '/i/demo-klassika', '/i/demo-sad', '/i/demo-noch', '/c/demo-kabinet', '/c/demo-kabinet/edit'];
const FILES = ['/c/demo-kabinet/guests.csv'];

const NOTICE = `<script>document.addEventListener('submit',function(e){e.preventDefault();alert('Это витрина сайта. Создание приглашений и ответы гостей заработают на полной версии с сервером.');});</script>`;

const rewrite = (s) => s.replace(/((?:href|src|action)=["']|url\(['"]?)\/(?!\/)/g, `$1${BASE}/`);

async function main() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pozovi-'));
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT, BASE_URL: SITE_URL, DATA_DIR: dataDir }, stdio: 'inherit' });
  try {
    for (let i = 0; ; i++) {
      try { await fetch(`http://localhost:${PORT}/`); break; } catch { if (i > 50) throw new Error('сервер не запустился'); await new Promise((r) => setTimeout(r, 100)); }
    }
    fs.rmSync(OUT, { recursive: true, force: true });
    for (const p of PAGES) {
      const res = await fetch(`http://localhost:${PORT}${p}`);
      if (!res.ok) throw new Error(`${p}: ${res.status}`);
      const html = rewrite(await res.text()).replace('</body>', `${NOTICE}</body>`);
      const file = path.join(OUT, p, 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
    }
    for (const p of FILES) {
      const res = await fetch(`http://localhost:${PORT}${p}`);
      fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true });
      fs.writeFileSync(path.join(OUT, p), Buffer.from(await res.arrayBuffer()));
    }
    fs.cpSync(path.join(ROOT, 'public'), path.join(OUT, 'static'), { recursive: true });
    for (const f of fs.readdirSync(path.join(OUT, 'static')).filter((f) => f.endsWith('.css'))) {
      const full = path.join(OUT, 'static', f);
      fs.writeFileSync(full, rewrite(fs.readFileSync(full, 'utf8')));
    }
    fs.copyFileSync(path.join(OUT, 'index.html'), path.join(OUT, '404.html'));
    fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
    console.log(`Готово: ${OUT}`);
  } finally {
    server.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
