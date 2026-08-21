const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.SHOT_BASE_URL || "https://flowboard-self.vercel.app";
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const EMAIL = `shots+${Date.now()}@flowboard.app`;
const PASSWORD = "password123";
const NAME = "Screenshot Demo";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", name);
}

async function launchBrowser() {
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      const browser = await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
      console.log("launched", channel || "bundled");
      return browser;
    } catch (err) {
      console.log("launch failed", channel || "bundled", err.message.split("\n")[0]);
    }
  }
  throw new Error("No browser available");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await shot(page, "01-landing");

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await shot(page, "02-login");

  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await shot(page, "03-register");

  await page.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded" });
  await shot(page, "04-forgot-password");

  // Create a fresh account so screenshots work even if demo seed differs
  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="name"]', NAME);
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.fill('input[name="confirmPassword"]', PASSWORD);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  } catch {
    console.log("register did not redirect; trying login", EMAIL);
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  }

  await page.waitForTimeout(1500);
  await shot(page, "05-dashboard");

  const routes = [
    ["06-projects", "/dashboard/projects"],
    ["08-tasks", "/dashboard/tasks"],
    ["09-clients", "/dashboard/clients"],
    ["10-invoices", "/dashboard/invoices"],
    ["11-analytics", "/dashboard/analytics"],
    ["12-settings", "/dashboard/settings"],
  ];

  for (const [name, route] of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await shot(page, name);
  }

  await page.goto(`${BASE}/dashboard/projects`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const projectLink = page.locator('a[href*="/dashboard/projects/"]').first();
  if ((await projectLink.count()) > 0) {
    await projectLink.click();
    await page.waitForTimeout(1500);
    await shot(page, "07-project-detail");
  } else {
    console.log("skip project-detail");
  }

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  const themeBtn = page.getByRole("button", { name: /Toggle theme/i }).first();
  if ((await themeBtn.count()) > 0) {
    await themeBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "13-dashboard-dark");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "14-mobile-dashboard");
  const menuBtn = page.getByRole("button", { name: /Open sidebar/i }).first();
  if ((await menuBtn.count()) > 0) {
    await menuBtn.click();
    await page.waitForTimeout(600);
    await shot(page, "15-mobile-sidebar");
  }

  await browser.close();
  console.log("DONE as", EMAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
