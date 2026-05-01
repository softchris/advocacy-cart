const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const URL = 'https://softchris.github.io/advocacy-cart/';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Loading game...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // 1. Main menu
  console.log('Screenshot: main menu');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-main-menu.png') });

  // 2. Click New Race
  console.log('Clicking New Race...');
  await page.click('[data-action="race"]');
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-mode-select.png') });

  // 3. Select 1 Player
  console.log('Selecting 1 Player...');
  await page.click('.mode-option');
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-character-select.png') });

  // 4. Select character (click confirm)
  console.log('Confirming character...');
  await page.click('#char-confirm');
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-cart-select.png') });

  // 5. Select cart
  console.log('Confirming cart...');
  await page.click('#cart-confirm');
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-color-select.png') });

  // 6. Select color
  console.log('Confirming color...');
  await page.click('#color-confirm');
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-level-select.png') });

  // 7. Select level & start race
  console.log('Confirming level...');
  await page.click('#level-confirm');
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-countdown.png') });

  // 8. Wait for race to start, take gameplay shots
  await sleep(4000);
  console.log('Screenshot: gameplay');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-gameplay.png') });

  // 9. Accelerate for a bit and take another shot with thrusters
  await page.keyboard.down('ArrowUp');
  await sleep(2000);
  console.log('Screenshot: racing with thrusters');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-racing-thrusters.png') });

  // 10. Keep racing, take a shot with HUD visible
  await sleep(3000);
  console.log('Screenshot: HUD and leaderboard');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-hud-leaderboard.png') });
  await page.keyboard.up('ArrowUp');

  // 11. Take the editor screenshot
  console.log('Loading editor...');
  const editorPage = await context.newPage();
  await editorPage.goto(URL.replace('index.html', '') + 'editor/editor.html', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  console.log('Screenshot: level editor');
  await editorPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-level-editor.png') });
  await editorPage.close();

  await browser.close();
  console.log(`\nDone! ${fs.readdirSync(SCREENSHOTS_DIR).length} screenshots saved to screenshots/`);
})();
