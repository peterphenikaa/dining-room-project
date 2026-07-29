const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "doc", "screenshots");
const BASE = "http://localhost:5173";

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await shot(page, "01-login");

  await login(page, "admin@demo.com", "demo");
  await page.waitForTimeout(500);
  await shot(page, "02-admin-dashboard");

  await page.click('a[href="/rooms"]');
  await page.waitForTimeout(800);
  await shot(page, "03-admin-rooms");

  await page.click('a[href="/tables"]');
  await page.waitForTimeout(800);
  await shot(page, "04-admin-tables");

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });

  await login(page, "user@demo.com", "demo");
  await page.waitForTimeout(500);
  await page.click('a[href="/rooms"]');
  await page.waitForTimeout(800);
  await shot(page, "05-user-rooms-readonly");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
