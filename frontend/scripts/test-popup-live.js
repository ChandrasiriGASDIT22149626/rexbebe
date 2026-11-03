const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9225;

async function run() {
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-test-' + Date.now();
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
  console.log('Navigated to http://localhost:3000 (Mobile 400x608). Polling for Sale Popup...');

  let popupFound = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const chk = await send('Runtime.evaluate', {
      expression: `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return {
          found: !!dialog,
          text: dialog ? dialog.innerText.slice(0, 150).replace(/\\n/g, ' ') : ''
        };
      })()`,
      returnByValue: true,
    });
    console.log(`Poll ${i + 1}:`, chk.result?.value);
    if (chk.result?.value?.found) {
      popupFound = true;
      break;
    }
  }

  // Small delay for CSS / framer-motion entrance animation to finish
  await new Promise((r) => setTimeout(r, 600));

  const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
  if (snapMobile.result?.data) {
    fs.writeFileSync('sale_popup_mobile_verified.png', Buffer.from(snapMobile.result.data, 'base64'));
    console.log('Saved sale_popup_mobile_verified.png');
  }

  // Desktop test
  console.log('\nSwitching to Desktop Viewport (1280x800)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 800));

  const snapDesktop = await send('Page.captureScreenshot', { format: 'png' });
  if (snapDesktop.result?.data) {
    fs.writeFileSync('sale_popup_desktop_verified.png', Buffer.from(snapDesktop.result.data, 'base64'));
    console.log('Saved sale_popup_desktop_verified.png');
  }

  ws.close();
  chrome.kill();
  console.log('\nDone!');
}

run().catch(console.error);

