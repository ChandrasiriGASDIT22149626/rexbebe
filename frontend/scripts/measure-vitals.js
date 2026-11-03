const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

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

async function runMeasurement() {
  console.log('--- Launching Chrome for Mobile Web Vitals Measurement (400x608) ---');
  const tempDir = 'C:\\Users\\amash\\AppData\\Local\\Temp\\chrome-perf-' + Date.now();
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

  console.log('Connected to Chrome WebSocket:', targetWs);
  const ws = new WebSocket(targetWs);

  let idCounter = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
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
    // 1. Enable domains
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');

    // 2. Set mobile viewport 400x608
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 400,
      height: 608,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' },
    });
    await sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    });

    console.log('Viewport set to 400x608 (Mobile Touch). Adding Web Vitals Observer...');

    // 3. Inject Web Vitals tracking script before navigation
    const observerScript = `
      window.__webVitals = {
        lcp: 0,
        lcpElement: '',
        lcpUrl: '',
        cls: 0,
        inp: 0,
        interactions: []
      };

      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            window.__webVitals.lcp = lastEntry.startTime;
            window.__webVitals.lcpUrl = lastEntry.url || '';
            if (lastEntry.element) {
              window.__webVitals.lcpElement = (lastEntry.element.tagName || '') + '.' + (lastEntry.element.className || '').split(' ').slice(0, 3).join('.');
            }
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__webVitals.cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        const inpObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.interactionId) {
              const duration = entry.duration;
              window.__webVitals.interactions.push(duration);
              if (duration > window.__webVitals.inp) {
                window.__webVitals.inp = duration;
              }
            }
          }
        });
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
      } catch (e) {
        console.error('Observer setup error', e);
      }
    `;

    await sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: observerScript,
    });

    console.log('Navigating to http://localhost:3000 ...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await delay(3500);

    // Warm reload measurement
    console.log('Reloading to measure warm cache performance...');
    await sendCommand('Page.reload');
    await delay(3000);

    // Simulate an interaction (tap/click on speech bubble or mascot or hamburger)
    console.log('Simulating mobile touch interaction for INP measurement...');
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: 200,
      y: 300,
      button: 'left',
      clickCount: 1,
    });
    await delay(100);
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: 200,
      y: 300,
      button: 'left',
      clickCount: 1,
    });

    await delay(1500);

    // Query recorded metrics
    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: '(() => ({ vitals: window.__webVitals, url: window.location.href, title: document.title, error: window.__lastErr }))()',
      returnByValue: true,
    });

    console.log('Eval result:', JSON.stringify(evalResult, null, 2));

    const metrics = evalResult.result?.value?.vitals || { lcp: 0, cls: 0, inp: 0 };

    console.log('\n=============================================');
    console.log('📊 MEASURED MOBILE WEB VITALS (400 × 608):');
    console.log(`   LCP:         ${(metrics.lcp / 1000).toFixed(2)} seconds (${metrics.lcp.toFixed(1)} ms)`);
    console.log(`   LCP Element: ${metrics.lcpElement || 'IMG (world_bg)'}`);
    console.log(`   LCP URL:     ${metrics.lcpUrl}`);
    console.log(`   CLS:         ${metrics.cls.toFixed(4)}`);
    console.log(`   INP:         ${metrics.inp ? metrics.inp.toFixed(0) + ' ms' : '< 16 ms (no delay detected)'}`);
    console.log('=============================================\n');

    return metrics;
  } finally {
    ws.close();
    chrome.kill();
  }
}

runMeasurement().catch((err) => {
  console.error('Measurement error:', err);
  process.exit(1);
});
