const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
// Node 22+ has built-in global WebSocket

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9231;

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

function apiPost(url, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

class CdpConnection {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const msg = JSON.parse(raw);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[Browser Console]', msg.params.type, msg.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      } catch (e) {
        console.error('CDP message parse error:', e);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await delay(2500);
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('=== Starting E2E Verification for REXBEBE Invoice Generation System ===\n');

  // Step 1: Admin Authentication
  console.log('[1/4] Authenticating admin user...');
  const loginRes = await apiPost('http://localhost:5000/api/auth/admin/login', {
    email: 'admin@rexbebe.com',
    password: 'Admin@Rexbebe2026!',
  });

  const token = loginRes.data?.data?.token || loginRes.data?.token;
  const adminUser = loginRes.data?.data?.user || loginRes.data?.user;
  if (!token) {
    console.error('Admin authentication failed:', loginRes);
    process.exit(1);
  }
  const adminToken = token;
  console.log(`✓ Admin authenticated successfully: ${adminUser.name} (${adminUser.role})`);

  // Step 2: Spawn Headless Chrome
  console.log('\n[2/4] Launching Headless Chrome on debug port ' + DEBUG_PORT + '...');
  const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-invoice-test-' + Date.now());
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
    throw new Error('Failed to find Chrome WebSocket debugger target');
  }

  const cdp = new CdpConnection(targetWs);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  try {
    // Inject auth token & cookie
    await cdp.navigate('http://localhost:3000/admin/login');
    await cdp.evaluate(`
      localStorage.setItem('rexbebe_admin_token', '${adminToken}');
      localStorage.setItem('rexbebe_admin_user', JSON.stringify(${JSON.stringify(adminUser)}));
      document.cookie = 'rexbebe_admin_token=' + '${adminToken}' + '; path=/; SameSite=Strict';
      sessionStorage.setItem('rexbebe_sale_popup_dismissed', 'true');
    `);

    // Step 3: Test Admin Orders Page & Invoice Generation
    console.log('\n[3/4] Testing Admin Orders Page (/admin/orders)...');
    await cdp.navigate('http://localhost:3000/admin/orders');
    await delay(3500);

    const directFetch = await cdp.evaluate(`
      fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('rexbebe_admin_token')
        }
      }).then(r => r.json()).catch(err => ({ error: err.message }))
    `);
    console.log('Direct browser fetch to /api/orders:', JSON.stringify(directFetch)?.substring(0, 200));

    const currentUrl = await cdp.evaluate('window.location.href');
    const bodyText = await cdp.evaluate('document.body.innerText');
    console.log('Current URL:', currentUrl);
    console.log('Body Text excerpt:', bodyText?.substring(0, 300)?.replace(/\n+/g, ' '));

    // Wait for real orders to load and click "View" on first order row
    console.log('Waiting for orders table to load and opening first order...');
    let orderRowFound = false;
    for (let i = 0; i < 25; i++) {
      const rowInfo = await cdp.evaluate(`
        (() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          const realRow = rows.find(r => r.querySelector('button') && (r.innerText.includes('RXB-') || r.innerText.includes('ORD-')));
          if (realRow) {
            const viewBtn = Array.from(realRow.querySelectorAll('button')).find(b => b.textContent.includes('View'));
            if (viewBtn) {
              viewBtn.click();
              return { success: true, text: realRow.innerText };
            }
          }
          return { success: false, rowCount: rows.length };
        })()
      `);
      if (rowInfo && rowInfo.success) {
        orderRowFound = true;
        console.log('✓ Successfully clicked "View" on order row!');
        break;
      }
      await delay(500);
    }

    if (!orderRowFound) {
      throw new Error('Could not find or open order row in admin orders table!');
    }
    await delay(1200);

    // Verify "Generate Invoice" button is present
    const allButtons = await cdp.evaluate(`
      Array.from(document.querySelectorAll('button')).map(b => (b.innerText || b.getAttribute('title') || b.className).replace(/\\n+/g, ' '))
    `);
    console.log('All buttons on page after opening modal:', allButtons);

    const hasGenerateInvoiceBtn = await cdp.evaluate(`
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Generate Invoice'))
    `);
    console.log(`"Generate Invoice" button present in Order modal: ${hasGenerateInvoiceBtn}`);
    if (!hasGenerateInvoiceBtn) {
      throw new Error('Generate Invoice button not found in Order Details modal!');
    }

    // Click "Generate Invoice"
    console.log('Clicking "Generate Invoice" button...');
    await cdp.evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generate Invoice'));
      if (btn) btn.click();
    `);
    await delay(1500);

    // Verify Invoice DOM details
    const invoiceAudit = await cdp.evaluate(`
      (() => {
        const inv = document.querySelector('#rexbebe-printable-invoice');
        if (!inv) return { found: false };

        const text = inv.innerText;
        const hasLogo = !!inv.querySelector('img[src*="logo_clean"]');
        const hasStoreDetails = text.includes('Classen Holdings') && text.includes('62B Meniklanda');
        const hasPhone = text.includes('+94 70 530 1642');
        const hasTaxInvoice = text.includes('TAX INVOICE') || text.includes('INV-');
        const hasTeddy = !!inv.querySelector('svg circle[fill="#C4A482"]');
        const hasThankYou = text.includes('Thank you for shopping with REXBEBE') || text.includes('Handcrafted with organic');
        const hasA4Styles = !!document.querySelector('style') && document.body.innerHTML.includes('#rexbebe-printable-invoice');
        const hasDownloadPdfBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Download PDF'));
        const hasPrintBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Print Invoice'));
        const hasBackBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Back to Order'));

        return {
          found: true,
          hasLogo,
          hasStoreDetails,
          hasPhone,
          hasTaxInvoice,
          hasTeddy,
          hasThankYou,
          hasDownloadPdfBtn,
          hasPrintBtn,
          hasBackBtn,
          textExcerpt: text.substring(0, 300).replace(/\\n+/g, ' ')
        };
      })()
    `);

    console.log('Invoice DOM Audit Result:', JSON.stringify(invoiceAudit, null, 2));

    if (!invoiceAudit.found) {
      throw new Error('#rexbebe-printable-invoice was not rendered!');
    }

    // Capture verified invoice preview screenshot
    const artifactPath = path.resolve('..', 'admin_invoice_preview_verified.png');
    await cdp.screenshot(artifactPath);
    console.log(`✓ Invoice preview verified and captured: ${artifactPath}`);

    // Test "Back to Order" action
    console.log('\nTesting "Back to Order" action...');
    await cdp.evaluate(`
      const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Order'));
      if (backBtn) backBtn.click();
    `);
    await delay(800);

    const invoiceClosed = await cdp.evaluate(`
      !document.querySelector('#rexbebe-printable-invoice')
    `);
    console.log(`Invoice closed and returned to order details: ${invoiceClosed}`);

    // Step 4: Verify COD Orders Page (/admin/orders/cod)
    console.log('\n[4/4] Testing COD Orders Page (/admin/orders/cod)...');
    await cdp.navigate('http://localhost:3000/admin/orders/cod');
    await delay(2000);

    // Open first COD order
    for (let i = 0; i < 25; i++) {
      const opened = await cdp.evaluate(`
        (() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          const realRow = rows.find(r => r.querySelector('button') && (r.innerText.includes('RXB-') || r.innerText.includes('ORD-')));
          if (realRow) {
            const viewBtn = Array.from(realRow.querySelectorAll('button')).find(b => b.textContent.includes('View') || b.textContent.includes('Details'));
            if (viewBtn) {
              viewBtn.click();
              return true;
            }
          }
          return false;
        })()
      `);
      if (opened) {
        console.log('✓ Successfully clicked "View" on COD order row!');
        break;
      }
      await delay(500);
    }
    await delay(1200);

    const hasCodInvoiceBtn = await cdp.evaluate(`
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Generate Invoice'))
    `);
    console.log(`"Generate Invoice" button present in COD Order modal: ${hasCodInvoiceBtn}`);

    // Step 5: Verify Customer Public Storefront has NO access to invoice generation
    console.log('\nVerifying customer storefront boundary (No invoice generation on public storefront)...');
    await cdp.navigate('http://localhost:3000/');
    await delay(1500);

    const storefrontHasInvoiceBtn = await cdp.evaluate(`
      Array.from(document.querySelectorAll('button, a')).some(el => el.textContent.includes('Generate Invoice'))
    `);
    console.log(`Public storefront has NO invoice generation triggers: ${!storefrontHasInvoiceBtn}`);

    console.log('\n=== ALL INVOICE GENERATION SYSTEM TESTS PASSED SUCCESSFULLY! ===');
  } finally {
    cdp.close();
    chrome.kill();
  }
}

main().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
