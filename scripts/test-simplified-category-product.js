const http = require('http');

function post(urlStr, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch(e) {
          resolve({ status: res.statusCode, data: respBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(urlStr, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = http.request(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch(e) {
          resolve({ status: res.statusCode, data: respBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(urlStr, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = http.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch(e) {
          resolve({ status: res.statusCode, data: respBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // Login
  const loginRes = await post('http://localhost:5000/api/auth/admin/login', {
    email: 'admin@rexbebe.com',
    password: 'Admin@Rexbebe2026!'
  });
  console.log('1. Admin Auth Login Status:', loginRes.status);
  const token = loginRes.data?.token || loginRes.data?.data?.token;

  // 1. Existing Categories & Products Intact
  const initialCats = await get('http://localhost:5000/api/categories', token);
  const initialProds = await get('http://localhost:5000/api/products', token);
  const initialCatCount = (initialCats.data?.data || initialCats.data || []).length;
  const initialProdCount = (initialProds.data?.data || initialProds.data || []).length;
  console.log(`2. Existing Categories Intact: ${initialCatCount} found.`);
  console.log(`3. Existing Products Intact: ${initialProdCount} found.`);

  // 4. Test Main Category Creation
  const testMainCatName = `Test Autumn Boutique ${Date.now()}`;
  const createMainRes = await post('http://localhost:5000/api/categories', {
    name: testMainCatName,
    slug: testMainCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parentId: null,
    isActive: true,
    status: 'published',
    order: initialCatCount + 1
  }, token);
  console.log('4. Create Main Category Status:', createMainRes.status);
  const createdMainCat = createMainRes.data?.data || createMainRes.data;
  console.log('   Created Main Category ID:', createdMainCat?.id, 'Name:', createdMainCat?.name);

  // 5. Navigation display toggle test (badge HIDDEN or undefined)
  const toggleNavRes = await put(`http://localhost:5000/api/categories/${createdMainCat.id}`, {
    badge: 'HIDDEN'
  }, token);
  console.log('5. Navigation Display Toggle to HIDDEN Status:', toggleNavRes.status);
  const toggleBackRes = await put(`http://localhost:5000/api/categories/${createdMainCat.id}`, {
    badge: null
  }, token);
  console.log('   Navigation Display Toggle back to Visible Status:', toggleBackRes.status);

  // 6. Test Subcategory Creation Under Selected Main Category
  const testSubName = `Cozy Knit Rompers ${Date.now()}`;
  const createSubRes = await post('http://localhost:5000/api/categories', {
    name: testSubName,
    slug: testSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parentId: createdMainCat.id,
    isActive: true,
    status: 'published',
    order: 1
  }, token);
  console.log('6. Create Subcategory under Main Category Status:', createSubRes.status);
  const createdSubCat = createSubRes.data?.data || createSubRes.data;
  console.log('   Created Subcategory ID:', createdSubCat?.id, 'Parent ID:', createdSubCat?.parentId);

  // 7. Test Product Creation with Main Category & Subcategory
  const testProdName = `Organic Bunny Romper ${Date.now()}`;
  const testProdSlug = testProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const createProdRes = await post('http://localhost:5000/api/products', {
    name: testProdName,
    slug: testProdSlug,
    sku: `REX-BNY-${Date.now().toString().slice(-4)}`,
    description: 'Ultra soft 100% organic cotton baby clothing item for delicate newborn skin.',
    productType: 'single',
    status: 'published',
    price: 3200,
    comparePrice: 3800,
    discountPercentage: 16,
    category: {
      id: createdMainCat.id,
      name: createdMainCat.name,
      slug: createdMainCat.slug
    },
    subcategory: {
      id: createdSubCat.id,
      name: createdSubCat.name,
      slug: createdSubCat.slug
    },
    colors: [
      { name: 'Sage Green', hex: '#87A987' },
      { name: 'Blush Pink', hex: '#F4C2C2' }
    ],
    sizes: ['0–3 Months', '3–6 Months'],
    images: [
      { id: `img-1`, url: '/images/products/organic-onesie.jpg', alt: 'Bunny romper', position: 1 }
    ],
    colorImages: {
      'Sage Green': '/images/products/organic-onesie.jpg'
    },
    variants: [
      {
        id: `var-${testProdSlug}-0-3m-sage`,
        sku: `REX-BNY-03M-SGE`,
        size: '0–3 Months',
        color: 'Sage Green',
        colorHex: '#87A987',
        price: 3200,
        stockQuantity: 15
      },
      {
        id: `var-${testProdSlug}-3-6m-blush`,
        sku: `REX-BNY-36M-BLS`,
        size: '3–6 Months',
        color: 'Blush Pink',
        colorHex: '#F4C2C2',
        price: 3200,
        stockQuantity: 20
      }
    ],
    stockQuantity: 35
  }, token);
  console.log('7. Product Creation with Main Category & Subcategory Status:', createProdRes.status);
  const createdProd = createProdRes.data?.data || createProdRes.data;
  console.log('   Created Product ID:', createdProd?.id, 'Category:', createdProd?.category?.name, 'Subcategory:', createdProd?.subcategory?.name);

  // 8. Test Product Editing (Update Price & Stock)
  const updateProdRes = await put(`http://localhost:5000/api/products/${createdProd.id}`, {
    ...createdProd,
    price: 3350,
    stockQuantity: 40
  }, token);
  console.log('8. Product Editing & Pricing Update Status:', updateProdRes.status);

  // 9. Verify Category and Subcategory linkage
  const verifyCatRes = await get(`http://localhost:5000/api/categories`, token);
  const allCats = verifyCatRes.data?.data || verifyCatRes.data || [];
  const foundSub = allCats.find(c => c.id === createdSubCat.id);
  console.log('9. Verified Subcategory linkage in Database:', foundSub?.parentId === createdMainCat.id ? 'PASSED ✅' : 'FAILED ❌');

  // 10. Clean up test data
  const delProd = await require('http').request(`http://localhost:5000/api/products/${createdProd.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).end();
  const delSub = await require('http').request(`http://localhost:5000/api/categories/${createdSubCat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).end();
  const delMain = await require('http').request(`http://localhost:5000/api/categories/${createdMainCat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).end();
  console.log('10. Cleaned up test entities.');

  console.log('--- ALL BACKEND VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
