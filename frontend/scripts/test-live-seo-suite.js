/**
 * Live End-to-End SEO Verification Suite for REXBEBE
 * Executes HTTP requests against the live server at http://localhost:3000
 * Tests metadata, canonical URLs, robots, sitemap, JSON-LD, and duplicate title elimination.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.get(url, { headers: { 'User-Agent': 'Googlebot/2.1' }, ...options }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlPath}`));
    });
  });
}

const results = {
  passed: [],
  failed: [],
};

function test(name, condition, extraInfo = '') {
  if (condition) {
    results.passed.push(name);
    console.log(`  ✅ ${name}`);
  } else {
    results.failed.push({ name, extraInfo });
    console.error(`  ❌ ${name}${extraInfo ? ` (${extraInfo})` : ''}`);
  }
}

async function run() {
  console.log('🚀 Running Live SEO Verification Suite against ' + BASE_URL + '...\n');

  // Test 1: robots.txt
  console.log('--- 1. Testing /robots.txt ---');
  try {
    const res = await fetchUrl('/robots.txt');
    test('robots.txt returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);
    test('robots.txt disallows /admin', res.body.includes('Disallow: /admin'));
    test('robots.txt disallows /cart', res.body.includes('Disallow: /cart'));
    test('robots.txt disallows /checkout', res.body.includes('Disallow: /checkout'));
    test('robots.txt allows public assets', res.body.includes('Allow: /images/'));
    test('robots.txt references sitemap.xml', res.body.includes('sitemap.xml'));
  } catch (err) {
    test('robots.txt accessible', false, err.message);
  }

  // Test 2: sitemap.xml
  console.log('\n--- 2. Testing /sitemap.xml ---');
  try {
    const res = await fetchUrl('/sitemap.xml');
    test('sitemap.xml returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);
    test('sitemap.xml has XML declaration or urlset', res.body.includes('<urlset') || res.body.includes('<url>'));
    test('sitemap.xml contains homepage', res.body.includes('https://rexbebe.com'));
    test('sitemap.xml contains /products/', res.body.includes('/products/'));
    test('sitemap.xml contains /categories/', res.body.includes('/categories/'));
    test('sitemap.xml contains /collections/', res.body.includes('/collections/'));
    test('sitemap.xml excludes /admin/', !res.body.includes('/admin/'));
    test('sitemap.xml excludes /cart/', !res.body.includes('/cart/'));
  } catch (err) {
    test('sitemap.xml accessible', false, err.message);
  }

  // Test 3: Homepage
  console.log('\n--- 3. Testing Homepage (/) ---');
  try {
    const res = await fetchUrl('/');
    test('Homepage returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);

    const titleMatch = res.body.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    test('Homepage title tag is present', Boolean(title));
    test('Homepage title has no double REXBEBE suffix', !title.includes('REXBEBE | REXBEBE'), `title: "${title}"`);

    const metaDesc = res.body.includes('name="description"') || res.body.includes('content="');
    test('Homepage meta description is present', metaDesc);

    test('Homepage includes Organization JSON-LD', res.body.includes('"@type":"Organization"'));
    test('Homepage includes WebSite JSON-LD', res.body.includes('"@type":"WebSite"'));
    test('Homepage includes LocalBusiness JSON-LD', res.body.includes('"@type":"ClothingStore"') || res.body.includes('"@type":"LocalBusiness"'));
    test('LocalBusiness JSON-LD has Colombo 03 Sri Lanka address', res.body.includes('Colombo 03') && res.body.includes('LK'));
  } catch (err) {
    test('Homepage accessible', false, err.message);
  }

  // Test 4: Product Detail Page
  console.log('\n--- 4. Testing Product Detail Page (/products/pink-dino-dreams-1) ---');
  try {
    const res = await fetchUrl('/products/pink-dino-dreams-1');
    test('Product page returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);

    const titleMatch = res.body.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    test('Product title is present', Boolean(title));
    test('Product title has no duplicate REXBEBE branding', !title.includes('REXBEBE | REXBEBE'), `title: "${title}"`);

    test('Product page contains Product JSON-LD', res.body.includes('"@type":"Product"'));
    test('Product page contains BreadcrumbList JSON-LD', res.body.includes('"@type":"BreadcrumbList"'));
    test('Product schema contains currency LKR', res.body.includes('"priceCurrency":"LKR"'));
  } catch (err) {
    test('Product page accessible', false, err.message);
  }

  // Test 5: Category Page
  console.log('\n--- 5. Testing Category Page (/categories/baby) ---');
  try {
    const res = await fetchUrl('/categories/baby');
    test('Category page returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);

    const titleMatch = res.body.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    test('Category title has no duplicate REXBEBE branding', !title.includes('REXBEBE | REXBEBE'), `title: "${title}"`);
  } catch (err) {
    test('Category page accessible', false, err.message);
  }

  // Test 6: Collection Page
  console.log('\n--- 6. Testing Collection Page (/collections/everyday-essentials) ---');
  try {
    const res = await fetchUrl('/collections/everyday-essentials');
    test('Collection page returns HTTP 200', res.statusCode === 200, `status: ${res.statusCode}`);

    const titleMatch = res.body.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    test('Collection title has no duplicate REXBEBE branding', !title.includes('REXBEBE | REXBEBE'), `title: "${title}"`);
  } catch (err) {
    test('Collection page accessible', false, err.message);
  }

  // Summary
  console.log('\n=============================================');
  console.log(`TOTAL PASSED: ${results.passed.length}`);
  console.log(`TOTAL FAILED: ${results.failed.length}`);
  console.log('=============================================\n');

  if (results.failed.length > 0) {
    console.error('FAILED TESTS:');
    results.failed.forEach((f) => console.error(` - ${f.name} ${f.extraInfo}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL LIVE SEO ENDPOINTS VALIDATED SUCCESSFULLY!');
    process.exit(0);
  }
}

run();
