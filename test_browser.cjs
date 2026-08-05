const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  // Login as a normal user
  await page.goto('http://localhost:5173/#/auth');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({
      id: "normal_user_123",
      username: "normalUser",
      total_depositado: 0,
      creditos_escritura: 0,
      wallets: {}
    }));
    window.location.hash = '#/wallet';
  });

  await page.waitForTimeout(2000);
  console.log('--- WALLET HTML ---');
  // just check if wallet-content is there
  const walletHtml = await page.evaluate(() => {
    const el = document.getElementById('wallet-content');
    return el ? el.innerHTML.substring(0, 500) : 'NO WALLET CONTENT';
  });
  console.log(walletHtml);

  // Now go to play
  await page.evaluate(() => {
    window.location.hash = '#/play';
  });
  await page.waitForTimeout(2000);
  console.log('--- PLAY HTML ---');
  const playHtml = await page.evaluate(() => {
    const el = document.querySelector('.play-page') || document.querySelector('.home-page');
    return el ? el.innerHTML.substring(0, 500) : 'NO PLAY CONTENT';
  });
  console.log(playHtml);

  await browser.close();
})();
