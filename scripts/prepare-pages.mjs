import { readFileSync, writeFileSync } from 'node:fs';
const base = (process.env.EXPO_BASE_URL || '').replace(/\/$/, '');
let html = readFileSync('dist/index.html', 'utf8');
const restore = `<script>(function(){var p=new URLSearchParams(location.search).get('__route');if(p&&p.charAt(0)==='/'&&p.slice(0,2)!=='//'){history.replaceState(null,'',${JSON.stringify(base)}+p)}})();</script>`;
html = html.replace('<head>', '<head>' + restore);
writeFileSync('dist/index.html', html);
const redirect = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Voyz Friends</title><body><p>Открываем Voyz Friends…</p><script>var b=${JSON.stringify(base)};var p=location.pathname.slice(b.length)+location.search+location.hash;location.replace(b+'/?__route='+encodeURIComponent(p));</script></body></html>`;
writeFileSync('dist/404.html', redirect);
writeFileSync('dist/.nojekyll', '');
