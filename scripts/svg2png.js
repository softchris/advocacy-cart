const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  const svg = fs.readFileSync('assets/photos/ducky.svg', 'utf8');
  const html = `<html><body style="margin:0;padding:0;background:#0d1117">${svg}</body></html>`;
  await page.setContent(html);
  await page.screenshot({ path: 'assets/photos/ducky.png', clip: { x: 0, y: 0, width: 400, height: 400 } });
  await browser.close();
  console.log('Ducky PNG saved:', fs.statSync('assets/photos/ducky.png').size, 'bytes');
})();
