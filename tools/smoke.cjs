/* Run against a running store: PLAYWRIGHT_MODULE may point to an available Playwright installation. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("output", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000");
  await page.waitForSelector(".product-card");
  await page.evaluate(() => {
    localStorage.removeItem("zitex-demo-v2");
    localStorage.removeItem("zitex-cart");
    localStorage.removeItem("zitex-lights");
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector(".product-card");
  assert.equal(await page.locator(".product-card").count(), 4);
  await page.locator(".product-card").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  assert.equal(
    await page
      .locator(".product-card .day-image")
      .evaluateAll((images) =>
        images.every((i) => i.complete && i.naturalWidth > 0),
      ),
    true,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "output/home-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Turn on the lights" }).click();
  await page.waitForTimeout(250);
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => el.classList.contains("lights-on")),
    true,
  );
  assert.equal(
    await page
      .locator(".hero-visual .night-image")
      .evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
  await page.screenshot({ path: "output/home-night.png", fullPage: true });
  await page.getByRole("button", { name: "Turn off the lights" }).click();
  await page.getByRole("searchbox").count();
  await page
    .getByRole("textbox", { name: "Search lighting" })
    .fill("spotlight");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL("**/catalog?q=spotlight");
  await page.waitForSelector(".product-card");
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("checkbox", { name: "Black", exact: true }).check();
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("checkbox", { name: "Ivory", exact: true }).check();
  await page.getByRole("checkbox", { name: "Black", exact: true }).uncheck();
  await page.getByRole("heading", { name: "No lights found." }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForURL("**/catalog");
  await page.waitForSelector(".product-card");
  await page.screenshot({ path: "output/catalog-desktop.png", fullPage: true });
  await page
    .locator(".card-name")
    .getByRole("link", { name: "Axis track spotlight", exact: true })
    .click();
  await page.waitForURL("**/product/*");
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "3000K" }) })
    .click();
  await page.getByRole("button", { name: "Add to your light edit" }).click();
  await page.getByRole("button", { name: /Open basket/ }).click();
  await page.getByRole("link", { name: "Request your order" }).click();
  await page.waitForURL("**/order");
  await page.getByRole("textbox", { name: "Full name" }).fill("Frontend Test");
  await page.getByRole("textbox", { name: "Phone number" }).fill("0555123456");
  await page.getByRole("textbox", { name: "City / region" }).fill("Algiers");
  await page
    .getByRole("textbox", { name: "Delivery address" })
    .fill("10 Example Street");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: "Send order request" }).click();
  await page
    .getByRole("heading", { name: "Your demo order is saved." })
    .waitFor();
  await page.goto("http://localhost:3000/admin");
  await page.getByRole("button", { name: "Open demo admin" }).click();
  await page.getByRole("button", { name: /Order requests/ }).click();
  await page.locator("td").filter({ hasText: "Frontend Test" }).waitFor();
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Alba ceramic table lamp" })
    .click();
  await page
    .getByRole("textbox", { name: "Product name" })
    .fill("Alba edited table lamp");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByText("Alba edited table lamp", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({ path: "output/admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  await page.waitForSelector(".product-card");
  await page.screenshot({ path: "output/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("link", { name: "Downlights", exact: true })
    .last()
    .click();
  await page.waitForURL("**/catalog?category=downlights");
  await page.waitForSelector(".product-card");
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ path: "output/filters-mobile.png", fullPage: true });
  await page.getByRole("button", { name: /Show 1 results/ }).click();
  await page.screenshot({ path: "output/catalog-mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.goto("http://localhost:3000/admin");
  await page.screenshot({ path: "output/admin-mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  // Leave the user a clean demo, rather than our edited product and test order.
  await page.evaluate(() => {
    localStorage.removeItem("zitex-demo-v2");
    localStorage.removeItem("zitex-cart");
    localStorage.removeItem("zitex-lights");
    sessionStorage.clear();
  });
  console.log(
    "PASS: day/night, search, combined filters, variants, basket, order, admin edit, mobile menu, mobile filters, overflow and runtime errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
