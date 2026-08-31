#!/usr/bin/env node
/*
 * Proves the app is a static site.
 *
 * A dumb file server: no API, no engine endpoint, nothing that could be
 * mistaken for a backend. Any request to /api/* fails the test outright.
 *
 * Needs jsdom (test-only):  npm install --no-save jsdom
 * Run: node e2e-test.js [path/to/game/mygame]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const cp = require('child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, 'dist');
const GAME = process.argv[2] || path.join(__dirname, '..', '..', 'choicescript', 'web', 'mygame');
const PORT = 9950 + Math.floor(Math.random() * 40);

let pass = 0, fail = 0;
const ok = (n, c, e) => { c ? (pass++, console.log('  ok   ' + n))
                            : (fail++, console.log('  FAIL ' + n + (e ? '  -> ' + e : ''))); };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json' };

let apiHits = 0;
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api')) { apiHits++; res.writeHead(404); return res.end('no backend here'); }
  const file = path.join(ROOT, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

function finish(code) {
  try { server.close(); } catch (e) {}
  console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(code);
}

const zip = '/tmp/static-game.zip';
fs.rmSync(zip, { force: true });
cp.execSync(
  'cd ' + JSON.stringify(GAME) + ' && zip -qr ' + zip + ' scenes $(ls *.png 2>/dev/null | head -8) 2>/dev/null || cd ' + JSON.stringify(GAME) + ' && zip -qr ' + zip + ' scenes',
  { shell: '/bin/bash' },
);

server.listen(PORT, async () => {
  console.log('\nstatic file server on :' + PORT + ' (no API, no engine endpoint)');

  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
  });
  const win = dom.window;
  const errors = [];
  win.addEventListener('error', (e) => errors.push(e.message));

  /*
   * jsdom implements none of these. They are universal in browsers; the app is
   * not doing anything exotic. Polyfilling here keeps the test honest about
   * what it is actually exercising.
   */
  const fakeIdb = require('fake-indexeddb');
  win.indexedDB = fakeIdb.indexedDB;
  win.IDBKeyRange = fakeIdb.IDBKeyRange;
  win.DecompressionStream = DecompressionStream;
  win.Blob = Blob;
  win.Response = Response;
  if (!win.crypto.randomUUID) win.crypto.randomUUID = () => require('crypto').randomUUID();
  let objectUrls = 0;
  win.URL.createObjectURL = () => 'blob:test/' + ++objectUrls;
  win.URL.revokeObjectURL = () => {};
  if (!win.navigator.storage) {
    Object.defineProperty(win.navigator, 'storage', {
      value: { estimate: async () => ({ usage: 1024, quota: 1024 * 1024 * 500 }),
               persist: async () => true, persisted: async () => true },
      configurable: true,
    });
  }

  /* jsdom does not execute <script type="module">, which is what Vite emits.
     The entry chunk has no top-level import/export, so running it as a classic
     script is faithful. */
  const src = win.document.querySelector('script[type=module]');
  if (src) {
    const href = src.getAttribute('src').replace(/^\.?\//, '');
    const code = await new Promise((resolve) => {
      http.get('http://127.0.0.1:' + PORT + '/' + href, (r) => {
        const c = []; r.on('data', (x) => c.push(x));
        r.on('end', () => resolve(Buffer.concat(c).toString('utf8')));
      });
    });
    try { win.eval(code); } catch (e) { errors.push('module eval: ' + e.message); }
  }

  await new Promise((r) => setTimeout(r, 1200));
  const d = win.document;

  console.log('\nthe static app loads');
  ok('React mounted', !!d.querySelector('#root > *'), d.body.innerHTML.slice(0, 100));
  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  ok('IndexedDB is available', typeof win.indexedDB === 'object');

  console.log('\nimporting a game entirely in the browser');
  const buf = fs.readFileSync(zip);
  const file = new win.File([new Uint8Array(buf)], 'game.zip', { type: 'application/zip' });
  const input = d.querySelector('input[type=file]');
  ok('a file input exists', !!input);
  if (!input) return finish(1);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new win.Event('change', { bubbles: true }));

  await new Promise((r) => setTimeout(r, 4000));

  console.log('\nit plays with no server');
  ok('the engine loaded from static files', typeof win.ChoiceScript === 'object');
  if (typeof win.ChoiceScript !== 'object') {
    console.log('  page errors:', errors.slice(0, 3).join(' | '));
    return finish(1);
  }
  const state = win.ChoiceScript.getState();
  ok('state is serialisable', (function () { try { JSON.stringify(state); return true; } catch (e) { return false; } })());
  ok('scenes were preloaded, not fetched', !!win.allScenes && Object.keys(win.allScenes).length > 0,
    'allScenes: ' + Object.keys(win.allScenes || {}).length);
  ok('title published', !!state.title, JSON.stringify(state.title));

  const body = d.querySelector('.prose-cs');
  ok('the first screen has content',
    !!body && (body.textContent.trim().length > 0 || !!body.querySelector('img')),
    body ? JSON.stringify(body.innerHTML.slice(0, 60)) : 'no .prose-cs');

  const next = Array.prototype.slice.call(d.querySelectorAll('button'))
    .find((b) => /^(Next|Continue)/.test(b.textContent.trim()));
  ok('a control is offered', !!next, next ? next.textContent : 'none');
  if (next) {
    next.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 700));
    const after = d.querySelector('.prose-cs');
    ok('the story advances', !!after && after.textContent.trim().length > 0);
  }

  console.log('\nnothing reached a server');
  ok('zero /api requests were made', apiHits === 0, apiHits + ' hits');

  console.log('\nit is still the same app');
  ok('the HUD renders', !!d.querySelector('nav[aria-label="Game controls"]'));
  win.ChoiceScript.setTheme('terminal');
  ok('themes still apply', d.body.classList.contains('theme-terminal'));
  ok('theme tokens resolve from the static stylesheet',
    win.getComputedStyle(d.body).getPropertyValue('--cs-paper').trim() !== '',
    JSON.stringify(win.getComputedStyle(d.body).getPropertyValue('--cs-paper')));
  win.ChoiceScript.openStats();
  await new Promise((r) => setTimeout(r, 400));
  ok('stats sheet opens', !!d.querySelector('[role=dialog]'), win.ChoiceScript.getState().overlay);
  ok('stat bars render as meters', d.querySelectorAll('[role=meter]').length > 0,
    d.querySelectorAll('[role=meter]').length + ' meters');

  finish(fail ? 1 : 0);
});
