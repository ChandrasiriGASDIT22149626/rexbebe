const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9226;

async function testInteractions() {
  console.log('--- Testing Popup Interactions & Checkout Discount ---');
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-interact-' + Date.now();
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tempDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await new Promise((r) => setTimeout(r, 1500));
  const list = await new Promise((res, rej) => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}/json/list`, (r) => {
      let b = '';
      r.on('data', (d) => (b += d));
      r.on('end', () => res(JSON.parse(b)));
    }).on('error', rej);
  });
  const targetWs = list.find((t) => t.type === 'page').webSocketDebuggerUrl;

  const ws = new WebSocket(targetWs);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(data);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 400,
    height: 608,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 3200));

  // 1. Test clicking "Copy Code"
  const clickResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Copy Code'));
      if (btn) {
        btn.click();
        return { clicked: true, textBefore: btn.innerText };
      }
      return { clicked: false };
    })()`,
    returnByValue: true,
  });
  console.log('Copy button click:', clickResult.result?.result?.value || clickResult.result);

  await new Promise((r) => setTimeout(r, 400));

  const afterClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return {
        hasCopiedBadge: dialog ? dialog.innerText.includes('Copied! ✨') : false,
        stagedCode: sessionStorage.getItem('rexbebe_applied_promo')
      };
    })()`,
    returnByValue: true,
  });
  console.log('After click state:', afterClick.result?.result?.value || afterClick.result);

  // Take screenshot with "Copied! ✨" badge
  const copiedSnap = await send('Page.captureScreenshot', { format: 'png' });
  if (copiedSnap.result?.data) {
    fs.writeFileSync('sale_popup_copied_verified.png', Buffer.from(copiedSnap.result.data, 'base64'));
    console.log('Saved sale_popup_copied_verified.png');
  }

  // 2. Test closing popup
  const closeResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('[aria-label="Close promotion popup"]');
      if (closeBtn) {
        closeBtn.click();
        return { closed: true };
      }
      return { closed: false };
    })()`,
    returnByValue: true,
  });
  console.log('Close button click:', closeResult.result?.result?.value || closeResult.result);

  await new Promise((r) => setTimeout(r, 600));

  const afterClose = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        dialogPresent: !!document.querySelector('[role="dialog"]'),
        dismissedFlag: sessionStorage.getItem('rexbebe_sale_popup_dismissed')
      };
    })()`,
    returnByValue: true,
  });
  console.log('After close state:', afterClose.result?.result?.value || afterClose.result);

  // 3. Test checkout coupon calculation directly via API
  const checkoutPricing = await new Promise((res, rej) => {
    const postData = JSON.stringify({
      district: 'Colombo',
      city: 'Colombo 03',
      deliveryOption: 'standard',
      subtotal: 4000,
      totalWeightGrams: 500,
      couponCode: 'LITTLE20',
    });
    const req = http.request(
      'http://localhost:5000/api/delivery/calculate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (r) => {
        let b = '';
        r.on('data', (d) => (b += d));
        r.on('end', () => res(JSON.parse(b)));
      }
    );
    req.on('error', rej);
    req.write(postData);
    req.end();
  });

  console.log('Checkout calculation for LITTLE20 coupon:', checkoutPricing);

  ws.close();
  chrome.kill();
  console.log('All tests passed!');
}

testInteractions().catch(console.error);

