const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Starting Complete Sale Popup & Storefront Verification ---');
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-popup-' + Date.now();
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

  let targetWs = null;
  for (let i = 0; i < 30; i++) {
    await delay(300);
    try {
      const list = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const pageTarget = list.find((t) => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        targetWs = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!targetWs) {
    chrome.kill();
    throw new Error('Failed to connect to Chrome CDP.');
  }

  const ws = new WebSocket(targetWs);
  await new Promise((res) => ws.addEventListener('open', res, { once: true }));

  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString();
    const data = JSON.parse(raw);

    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const text = data.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      if (type === 'error') {
        consoleErrors.push(`[Console ERROR]: ${text}`);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const text = data.params.exceptionDetails?.text || '';
      const desc = data.params.exceptionDetails?.exception?.description || '';
      consoleErrors.push(`[Uncaught Exception]: ${text} ${desc}`);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          resolve({ error: 'Timeout' });
        }
      }, 10000);
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // 1. MOBILE VERIFICATION (400x608)
  console.log('\n[1/3] Testing Mobile Storefront & Sale Popup (400x608)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 400,
    height: 608,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await delay(4000); // Wait for page hydration & popup display timer (2000ms delay)

  const mobileEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const popup = document.querySelector('[role="dialog"]') || document.querySelector('.bg-slate-950\\\\/70') || document.querySelector('.fixed.inset-0.z-50');
      const heading = document.body.innerText.includes('LITTLE ONES SALE!') || document.body.innerText.includes('SPECIAL OFFER');
      const code = document.body.innerText.includes('LITTLE20');
      const discount = document.body.innerText.includes('20% OFF');
      return {
        popupFound: !!popup,
        headingFound: heading,
        codeFound: code,
        discountFound: discount,
        htmlSnippet: popup ? popup.innerText.slice(0, 200) : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Mobile popup check result:', mobileEval.result?.value);

  // Take Mobile Screenshot
  const mobileScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (mobileScreenshot.result?.data) {
    fs.writeFileSync('sale_popup_mobile_verified.png', Buffer.from(mobileScreenshot.result.data, 'base64'));
    console.log('Saved sale_popup_mobile_verified.png');
  }

  // Click Copy Code button
  const copyClickEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Copy Code'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true,
  });
  console.log('Copy code button clicked:', copyClickEval.result?.value);
  await delay(600);

  const copiedStateEval = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        copiedFeedback: document.body.innerText.includes('Copied! ✨'),
        stagedPromo: sessionStorage.getItem('rexbebe_applied_promo')
      };
    })()`,
    returnByValue: true,
  });
  console.log('Copy feedback & sessionStorage check:', copiedStateEval.result?.value);

  // 2. DESKTOP VERIFICATION (1280x800)
  console.log('\n[2/3] Testing Desktop Storefront & Split Layout Popup (1280x800)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Clear session storage so popup appears again
  await send('Runtime.evaluate', {
    expression: `sessionStorage.clear()`,
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await delay(4000);

  const desktopScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (desktopScreenshot.result?.data) {
    fs.writeFileSync('sale_popup_desktop_verified.png', Buffer.from(desktopScreenshot.result.data, 'base64'));
    console.log('Saved sale_popup_desktop_verified.png');
  }

  // 3. ADMIN PROMOTIONAL POPUP MANAGEMENT VERIFICATION
  console.log('\n[3/3] Testing Admin Promotional Popup Management (/admin/promotions)...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/promotions' });
  await delay(3500);

  const adminEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const hasPopupTab = document.body.innerText.includes('Promotional Popup');
      const hasHeadingInput = !!document.querySelector('input[value*="LITTLE ONES"]');
      const hasCodeInput = !!document.querySelector('input[value*="LITTLE20"]');
      const hasLivePreviewBtn = document.body.innerText.includes('Live Preview');
      const hasSaveBtn = document.body.innerText.includes('Save & Publish');
      return {
        hasPopupTab,
        hasHeadingInput,
        hasCodeInput,
        hasLivePreviewBtn,
        hasSaveBtn
      };
    })()`,
    returnByValue: true,
  });
  console.log('Admin management check result:', adminEval.result?.value);

  const adminScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (adminScreenshot.result?.data) {
    fs.writeFileSync('admin_promotions_verified.png', Buffer.from(adminScreenshot.result.data, 'base64'));
    console.log('Saved admin_promotions_verified.png');
  }

  console.log('\n--- Console Errors Encountered ---');
  if (consoleErrors.length === 0) {
    console.log('ZERO console errors or unhandled exceptions! Clean hydration!');
  } else {
    consoleErrors.forEach((e) => console.log(e));
  }

  ws.close();
  chrome.kill();
  console.log('\nVerification complete!');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
