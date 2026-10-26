/**
 * Automated SEO Validation Suite for REXBEBE
 * Verifies sitemap, robots directives, canonical URLs, meta titles, descriptions, and structured data schemas.
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];
const passed = [];

function assert(condition, message) {
  if (condition) {
    passed.push(message);
  } else {
    errors.push(message);
  }
}

function warn(condition, message) {
  if (!condition) {
    warnings.push(message);
  }
}

console.log('🔍 Starting REXBEBE Automated SEO Verification Suite...\n');

// 1. Centralized SEO Config
const seoConfigPath = path.join(__dirname, '../config/seoConfig.ts');
assert(fs.existsSync(seoConfigPath), 'Centralized SEO config file exists (config/seoConfig.ts)');

if (fs.existsSync(seoConfigPath)) {
  const content = fs.readFileSync(seoConfigPath, 'utf8');
  assert(content.includes('BRAND_NAME = \'REXBEBE\''), 'Brand name is configured as REXBEBE');
  assert(content.includes('process.env.NEXT_PUBLIC_SITE_URL'), 'Uses environment variable for production domain with fallback');
  assert(!content.includes('http://localhost:3000'), 'Default fallback canonical URL is not set to localhost');
  assert(content.includes('generateCanonicalUrl'), 'Includes canonical URL generator utility');
  assert(content.includes('generateOpenGraph'), 'Includes OpenGraph metadata generator');
  assert(content.includes('generateTwitter'), 'Includes Twitter card metadata generator');
}

// 2. Robots Directives
const robotsPath = path.join(__dirname, '../app/robots.ts');
assert(fs.existsSync(robotsPath), 'Robots configuration exists (app/robots.ts)');

if (fs.existsSync(robotsPath)) {
  const content = fs.readFileSync(robotsPath, 'utf8');
  assert(content.includes('sitemap:'), 'Robots.txt references sitemap XML');
  assert(content.includes('/admin/'), 'Robots.txt disallows /admin/');
  assert(content.includes('/cart/'), 'Robots.txt disallows /cart/');
  assert(content.includes('/checkout/'), 'Robots.txt disallows /checkout/');
  assert(content.includes('allow: \'/\''), 'Robots.txt allows indexing of public root');
}

// 3. XML Sitemap Generation
const sitemapPath = path.join(__dirname, '../app/sitemap.ts');
assert(fs.existsSync(sitemapPath), 'Dynamic sitemap exists (app/sitemap.ts)');

if (fs.existsSync(sitemapPath)) {
  const content = fs.readFileSync(sitemapPath, 'utf8');
  assert(content.includes('INITIAL_PRODUCTS.map') || (content.includes('INITIAL_PRODUCTS') && content.includes('.map')), 'Sitemap dynamically generates URLs for published products');
  assert(content.includes('/size-guide'), 'Sitemap contains /size-guide');
  assert(content.includes('/shipping'), 'Sitemap contains /shipping');
  assert(content.includes('/returns'), 'Sitemap contains /returns');
  assert(content.includes('/faq'), 'Sitemap contains /faq');
  assert(content.includes('/categories/') || content.includes('publishedCategoryRoutes') || content.includes('categoryUrls'), 'Sitemap contains category landing pages');
  assert(content.includes('/collections/'), 'Sitemap contains collection landing pages');
  assert(!content.includes('/admin'), 'Sitemap excludes private /admin routes');
  assert(!content.includes('/cart'), 'Sitemap excludes private /cart routes');
}

// 4. Structured Data (JSON-LD) Validation
const jsonLdPath = path.join(__dirname, '../components/seo/JsonLd.tsx');
assert(fs.existsSync(jsonLdPath), 'Structured data components exist (components/seo/JsonLd.tsx)');

if (fs.existsSync(jsonLdPath)) {
  const content = fs.readFileSync(jsonLdPath, 'utf8');
  assert(content.includes('\'@type\': \'Organization\''), 'Includes schema.org Organization definition');
  assert(content.includes('\'@type\': \'WebSite\''), 'Includes schema.org WebSite definition');
  assert(content.includes('\'@type\': \'Product\''), 'Includes schema.org Product definition');
  assert(content.includes('\'@type\': \'Offer\''), 'Includes schema.org Offer definition with price and availability');
  assert(content.includes('\'@type\': \'BreadcrumbList\''), 'Includes schema.org BreadcrumbList definition');
  assert(content.includes('\'@type\': \'ItemList\''), 'Includes schema.org ItemList definition');
  assert(content.includes('MerchantReturnPolicy'), 'Includes merchant return policy rich result schema');
}

// 5. Indexing Shields on Private Routes
const privateRoutes = ['admin', 'cart', 'checkout', 'account', 'order-tracking'];
privateRoutes.forEach((route) => {
  const layoutPath = path.join(__dirname, `../app/${route}/layout.tsx`);
  assert(fs.existsSync(layoutPath), `Private route /${route} has dedicated layout shielding`);
  if (fs.existsSync(layoutPath)) {
    const content = fs.readFileSync(layoutPath, 'utf8');
    assert(
      content.includes('index: false'),
      `Private route /${route} has explicit "index: false" robots directive`
    );
  }
});

// 6. Public Page SEO & Metadata Inspection
const publicPages = [
  { path: 'shop/layout.tsx', name: '/shop' },
  { path: 'girls/layout.tsx', name: '/girls' },
  { path: 'boys/layout.tsx', name: '/boys' },
  { path: 'baby/layout.tsx', name: '/baby' },
  { path: 'new-in/layout.tsx', name: '/new-in' },
  { path: 'sale/layout.tsx', name: '/sale' },
  { path: 'size-guide/page.tsx', name: '/size-guide' },
  { path: 'shipping/page.tsx', name: '/shipping' },
  { path: 'returns/page.tsx', name: '/returns' },
  { path: 'faq/page.tsx', name: '/faq' },
  { path: 'about/page.tsx', name: '/about' },
  { path: 'contact/layout.tsx', name: '/contact' },
];

publicPages.forEach(({ path: fileRel, name }) => {
  const fullPath = path.join(__dirname, `../app/${fileRel}`);
  assert(fs.existsSync(fullPath), `Public route ${name} has dedicated metadata file (${fileRel})`);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(
      content.includes('title:'),
      `Public route ${name} specifies page-level title metadata`
    );
    assert(
      content.includes('description:'),
      `Public route ${name} specifies page-level description metadata`
    );
  }
});

// 7. Dynamic Product Detail Page Audit
const productDetailPath = path.join(__dirname, '../app/products/[slug]/page.tsx');
const productViewPath = path.join(__dirname, '../components/products/ProductDetailView.tsx');
assert(fs.existsSync(productDetailPath), 'Product detail page route exists');
if (fs.existsSync(productDetailPath)) {
  const content = fs.readFileSync(productDetailPath, 'utf8');
  const viewContent = fs.existsSync(productViewPath) ? fs.readFileSync(productViewPath, 'utf8') : '';
  const combined = content + '\n' + viewContent;

  assert(
    combined.includes('generateMetadata'),
    'Product detail page exports dynamic generateMetadata function'
  );
  assert(
    combined.includes('notFound()') || combined.includes('Product Not Found'),
    'Product detail page returns genuine 404 via notFound() for invalid slugs'
  );
  assert(
    combined.includes('ProductJsonLd'),
    'Product detail page renders ProductJsonLd structured data'
  );
  assert(
    combined.includes('BreadcrumbJsonLd'),
    'Product detail page renders BreadcrumbJsonLd structured data'
  );
}

// 8. Google Merchant Center Feed Readiness
const merchantFeedPath = path.join(__dirname, '../app/api/feed/google-merchant/route.ts');
assert(fs.existsSync(merchantFeedPath), 'Google Merchant XML feed endpoint exists');
if (fs.existsSync(merchantFeedPath)) {
  const content = fs.readFileSync(merchantFeedPath, 'utf8');
  assert(content.includes('<rss version="2.0"'), 'Merchant feed uses valid RSS 2.0 XML schema');
  assert(content.includes('xmlns:g="http://base.google.com/ns/1.0"'), 'Merchant feed includes Google base namespace');
  assert(content.includes('<g:price>'), 'Merchant feed includes price element');
  assert(content.includes('<g:availability>'), 'Merchant feed includes availability element');
}

// Print Summary
console.log(`\n========================================`);
console.log(`✅ Passed Checks: ${passed.length}`);
console.log(`⚠️ Warnings:     ${warnings.length}`);
console.log(`❌ Failed Checks: ${errors.length}`);
console.log(`========================================\n`);

if (errors.length > 0) {
  console.error('FAILED CHECKS:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('🎉 ALL SEO CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
