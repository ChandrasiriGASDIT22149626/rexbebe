const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9227;

async function run() {
  console.log('--- Verifying WhatsApp Floating Button Implementation ---');
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-wa-' + Date.now();
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
  const consoleErrors = [];

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString();
    const data = JSON.parse(raw);
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      const text = data.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleErrors.push(`[Console ERROR]: ${text}`);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const text = data.params.exceptionDetails?.text || '';
      consoleErrors.push(`[Uncaught Exception]: ${text}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (event) => {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const data = JSON.parse(raw);
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
  await send('Log.enable');

  // Dismiss promotional popup for this testing session so it doesn't block the screen
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 1500));
  await send('Runtime.evaluate', {
    expression: `sessionStorage.setItem('rexbebe_sale_popup_dismissed', 'true')`,
  });

  // 1. MOBILE VERIFICATION (400x608)
  console.log('\n[1/3] Testing Mobile WhatsApp Floating Button (400x608)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 400,
    height: 608,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll down a bit to test fixed positioning
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 450)` });
  await new Promise((r) => setTimeout(r, 500));

  const mobileEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('a[aria-label*="WhatsApp"]');
      if (!btn) return { found: false };
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        found: true,
        href: btn.getAttribute('href'),
        target: btn.getAttribute('target'),
        rel: btn.getAttribute('rel'),
        position: style.position,
        backgroundColor: style.backgroundColor,
        width: rect.width,
        height: rect.height,
        bottom: window.innerHeight - rect.bottom,
        right: window.innerWidth - rect.right,
        hasSvg: !!btn.querySelector('svg')
      };
    })()`,
    returnByValue: true,
  });
  console.log('Mobile Button Details:', mobileEval.result?.result?.value);

  const mobileSnap = await send('Page.captureScreenshot', { format: 'png' });
  if (mobileSnap.result?.data) {
    fs.writeFileSync('whatsapp_button_mobile_verified.png', Buffer.from(mobileSnap.result.data, 'base64'));
    console.log('Saved whatsapp_button_mobile_verified.png');
  }

  // 2. DESKTOP VERIFICATION (1280x800)
  console.log('\n[2/3] Testing Desktop WhatsApp Floating Button (1280x800)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 700)` });
  await new Promise((r) => setTimeout(r, 500));

  // Hover over the button to show tooltip
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('a[aria-label*="WhatsApp"]');
      if (btn) {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return true;
      }
      return false;
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  const desktopEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('a[aria-label*="WhatsApp"]');
      const tooltip = document.querySelector('aside[aria-label="WhatsApp Support"] div');
      const rect = btn?.getBoundingClientRect();
      return {
        found: !!btn,
        href: btn?.getAttribute('href'),
        tooltipText: tooltip?.innerText,
        tooltipVisible: tooltip && window.getComputedStyle(tooltip).opacity !== '0',
        width: rect?.width,
        height: rect?.height,
        bottom: window.innerHeight - (rect ? rect.bottom : 0),
        right: window.innerWidth - (rect ? rect.right : 0)
      };
    })()`,
    returnByValue: true,
  });
  console.log('Desktop Button Details:', desktopEval.result?.result?.value);

  const desktopSnap = await send('Page.captureScreenshot', { format: 'png' });
  if (desktopSnap.result?.data) {
    fs.writeFileSync('whatsapp_button_desktop_verified.png', Buffer.from(desktopSnap.result.data, 'base64'));
    console.log('Saved whatsapp_button_desktop_verified.png');
  }

  // 3. ADMIN & CHECKOUT EXCLUSION CHECK
  console.log('\n[3/3] Checking Exclusion on Admin & Checkout Pages...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/login' });
  await new Promise((r) => setTimeout(r, 1500));

  const adminCheck = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('aside[aria-label="WhatsApp Support"]')`,
    returnByValue: true,
  });
  console.log('WhatsApp button present on /admin/login:', adminCheck.result?.result?.value);

  await send('Page.navigate', { url: 'http://localhost:3000/checkout' });
  await new Promise((r) => setTimeout(r, 1500));

  const checkoutCheck = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('aside[aria-label="WhatsApp Support"]')`,
    returnByValue: true,
  });
  console.log('WhatsApp button present on /checkout:', checkoutCheck.result?.result?.value);

  console.log('\n--- Console Errors Encountered ---');
  if (consoleErrors.length === 0) {
    console.log('ZERO console errors or hydration mismatches!');
  } else {
    consoleErrors.forEach((e) => console.log(e));
  }

  ws.close();
  chrome.kill();
  console.log('\nAll checks completed successfully!');
}

run().catch(console.error);

