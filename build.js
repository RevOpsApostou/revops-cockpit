// Build do RevOps Cockpit: compila o JSX (app.jsx) e injeta o resultado no <script id="app-bundle"> do index.html.
// O index.html servido NÃO carrega o Babel — o JSX já vem transformado (React.createElement, runtime clássico).
// Fonte da verdade = app.jsx. NÃO editar o bundle dentro do index.html à mão.
//
// Uso:  node build.js       (rodar antes de todo deploy, depois de editar app.jsx)
// Requer:  npm install      (instala @babel/standalone, devDependency)
const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const DIR = __dirname;
const jsx = fs.readFileSync(path.join(DIR, 'app.jsx'), 'utf8');

// runtime CLÁSSICO (React.createElement) — não emite `import ... from "react/jsx-runtime"`, que quebraria
// num <script> comum sem módulos. É exatamente o que o Babel Standalone fazia em runtime com <script type="text/babel">.
const { code } = Babel.transform(jsx, { presets: [['react', { runtime: 'classic' }]] });

// guarda contra a pegadinha do </script> aparecendo literalmente no bundle (fecharia a tag cedo)
if (code.includes('</script')) throw new Error('bundle contém "</script" literal — abortando (quebraria a tag)');

const IDX = path.join(DIR, 'index.html');
let html = fs.readFileSync(IDX, 'utf8');
const openTag = '<script id="app-bundle">';
const i = html.indexOf(openTag);
if (i < 0) throw new Error('marcador <script id="app-bundle"> não encontrado no index.html');
const j = html.indexOf('</script>', i);
if (j < 0) throw new Error('</script> de fechamento do bundle não encontrado');

const header = '\n// GERADO por build.js a partir de app.jsx — NÃO EDITAR AQUI. Edite app.jsx e rode: node build.js\n';
html = html.slice(0, i + openTag.length) + header + code + '\n' + html.slice(j);
fs.writeFileSync(IDX, html, 'utf8');

console.log(`build ok — app.jsx ${jsx.length}B → bundle ${code.length}B | index.html ${html.length}B`);
