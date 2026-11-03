const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9224;

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

async function verifyCart() {
  console.log('--- Launching Chrome to Verify Cart Drawer & Cart Page ---');
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-cart-' + Date.now();
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
      const pageTarget = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
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
  let idCounter = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const timeout = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          resolve({ timeout: true });
        }
      }, 8000);
      pending.set(id, { resolve: (res) => { clearTimeout(timeout); resolve(res); }, reject: (err) => { clearTimeout(timeout); reject(err); } });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  try {
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 400,
      height: 608,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' },
    });

    console.log('1. Navigating to http://localhost:3000 ...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await delay(3000);

    // Seed 1 item in cart via localStorage
    console.log('2. Seeding sample cart item (Pooh Honey Time, 400 LKR) ...');
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const sampleItem = [
            {
              productId: 'prod-1792938412601',
              variantId: 'var-pooh-s-honey-time-06months-Red',
              quantity: 1
            }
          ];
          localStorage.setItem('rexbebe_cart_items_v2', JSON.stringify(sampleItem));
        })()
      `,
    });

    // Reload so useCart loads the item
    console.log('3. Reloading page to hydrate cart ...');
    await sendCommand('Page.reload');
    await delay(3000);

    // Open Cart Drawer
    console.log('4. Opening Cart Drawer ...');
    const clickCart = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label*="Shopping Cart"], button[title*="Shopping Cart"]');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true,
    });
    console.log('Found & clicked cart button:', clickCart.result.value);
    await delay(1200);

    // Inspect Cart Drawer DOM
    const drawerEvaluation = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const drawer = document.querySelector('[class*="rounded-l-3xl"]') || document.body;

          const text = drawer.innerText;
          const hasComplimentary = text.includes('Complimentary Shipping');
          const has1500 = text.includes('1,500') || text.includes('1500');
          const hasSubtotal = text.includes('Subtotal');
          const hasTotal = text.includes('Total');
          const hasViewCart = text.includes('VIEW CART');
          const hasCheckout = text.includes('CHECKOUT');

          return {
            text,
            hasComplimentary,
            has1500,
            hasSubtotal,
            hasTotal,
            hasViewCart,
            hasCheckout
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n--- Cart Drawer Inspection Results ---');
    console.log('Complimentary Shipping present:', drawerEvaluation.result.value.hasComplimentary ? '❌ YES (FAIL)' : '✅ NO (PASSED)');
    console.log('1,500 fee present:             ', drawerEvaluation.result.value.has1500 ? '❌ YES (FAIL)' : '✅ NO (PASSED)');
    console.log('Subtotal present:              ', drawerEvaluation.result.value.hasSubtotal ? '✅ YES' : '❌ NO');
    console.log('Total present:                 ', drawerEvaluation.result.value.hasTotal ? '✅ YES' : '❌ NO');
    console.log('VIEW CART button present:      ', drawerEvaluation.result.value.hasViewCart ? '✅ YES' : '❌ NO');
    console.log('CHECKOUT button present:       ', drawerEvaluation.result.value.hasCheckout ? '✅ YES' : '❌ NO');
    console.log('Full Drawer Text:\n' + drawerEvaluation.result.value.text);

    // Take Drawer Screenshot
    const drawerScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.resolve(__dirname, '../../cart_drawer_verified.png'),
      Buffer.from(drawerScreenshot.data, 'base64')
    );
    console.log('Saved screenshot: cart_drawer_verified.png');

    // 5. Navigate to full /cart page
    console.log('\n5. Navigating to full Cart page (http://localhost:3000/cart) ...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000/cart' });
    await delay(3000);

    const cartPageEvaluation = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const hasComplimentary = bodyText.includes('Complimentary');
          const hasEstimatedShipping = bodyText.includes('Estimated Shipping');
          const has1500 = bodyText.includes('1,500') || bodyText.includes('1500');
          const hasSubtotal = bodyText.includes('Subtotal');
          const hasTotal = bodyText.includes('Total');

          const summaryCard = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('Order Summary'));
          const summaryText = summaryCard ? summaryCard.innerText : '';

          return {
            hasComplimentary,
            hasEstimatedShipping,
            has1500,
            hasSubtotal,
            hasTotal,
            summaryText
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n--- Full Cart Page Inspection Results ---');
    console.log('Complimentary text present:    ', cartPageEvaluation.result.value.hasComplimentary ? '❌ YES (FAIL)' : '✅ NO (PASSED)');
    console.log('Estimated Shipping present:    ', cartPageEvaluation.result.value.hasEstimatedShipping ? '❌ YES (FAIL)' : '✅ NO (PASSED)');
    console.log('1,500 fee present:             ', cartPageEvaluation.result.value.has1500 ? '❌ YES (FAIL)' : '✅ NO (PASSED)');
    console.log('Subtotal present:              ', cartPageEvaluation.result.value.hasSubtotal ? '✅ YES' : '❌ NO');
    console.log('Total present:                 ', cartPageEvaluation.result.value.hasTotal ? '✅ YES' : '❌ NO');
    console.log('Summary card text:\n', cartPageEvaluation.result.value.summaryText);

    const cartPageScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.resolve(__dirname, '../../cart_page_verified.png'),
      Buffer.from(cartPageScreenshot.data, 'base64')
    );
    console.log('Saved screenshot: cart_page_verified.png');

    return {
      drawer: drawerEvaluation.result.value,
      page: cartPageEvaluation.result.value,
    };
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifyCart().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
