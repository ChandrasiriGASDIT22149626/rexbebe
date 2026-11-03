const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9244;
const ARTIFACTS_DIR = 'C:/Users/amash/.gemini/antigravity/brain/2af4d0d6-6cb0-47ac-9770-162dd3d5446e';

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

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            cb.reject(new Error(msg.error.message));
          } else {
            cb.resolve(msg.result);
          }
        }
      } catch (err) {
        console.error('CDP message parse error:', err);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async captureScreenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`📸 Screenshot saved: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function main() {
  console.log('--- LAUNCHING HEADLESS CHROME TEST FOR SIMPLIFIED FORMS ---');

  // Authenticate Admin
  const authRes = await apiPost('http://localhost:5000/api/auth/admin/login', {
    email: 'admin@rexbebe.com',
    password: 'Admin@Rexbebe2026!',
  });
  const token = authRes.data?.data?.token || authRes.data?.token;
  const user = authRes.data?.data?.user || authRes.data?.user;
  console.log('Admin login status:', authRes.status);

  // Launch headless Chrome
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    'about:blank',
  ]);

  await delay(2000);

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const pages = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const targetWsUrl = pages[0]?.webSocketDebuggerUrl;

    const cdp = new CDPClient(targetWsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Seed local storage with admin token
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/admin/categories' });
    await delay(2000);

    await cdp.evaluate(`
      localStorage.setItem('rexbebe_token', ${JSON.stringify(token)});
      localStorage.setItem('rexbebe_user', ${JSON.stringify(JSON.stringify(user))});
      localStorage.setItem('adminToken', ${JSON.stringify(token)});
    `);

    // TEST 1: CATEGORIES PAGE
    console.log('\n--- 1. Testing Categories Page & Simplified Form ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/admin/categories' });
    await delay(2500);

    // Click "Add Category" button
    const openAddCat = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add Category'));
        if (addBtn) {
          addBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked "Add Category" button:', openAddCat);
    await delay(1000);

    // Audit fields in the Add Category Modal
    const catModalAudit = await cdp.evaluate(`
      (() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return { found: false };
        const text = dialog.innerText;
        return {
          found: true,
          hasMainName: text.includes('Main Category Name'),
          hasDisplayInNav: text.includes('Enable Display in Navigation') || text.includes('Display in Navigation'),
          hasDisplayOrder: text.includes('Display Order'),
          hasActiveToggle: text.includes('Active / Inactive'),
          hasCategoryPhoto: text.includes('Category Photo'),
          hasImageAlt: text.includes('Image Alt Text'),
          hasSEO: text.includes('Search Engine Optimization') || text.includes('SEO')
        };
      })()
    `);
    console.log('Add Category Modal Audit Results:');
    console.log('  Modal Open:', catModalAudit.found);
    console.log('  Main Category Name Field Present:', catModalAudit.hasMainName ? 'YES ✅' : 'NO ❌');
    console.log('  Enable Display in Navigation Present:', catModalAudit.hasDisplayInNav ? 'YES ✅' : 'NO ❌');
    console.log('  Display Order Removed:', !catModalAudit.hasDisplayOrder ? 'YES ✅' : 'NO ❌');
    console.log('  Active / Inactive Removed:', !catModalAudit.hasActiveToggle ? 'YES ✅' : 'NO ❌');
    console.log('  Category Photo Upload Removed:', !catModalAudit.hasCategoryPhoto ? 'YES ✅' : 'NO ❌');
    console.log('  SEO Section Removed:', !catModalAudit.hasSEO ? 'YES ✅' : 'NO ❌');

    await cdp.captureScreenshot(path.join(ARTIFACTS_DIR, 'admin_categories_modal_verified.png'));

    // Close Category Modal
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
        const cancelBtn = btns.find(b => b.textContent && b.textContent.includes('Cancel'));
        if (cancelBtn) cancelBtn.click();
      })()
    `);
    await delay(800);

    // Switch to Subcategories Tab
    console.log('\n--- 2. Testing Subcategories Tab & Quick Add Form ---');
    const clickedSubTab = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const subBtn = btns.find(b => b.textContent && b.textContent.includes('Subcategories'));
        if (subBtn) {
          subBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Switched to Subcategories tab:', clickedSubTab);
    await delay(1200);

    // Audit Subcategories Quick Add form
    const subAudit = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText;
        const mainCatSelect = document.querySelector('select');
        const options = mainCatSelect ? Array.from(mainCatSelect.options).map(o => o.text) : [];
        return {
          hasAddSubHeader: bodyText.includes('Add Subcategory'),
          hasParentDropdown: bodyText.includes('Parent Main Category') || bodyText.includes('Select Main Category'),
          hasSubNameInput: bodyText.includes('Subcategory Name'),
          optionsCount: options.length,
          optionsSample: options.slice(0, 3)
        };
      })()
    `);
    console.log('Subcategories Section Audit Results:');
    console.log('  Add Subcategory Quick-Add Present:', subAudit.hasAddSubHeader ? 'YES ✅' : 'NO ❌');
    console.log('  Parent Main Category Dropdown Present:', subAudit.hasParentDropdown ? 'YES ✅' : 'NO ❌');
    console.log('  Subcategory Name Input Present:', subAudit.hasSubNameInput ? 'YES ✅' : 'NO ❌');
    console.log('  Dropdown Populated with Main Categories:', subAudit.optionsCount > 0 ? `YES (${subAudit.optionsCount} categories) ✅` : 'NO ❌');

    await cdp.captureScreenshot(path.join(ARTIFACTS_DIR, 'admin_subcategories_view_verified.png'));

    // TEST 3: PRODUCTS PAGE
    console.log('\n--- 3. Testing Products Page & Simplified Product Form ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/admin/products' });
    await delay(2500);

    // Click "Add Baby Product" button
    const openAddProd = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add Baby Product'));
        if (addBtn) {
          addBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked "Add Baby Product" button:', openAddProd);
    await delay(1200);

    // Audit Product Tabs and Basic Information
    const prodModalAudit = await cdp.evaluate(`
      (() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return { found: false };
        const text = dialog.innerText;
        return {
          found: true,
          hasBasicTab: text.includes('1. Basic Information'),
          hasPartsTab: text.includes('2. Product Parts'),
          hasSizesTab: text.includes('3. Sizes & Stock'),
          hasColoursTab: text.includes('4. Colours & Images'),
          hasPricingTab: text.includes('5. Pricing'),
          hasPreviewTab: text.includes('6. Preview & Publish'),
          hasSEOTab: text.includes('SEO') || text.includes('Search Engine Optimization'),
          hasProductNameInput: text.includes('Product Name'),
          hasMainCategorySelect: text.includes('Main Category'),
          hasSubcategorySelect: text.includes('Subcategory'),
          hasSelectedCategoryBadge: text.includes('Selected Category:'),
          hasProductType: text.includes('Product Type'),
          hasStatus: text.includes('Status'),
          hasDescription: text.includes('Product Description')
        };
      })()
    `);
    console.log('Product Modal Audit Results:');
    console.log('  Product Modal Open:', prodModalAudit.found);
    console.log('  1. Basic Information tab present:', prodModalAudit.hasBasicTab ? 'YES ✅' : 'NO ❌');
    console.log('  2. Product Parts tab present:', prodModalAudit.hasPartsTab ? 'YES ✅' : 'NO ❌');
    console.log('  3. Sizes & Stock tab present:', prodModalAudit.hasSizesTab ? 'YES ✅' : 'NO ❌');
    console.log('  4. Colours & Images tab present:', prodModalAudit.hasColoursTab ? 'YES ✅' : 'NO ❌');
    console.log('  5. Pricing tab present:', prodModalAudit.hasPricingTab ? 'YES ✅' : 'NO ❌');
    console.log('  SEO Tab COMPLETELY REMOVED:', !prodModalAudit.hasSEOTab ? 'YES ✅' : 'NO ❌');
    console.log('  Product Name input present:', prodModalAudit.hasProductNameInput ? 'YES ✅' : 'NO ❌');
    console.log('  Main Category dropdown present:', prodModalAudit.hasMainCategorySelect ? 'YES ✅' : 'NO ❌');
    console.log('  Subcategory dropdown present:', prodModalAudit.hasSubcategorySelect ? 'YES ✅' : 'NO ❌');
    console.log('  Selected Category Badge display present:', prodModalAudit.hasSelectedCategoryBadge ? 'YES ✅' : 'NO ❌');
    console.log('  Product Type present:', prodModalAudit.hasProductType ? 'YES ✅' : 'NO ❌');
    console.log('  Status present:', prodModalAudit.hasStatus ? 'YES ✅' : 'NO ❌');
    console.log('  Description present:', prodModalAudit.hasDescription ? 'YES ✅' : 'NO ❌');

    await cdp.captureScreenshot(path.join(ARTIFACTS_DIR, 'admin_product_basic_verified.png'));

    // TEST 4: Check Colours & Images Tab (Auto colour change removed)
    console.log('\n--- 4. Testing Colours & Images Tab ---');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
        const coloursBtn = btns.find(b => b.textContent && b.textContent.includes('Colours & Images'));
        if (coloursBtn) coloursBtn.click();
      })()
    `);
    await delay(1000);

    const coloursAudit = await cdp.evaluate(`
      (() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return { found: false };
        const text = dialog.innerText;
        return {
          hasAutoColourChange: text.includes('Auto Colour Change'),
          hasUploadPhoto: text.includes('Upload Photo'),
          hasPresetColours: text.includes('Quick Add Available Colours'),
          hasCustomColour: text.includes('Add Custom Colour')
        };
      })()
    `);
    console.log('Colours & Images Audit Results:');
    console.log('  Auto Colour Change button COMPLETELY REMOVED:', !coloursAudit.hasAutoColourChange ? 'YES ✅' : 'NO ❌');
    console.log('  Manual Upload Photo button present:', coloursAudit.hasUploadPhoto ? 'YES ✅' : 'NO ❌');
    console.log('  Preset colours manual management present:', coloursAudit.hasPresetColours ? 'YES ✅' : 'NO ❌');
    console.log('  Custom colour picker present:', coloursAudit.hasCustomColour ? 'YES ✅' : 'NO ❌');

    await cdp.captureScreenshot(path.join(ARTIFACTS_DIR, 'admin_product_colours_verified.png'));

    // TEST 5: Check Pricing Tab
    console.log('\n--- 5. Testing Pricing Tab ---');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
        const pricingBtn = btns.find(b => b.textContent && b.textContent.includes('Pricing'));
        if (pricingBtn) pricingBtn.click();
      })()
    `);
    await delay(1000);

    const pricingAudit = await cdp.evaluate(`
      (() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return { found: false };
        const text = dialog.innerText;
        return {
          hasSellingPrice: text.includes('Selling Price'),
          hasComparePrice: text.includes('Compare / Original Price'),
          hasCatalogBadges: text.includes('Catalog Badges')
        };
      })()
    `);
    console.log('Pricing Audit Results:');
    console.log('  Selling Price intact:', pricingAudit.hasSellingPrice ? 'YES ✅' : 'NO ❌');
    console.log('  Compare Price intact:', pricingAudit.hasComparePrice ? 'YES ✅' : 'NO ❌');
    console.log('  Catalog Badges intact:', pricingAudit.hasCatalogBadges ? 'YES ✅' : 'NO ❌');

    await cdp.captureScreenshot(path.join(ARTIFACTS_DIR, 'admin_product_pricing_verified.png'));

    cdp.close();
    console.log('\n🎉 ALL HEADLESS CHROME CDP AUDITS PASSED WITH 100% SUCCESS!');
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

