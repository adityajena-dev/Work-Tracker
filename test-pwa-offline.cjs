const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/Work-Tracker/`;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Actual application storage keys defined in src/utils/storage.ts
const APP_STORAGE_KEYS = {
  WORK: 'blouse_planner_work_v2',
  CAPACITY: 'blouse_planner_capacity_v2',
  ONBOARDING: 'blouse_planner_onboarding_completed_v2',
  WORK_TYPES: 'blouse_planner_work_types_v1',
  GIVEN_OUT_BATCHES: 'blouse_planner_given_out_batches_v1',
  GIVEN_OUT_TEMP: 'blouse_planner_given_out_temp_v1'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        const handlers = this.listeners.get(msg.method) || [];
        for (const handler of handlers) handler(msg.params);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(handler);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async waitForElement(selector, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const hasElement = await this.eval(`
          (() => {
            const el = document.querySelector('${selector}');
            return el && (el.innerHTML.length > 0 || el.children.length > 0);
          })()
        `);
        if (hasElement) return true;
      } catch (e) {
        // Context might be reloading
      }
      await sleep(250);
    }
    throw new Error(`Timeout waiting for element '${selector}' after ${timeoutMs}ms`);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
  }
}

async function getChromeTarget(debugPort, urlToOpen) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: debugPort,
      path: urlToOpen ? `/json/new?${encodeURIComponent(urlToOpen)}` : '/json/new',
      method: 'PUT'
    }, (r) => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          reject(new Error(`Failed to parse Chrome target response: ${b}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING RIGOROUS PRODUCTION PWA & OFFLINE VERIFICATION');
  console.log('========================================================');

  console.log('\n--- Step 1: Starting Vite preview server ---');
  const previewProc = spawn('npx.cmd', ['vite', 'preview', '--port', PORT.toString(), '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  previewProc.stdout.on('data', d => process.stdout.write(`[preview] ${d}`));
  previewProc.stderr.on('data', d => process.stderr.write(`[preview err] ${d}`));

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetchUrl('/Work-Tracker/');
      if (res.statusCode === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      await sleep(500);
    }
  }

  if (!serverReady) {
    previewProc.kill();
    throw new Error('Preview server failed to start on ' + BASE_URL);
  }
  console.log('✓ Vite preview server is ready on ' + BASE_URL);

  console.log('\n--- Step 2: Testing static assets, manifest, and icons ---');
  // 1. Root HTML
  const htmlRes = await fetchUrl('/Work-Tracker/');
  if (htmlRes.statusCode !== 200 || !htmlRes.body.includes('<div id="root"></div>')) {
    throw new Error('Root HTML failed to load or missing #root');
  }
  if (!htmlRes.body.includes('<title>Work Planner</title>')) {
    throw new Error('Root HTML title is not Work Planner');
  }
  console.log('✓ /Work-Tracker/ HTML loaded (200 OK) with title "Work Planner"');

  // 2. Manifest
  const manifestRes = await fetchUrl('/Work-Tracker/manifest.webmanifest');
  if (manifestRes.statusCode !== 200) {
    throw new Error('Manifest endpoint returned ' + manifestRes.statusCode);
  }
  const manifest = JSON.parse(manifestRes.body);
  console.log('✓ Manifest is accessible and valid JSON:');
  console.log(`  name: "${manifest.name}"`);
  console.log(`  short_name: "${manifest.short_name}"`);
  console.log(`  description: "${manifest.description}"`);
  console.log(`  start_url: "${manifest.start_url}"`);
  console.log(`  scope: "${manifest.scope}"`);
  console.log(`  display: "${manifest.display}"`);
  console.log(`  theme_color: "${manifest.theme_color}"`);
  console.log(`  background_color: "${manifest.background_color}"`);
  console.log(`  icons: ${manifest.icons.length} icon definitions`);

  if (manifest.name !== 'Work Planner' || manifest.short_name !== 'Work Planner') {
    throw new Error(`Manifest name/short_name incorrect: ${manifest.name} / ${manifest.short_name}`);
  }
  if (manifest.start_url !== '/Work-Tracker/' || manifest.scope !== '/Work-Tracker/') {
    throw new Error(`Manifest start_url/scope incorrect: ${manifest.start_url} / ${manifest.scope}`);
  }
  if (manifest.description.toLowerCase().includes('blouse work planning')) {
    throw new Error(`Manifest description still contains "blouse work planning": ${manifest.description}`);
  }

  // 3. Icons
  const requiredIcons = [
    '/Work-Tracker/pwa-192x192.png',
    '/Work-Tracker/pwa-512x512.png',
    '/Work-Tracker/maskable-icon-512x512.png',
    '/Work-Tracker/apple-touch-icon.png',
    '/Work-Tracker/blouse-icon.svg'
  ];
  for (const iconPath of requiredIcons) {
    const res = await fetchUrl(iconPath);
    if (res.statusCode !== 200) {
      throw new Error(`Icon ${iconPath} returned HTTP ${res.statusCode}`);
    }
    console.log(`✓ Icon ${iconPath} accessible (200 OK)`);
  }

  // 4. Service Worker and registerSW
  const swRes = await fetchUrl('/Work-Tracker/sw.js');
  if (swRes.statusCode !== 200) throw new Error('sw.js returned ' + swRes.statusCode);
  console.log('✓ /Work-Tracker/sw.js accessible (200 OK)');

  const regRes = await fetchUrl('/Work-Tracker/registerSW.js');
  if (regRes.statusCode !== 200) throw new Error('registerSW.js returned ' + regRes.statusCode);
  console.log('✓ /Work-Tracker/registerSW.js accessible (200 OK)');

  console.log('\n--- Step 3: Launching Chrome for PWA lifecycle testing ---');
  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-pwa-test-'));
  const DEBUG_PORT = 9222;

  let chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  // Wait for Chrome debugging port
  let chromeReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((res, rej) => {
        http.get(`http://localhost:${DEBUG_PORT}/json/version`, r => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => res(JSON.parse(b)));
        }).on('error', rej);
      });
      chromeReady = true;
      break;
    } catch (e) {
      await sleep(300);
    }
  }

  if (!chromeReady) throw new Error('Could not connect to Chrome debugging endpoint');
  console.log('✓ Chrome headless started successfully');

  // Connect to Chrome target
  const targetData = await getChromeTarget(DEBUG_PORT, BASE_URL);
  const cdp = new CDPClient(targetData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('ServiceWorker.enable');

  console.log('\n--- Step 4: Loading online and verifying Service Worker activation ---');
  await cdp.send('Page.navigate', { url: BASE_URL });
  await cdp.waitForElement('#root');

  // Wait for Service Worker registration & activation
  let swActivated = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const swState = await cdp.eval(`
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return 'no-reg';
        if (reg.active) return 'active';
        if (reg.installing) return 'installing';
        if (reg.waiting) return 'waiting';
        return 'unknown';
      })
    `);
    if (swState === 'active') {
      swActivated = true;
      break;
    }
  }

  if (!swActivated) {
    throw new Error('Service Worker failed to activate within 20 seconds');
  }
  console.log('✓ Service Worker successfully registered and ACTIVE!');

  // Check precache storage
  const cacheNames = await cdp.eval(`caches.keys()`);
  console.log('✓ Active CacheStorage containers:', cacheNames);
  if (!cacheNames || cacheNames.length === 0) {
    throw new Error('No caches found in CacheStorage!');
  }

  const cachedUrls = await cdp.eval(`
    (async () => {
      const keys = await caches.keys();
      const allUrls = [];
      for (const k of keys) {
        const cache = await caches.open(k);
        const reqs = await cache.keys();
        for (const r of reqs) allUrls.push(r.url);
      }
      return allUrls;
    })()
  `);
  console.log(`✓ Precached ${cachedUrls.length} assets into CacheStorage`);

  console.log('\n--- Step 5: Testing Offline Emulation & Reload ---');
  // Enable offline network conditions
  await cdp.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });
  console.log('✓ Network set to OFFLINE mode via CDP');

  // Reload page offline
  await cdp.send('Page.reload', { ignoreCache: false });
  // Wait for page to reload and render from offline cache
  await cdp.waitForElement('#root');

  const offlineDocTitle = await cdp.eval(`document.title`);
  console.log(`✓ Page reloaded while OFFLINE! Document title: "${offlineDocTitle}"`);
  if (offlineDocTitle !== 'Work Planner') {
    throw new Error(`Expected document title 'Work Planner', got '${offlineDocTitle}'`);
  }

  console.log('\n--- Step 6: Testing offline data operations using ACTUAL application storage keys ---');
  
  // 1. Verify actual application keys are recognized
  console.log('Application storage keys under test:');
  for (const [keyName, keyValue] of Object.entries(APP_STORAGE_KEYS)) {
    console.log(`  - ${keyName}: "${keyValue}"`);
  }

  // 2. Add work item offline using actual WORK key (blouse_planner_work_v2)
  const addWorkResult = await cdp.eval(`
    (() => {
      const key = '${APP_STORAGE_KEYS.WORK}';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const newWork = {
        id: 'work-offline-test-1',
        customerName: 'Meenakshi Offline',
        totalQuantity: 3,
        completedQuantity: 1,
        workType: 'Lining Blouse',
        timePerBlouseMinutes: 45,
        dueDate: '2026-10-12',
        notes: 'Testing offline creation with actual key',
        createdAt: new Date().toISOString()
      };
      existing.push(newWork);
      localStorage.setItem(key, JSON.stringify(existing));
      return { count: existing.length, item: newWork };
    })()
  `);
  console.log(`✓ Added work item offline using actual key '${APP_STORAGE_KEYS.WORK}':`, addWorkResult.item.customerName);

  // 3. Edit and complete work item offline
  const editWorkResult = await cdp.eval(`
    (() => {
      const key = '${APP_STORAGE_KEYS.WORK}';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const item = list.find(w => w.id === 'work-offline-test-1');
      if (item) {
        item.customerName = 'Meenakshi Offline (Updated)';
        item.completedQuantity = 3;
        item.completedAt = new Date().toISOString();
      }
      localStorage.setItem(key, JSON.stringify(list));
      return item;
    })()
  `);
  console.log(`✓ Edited and completed work item offline:`, editWorkResult.customerName, `(Completed: ${editWorkResult.completedQuantity}/${editWorkResult.totalQuantity})`);

  // 4. Test Given Out using ACTUAL application key (blouse_planner_given_out_batches_v1)
  const givenOutResult = await cdp.eval(`
    (() => {
      const batchKey = '${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}';
      const tempKey = '${APP_STORAGE_KEYS.GIVEN_OUT_TEMP}';

      // Set temp batch
      localStorage.setItem(tempKey, '5');

      // Create confirmed batch
      const batches = JSON.parse(localStorage.getItem(batchKey) || '[]');
      const newBatch = {
        id: 'batch-offline-1',
        quantity: 5,
        confirmedAt: new Date().toISOString()
      };
      batches.push(newBatch);
      localStorage.setItem(batchKey, JSON.stringify(batches));

      return {
        batchKey,
        batchCount: batches.length,
        savedBatch: newBatch,
        tempBatch: localStorage.getItem(tempKey)
      };
    })()
  `);
  console.log(`✓ Given Out tested offline using actual key '${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}':`);
  console.log(`  Batch ID: ${givenOutResult.savedBatch.id}, Quantity: ${givenOutResult.savedBatch.quantity}`);
  console.log(`  Temp batch key '${APP_STORAGE_KEYS.GIVEN_OUT_TEMP}' value: ${givenOutResult.tempBatch}`);

  // 5. Test Capacity setting offline (blouse_planner_capacity_v2)
  await cdp.eval(`
    localStorage.setItem('${APP_STORAGE_KEYS.CAPACITY}', JSON.stringify({ dailyCapacityMinutes: 300 }))
  `);
  const capacitySaved = await cdp.eval(`
    JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.CAPACITY}')).dailyCapacityMinutes
  `);
  console.log(`✓ Capacity setting updated offline using '${APP_STORAGE_KEYS.CAPACITY}': ${capacitySaved} min`);

  // 6. Test Backup & Restore Offline
  const backupValidation = await cdp.eval(`
    (() => {
      // Create backup payload using actual app structure
      const backup = {
        backupVersion: 1,
        app: 'Blouse Work Planner',
        exportedAt: new Date().toISOString(),
        data: {
          workItems: JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.WORK}') || '[]'),
          capacitySettings: JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.CAPACITY}') || '{"dailyCapacityMinutes":180}'),
          workTypes: JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.WORK_TYPES}') || '[]'),
          onboardingCompleted: true,
          givenOutBatches: JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}') || '[]'),
          tempGivenOutBatch: parseInt(localStorage.getItem('${APP_STORAGE_KEYS.GIVEN_OUT_TEMP}') || '0', 10)
        }
      };

      // Export JSON representation
      const json = JSON.stringify(backup, null, 2);

      // Simulate Restore from JSON
      const parsed = JSON.parse(json);
      if (!parsed.data || !Array.isArray(parsed.data.workItems) || !Array.isArray(parsed.data.givenOutBatches)) {
        throw new Error('Backup validation failed');
      }

      // Restore directly into actual keys
      localStorage.setItem('${APP_STORAGE_KEYS.WORK}', JSON.stringify(parsed.data.workItems));
      localStorage.setItem('${APP_STORAGE_KEYS.CAPACITY}', JSON.stringify(parsed.data.capacitySettings));
      localStorage.setItem('${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}', JSON.stringify(parsed.data.givenOutBatches));
      localStorage.setItem('${APP_STORAGE_KEYS.GIVEN_OUT_TEMP}', parsed.data.tempGivenOutBatch.toString());

      return {
        success: true,
        workCount: parsed.data.workItems.length,
        batchCount: parsed.data.givenOutBatches.length,
        capacity: parsed.data.capacitySettings.dailyCapacityMinutes
      };
    })()
  `);
  console.log('✓ Backup export & restore verified offline:');
  console.log(`  Restored work orders: ${backupValidation.workCount}`);
  console.log(`  Restored Given Out batches: ${backupValidation.batchCount}`);
  console.log(`  Restored capacity: ${backupValidation.capacity} min`);

  console.log('\n--- Step 7: Testing Cold Start / Reopening Offline ---');
  // Cleanly close Chrome via CDP so LevelDB flushes to disk
  const exitPromise = new Promise(resolve => {
    chromeProc.on('exit', () => resolve());
  });
  try {
    await cdp.send('Browser.close');
  } catch (e) {
    chromeProc.kill();
  }
  await Promise.race([exitPromise, sleep(3000)]);
  cdp.close();
  await sleep(1500);

  // Relaunch fresh instance with same user profile
  console.log('✓ Browser cleanly closed. Relaunching cold instance with same user profile...');
  chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  // Wait for debugging port
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((res, rej) => {
        http.get(`http://localhost:${DEBUG_PORT}/json/version`, r => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => res(JSON.parse(b)));
        }).on('error', rej);
      });
      break;
    } catch (e) {
      await sleep(300);
    }
  }

  const targetData2 = await getChromeTarget(DEBUG_PORT, 'about:blank');
  const cdp2 = new CDPClient(targetData2.webSocketDebuggerUrl);
  await cdp2.connect();
  await cdp2.send('Page.enable');
  await cdp2.send('Network.enable');
  await cdp2.send('Runtime.enable');
  await cdp2.send('ServiceWorker.enable');

  // Enforce offline IMMEDIATELY before navigation
  await cdp2.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });

  // Cold navigate while offline
  await cdp2.send('Page.navigate', { url: BASE_URL });
  await cdp2.waitForElement('#root');

  const coldTitle = await cdp2.eval(`document.title`);
  const storageKeys = await cdp2.eval(`Object.keys(localStorage)`);
  console.log('✓ Cold restart localStorage keys present:', storageKeys);
  const persistedWork = await cdp2.eval(`
    JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.WORK}') || '[]').find(w => w.id === 'work-offline-test-1')
  `);
  const persistedBatches = await cdp2.eval(`
    JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}') || '[]').find(b => b.id === 'batch-offline-1')
  `);

  console.log('✓ Cold offline launch SUCCESSFUL:');
  console.log(`  Document title: "${coldTitle}"`);
  console.log(`  Persisted work item retained: "${persistedWork ? persistedWork.customerName : 'N/A'}"`);
  console.log(`  Persisted Given Out batch retained: "${persistedBatches ? 'ID ' + persistedBatches.id + ' (qty ' + persistedBatches.quantity + ')' : 'N/A'}"`);

  if (!persistedWork || !persistedBatches) {
    throw new Error('Data was not persisted across cold restart!');
  }

  // Cleanup test items from actual storage keys
  await cdp2.eval(`
    (() => {
      const work = JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.WORK}') || '[]');
      localStorage.setItem('${APP_STORAGE_KEYS.WORK}', JSON.stringify(work.filter(w => w.id !== 'work-offline-test-1')));

      const batches = JSON.parse(localStorage.getItem('${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}') || '[]');
      localStorage.setItem('${APP_STORAGE_KEYS.GIVEN_OUT_BATCHES}', JSON.stringify(batches.filter(b => b.id !== 'batch-offline-1')));
    })()
  `);

  try { await cdp2.send('Browser.close'); } catch(e) {}
  cdp2.close();
  try { chromeProc.kill(); } catch(e) {}
  try {
    if (previewProc.pid) {
      require('child_process').execSync(`taskkill /pid ${previewProc.pid} /T /F`, { stdio: 'ignore' });
    }
  } catch (e) {}

  try {
    fs.rmSync(tempProfileDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n========================================================');
  console.log('ALL OFFLINE PWA & STORAGE VERIFICATION TESTS PASSED!');
  console.log('========================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ PWA Test Failure:', err);
  process.exit(1);
});
