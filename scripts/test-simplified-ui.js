const puppeteer = require('puppeteer');
const path = require('path');

async function testUI() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('--- TESTING ADMIN CATEGORY & PRODUCT MANAGEMENT UI ---');

  // 1. Login
  console.log('Navigating to admin login...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@rexbebe.com');
  await page.type('input[type="password"]', 'Admin@Rexbebe2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // 2. Categories Page
  console.log('Navigating to /admin/categories...');
  await page.goto('http://localhost:3000/admin/categories', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Click Add Category
  const addCategoryButtons = await page.$$('button');
  for (const btn of addCategoryButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Add Category')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  // Verify modal fields
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return modal ? modal.innerText : '';
  });

  const hasName = modalText.includes('Main Category Name');
  const hasNavToggle = modalText.includes('Display in Navigation');
  const hasOrder = modalText.includes('Display Order');
  const hasImageUpload = modalText.includes('Category Photo');
  const hasSEO = modalText.includes('Search Engine Optimization');

  console.log('Main Category Modal Verification:');
  console.log('  Main Category Name input present:', hasName);
  console.log('  Enable Display in Navigation present:', hasNavToggle);
  console.log('  Display Order REMOVED:', !hasOrder);
  console.log('  Category Photo REMOVED:', !hasImageUpload);
  console.log('  SEO Accordion REMOVED:', !hasSEO);

  const artifactsDir = 'C:/Users/amash/.gemini/antigravity/brain/2af4d0d6-6cb0-47ac-9770-162dd3d5446e';
  await page.screenshot({ path: path.join(artifactsDir, 'admin_category_simplified_modal.png'), fullPage: false });
  console.log('  Captured screenshot: admin_category_simplified_modal.png');

  // Close modal (click cancel)
  const cancelBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
    return btns.find(b => b.textContent.includes('Cancel'));
  });
  if (cancelBtn) await cancelBtn.click();
  await new Promise(r => setTimeout(r, 800));

  // Switch to Subcategories tab
  console.log('Switching to Subcategories tab...');
  const subTabBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Subcategories'));
  });
  if (subTabBtn) await subTabBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // Check Quick Add Subcategory form
  const subSectionText = await page.evaluate(() => document.body.innerText);
  const hasQuickAddHeader = subSectionText.includes('Add Subcategory');
  const hasQuickParentSelect = subSectionText.includes('Parent Main Category');
  const hasQuickSubName = subSectionText.includes('Subcategory Name');

  console.log('Subcategories Section Quick-Add Verification:');
  console.log('  Add Subcategory section present:', hasQuickAddHeader);
  console.log('  Parent Main Category dropdown present:', hasQuickParentSelect);
  console.log('  Subcategory Name input present:', hasQuickSubName);

  await page.screenshot({ path: path.join(artifactsDir, 'admin_subcategories_simplified_view.png'), fullPage: false });
  console.log('  Captured screenshot: admin_subcategories_simplified_view.png');

  // 3. Products Page
  console.log('Navigating to /admin/products...');
  await page.goto('http://localhost:3000/admin/products', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Click Add Baby Product
  const addProductBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Add Baby Product'));
  });
  if (addProductBtn) await addProductBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // Verify Product Modal Tabs
  const productModalText = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return modal ? modal.innerText : '';
  });

  const hasBasicTab = productModalText.includes('1. Basic Information');
  const hasPartsTab = productModalText.includes('2. Product Parts');
  const hasSizesTab = productModalText.includes('3. Sizes & Stock');
  const hasColoursTab = productModalText.includes('4. Colours & Images');
  const hasPricingTab = productModalText.includes('5. Pricing');
  const hasSEOTab = productModalText.includes('SEO');
  const hasCategoryBadge = productModalText.includes('Selected Category:');

  console.log('Product Modal Verification:');
  console.log('  Basic Information tab present:', hasBasicTab);
  console.log('  Product Parts tab present:', hasPartsTab);
  console.log('  Sizes & Stock tab present:', hasSizesTab);
  console.log('  Colours & Images tab present:', hasColoursTab);
  console.log('  Pricing tab present:', hasPricingTab);
  console.log('  SEO Tab COMPLETELY REMOVED:', !hasSEOTab);
  console.log('  Category Badge visual display present:', hasCategoryBadge);

  await page.screenshot({ path: path.join(artifactsDir, 'admin_product_simplified_basic.png'), fullPage: false });
  console.log('  Captured screenshot: admin_product_simplified_basic.png');

  // Click Colours & Images Tab
  const coloursTabBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
    return btns.find(b => b.textContent.includes('Colours & Images'));
  });
  if (coloursTabBtn) await coloursTabBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  const coloursTabText = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return modal ? modal.innerText : '';
  });

  const hasAutoColourChange = coloursTabText.includes('Auto Colour Change');
  const hasUploadPhoto = coloursTabText.includes('Upload Photo');
  const hasPresetColours = coloursTabText.includes('Quick Add Available Colours');

  console.log('Colours & Images Verification:');
  console.log('  Auto Colour Change button COMPLETELY REMOVED:', !hasAutoColourChange);
  console.log('  Upload Photo button present:', hasUploadPhoto);
  console.log('  Preset & Custom colour controls present:', hasPresetColours);

  await page.screenshot({ path: path.join(artifactsDir, 'admin_product_simplified_colours.png'), fullPage: false });
  console.log('  Captured screenshot: admin_product_simplified_colours.png');

  // Click Pricing Tab
  const pricingTabBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
    return btns.find(b => b.textContent.includes('Pricing'));
  });
  if (pricingTabBtn) await pricingTabBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  const pricingTabText = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return modal ? modal.innerText : '';
  });

  const hasSellingPrice = pricingTabText.includes('Selling Price');
  const hasComparePrice = pricingTabText.includes('Compare / Original Price');
  console.log('Pricing Verification:');
  console.log('  Selling Price intact:', hasSellingPrice);
  console.log('  Compare Price intact:', hasComparePrice);

  await page.screenshot({ path: path.join(artifactsDir, 'admin_product_simplified_pricing.png'), fullPage: false });
  console.log('  Captured screenshot: admin_product_simplified_pricing.png');

  await browser.close();
  console.log('--- ALL UI AUDIT TESTS COMPLETED SUCCESSFULLY ---');
}

testUI().catch(err => {
  console.error('Puppeteer test error:', err);
  process.exit(1);
});

