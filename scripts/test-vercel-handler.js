const http = require('http');

async function testVercelHandler() {
  console.log('--- TESTING VERCEL SERVERLESS HANDLER ---');

  // Register ts-node so we can load TypeScript api/index.ts directly
  require('ts-node').register({
    transpileOnly: true,
    project: 'rexbebe-main/backend/tsconfig.json'
  });

  const entry = require('../backend/api/index.ts');
  const handler = entry.default;

  console.log('1. Handler type:', typeof handler);

  // Mock Request & Response to test /api/health
  const req = {
    method: 'GET',
    url: '/api/health',
    headers: { host: 'localhost:5000' }
  };

  let statusCode = null;
  let responseData = '';
  const res = {
    setHeader: (k, v) => {},
    getHeader: (k) => null,
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (obj) => {
      responseData = JSON.stringify(obj);
      console.log('2. Mock /api/health Response Status:', statusCode);
      console.log('   Response Body:', responseData);
    },
    send: (body) => {
      responseData = body;
      console.log('2. Mock /api/health Response (send):', statusCode, responseData);
    },
    end: () => {}
  };

  await handler(req, res);
  console.log('--- VERCEL HANDLER EXECUTION PASSED ---');
}

testVercelHandler().catch(err => {
  console.error('Handler test error:', err);
  process.exit(1);
});

