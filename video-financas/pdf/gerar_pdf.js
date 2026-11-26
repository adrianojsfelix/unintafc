// Gera o PDF de apoio a partir de guia.html (Chromium headless via Playwright).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'guia.html'));
  await p.pdf({ path: path.join(__dirname, '..', 'saida', 'Saindo-do-Vermelho-guia.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
