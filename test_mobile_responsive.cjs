const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\Prakitesh\\.gemini\\antigravity\\brain\\93f6e607-16ea-4e1f-89df-a829147c031b';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'mobile_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1400x820', width: 1400, height: 820 },
];

async function ensureSidebarOpen(page, vp) {
  if (vp.width < 1024) {
    const aside = page.locator('aside');
    const isVisible = await aside.evaluate((el) => {
      const transform = window.getComputedStyle(el).transform;
      return !transform.includes('-') && !el.classList.contains('-translate-x-full');
    }).catch(() => false);

    if (!isVisible) {
      const hamburger = page.locator('header button[aria-label="Open navigation menu"]');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300);
      }
    }
  }
}

async function ensureSidebarClosed(page, vp) {
  if (vp.width < 1024) {
    const backdrop = page.locator('.fixed.bg-slate-900\\/60');
    if (await backdrop.isVisible()) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  }
}

const PAGES = [
  {
    id: 'dashboard-financial',
    name: 'Dashboard (Financial)',
    setup: async (page, vp) => {
      await page.goto('http://localhost:5000');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const tabBtn = page.locator('main button:has-text("Financial")');
      if (await tabBtn.isVisible()) await tabBtn.click();
      await page.waitForTimeout(300);
    }
  },
  {
    id: 'dashboard-operations',
    name: 'Dashboard (Operations)',
    setup: async (page, vp) => {
      const tabBtn = page.locator('main button:has-text("Operations")');
      if (await tabBtn.isVisible()) await tabBtn.click();
      await page.waitForTimeout(300);
    }
  },
  {
    id: 'dashboard-inventory',
    name: 'Dashboard (Inventory)',
    setup: async (page, vp) => {
      const tabBtn = page.locator('main button:has-text("Inventory")');
      if (await tabBtn.isVisible()) await tabBtn.click();
      await page.waitForTimeout(300);
    }
  },
  {
    id: 'tasks',
    name: 'Tasks & Schedules',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Tasks & Schedules")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'plots',
    name: 'Farm Plots',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Farm Plots")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'crop-cycles',
    name: 'Crop Cycles',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Crop Cycles")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'accounting',
    name: 'Accounting',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Accounting")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'inventory-items',
    name: 'Inventory Items',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      const itemsBtn = page.locator('aside button:has-text("Inventory Items")');
      if (!await itemsBtn.isVisible()) {
        await page.locator('aside nav button:has-text("Inventory")').click();
        await page.waitForTimeout(250);
      }
      await page.locator('aside button:has-text("Inventory Items")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'inventory-transactions',
    name: 'Transactions Ledger',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      const ledgerBtn = page.locator('aside button:has-text("Transactions Ledger")');
      if (!await ledgerBtn.isVisible()) {
        await page.locator('aside nav button:has-text("Inventory")').click();
        await page.waitForTimeout(250);
      }
      await page.locator('aside button:has-text("Transactions Ledger")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'reports',
    name: 'Analytical Reports',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Analytical Reports")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'yield-trends',
    name: 'Yield Trends',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("Yield Trends & Deficits")').click();
      await page.waitForTimeout(400);
      await ensureSidebarClosed(page, vp);
    }
  },
  {
    id: 'dbms-lab',
    name: 'DBMS Lab',
    setup: async (page, vp) => {
      await ensureSidebarOpen(page, vp);
      await page.locator('aside nav button:has-text("DBMS Lab")').click();
      await page.waitForTimeout(600);
      await ensureSidebarClosed(page, vp);
    }
  },
];

async function runTests() {
  console.log('🚀 Running mobile & desktop responsive test suite via Microsoft Edge (Chromium)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let hasFailure = false;

  for (const vp of VIEWPORTS) {
    console.log(`\n==================================================`);
    console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`==================================================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      try {
        await p.setup(page, vp);

        // Check horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth = await page.evaluate(() => window.innerWidth);
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);

        const ok = scrollWidth <= innerWidth && bodyScrollWidth <= innerWidth;
        console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${p.name.padEnd(26)} -> docScrollWidth: ${scrollWidth}, innerWidth: ${innerWidth}`);

        if (!ok) {
          hasFailure = true;
          console.error(`    ❌ OVERFLOW DETECTED: scrollWidth=${scrollWidth} vs innerWidth=${innerWidth}`);
        }

        // Save screenshots for 390x844 (mobile phone) and 1400x820 (desktop)
        if (vp.name === '390x844' || vp.name === '1400x820') {
          const filename = `${vp.name}_${p.id}.png`;
          const filepath = path.join(SCREENSHOT_DIR, filename);
          await page.screenshot({ path: filepath, fullPage: false });
        }
      } catch (err) {
        console.error(`  [ERR] ${p.name}:`, err.message);
        hasFailure = true;
      }
    }
    await context.close();
  }

  await browser.close();
  if (hasFailure) {
    console.error('\n❌ Responsive test failed with some overflows or errors!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL VIEWPORTS AND ALL 12 PAGES PASSED PERFECTLY!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  }
}

runTests();
