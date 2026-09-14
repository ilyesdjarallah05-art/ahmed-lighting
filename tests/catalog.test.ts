import test from "node:test";
import assert from "node:assert/strict";
import {
  filterProducts,
  defaultFilters,
  validateCart,
  safeImage,
  safeLink,
} from "../lib/catalog.ts";
import { seed } from "../lib/seed.ts";
test("Search and multiple filters work together", () => {
  assert.equal(
    filterProducts(seed.products, {
      ...defaultFilters,
      q: "spotlight",
      colors: ["Black"],
      max: "5000",
      temperatures: ["3000K"],
    })[0]?.sku,
    "ZT-S001",
  );
  assert.equal(
    filterProducts(seed.products, {
      ...defaultFilters,
      q: "spotlight",
      colors: ["Ivory"],
    }).length,
    0,
  );
});
test("Special prices drive price filtering and sorting", () => {
  const results = filterProducts(seed.products, {
    ...defaultFilters,
    min: "20000",
    max: "22000",
    sort: "price-asc",
  });
  assert.equal(results[0]?.sku, "ZT-F001");
});
test("Drafts and sold-out products are excluded appropriately", () => {
  const products = seed.products.map((p) => ({ ...p, active: false }));
  assert.equal(filterProducts(products, defaultFilters).length, 0);
  assert.equal(
    filterProducts(
      seed.products.map((p) => ({ ...p, stock: 0 })),
      { ...defaultFilters, available: true },
    ).length,
    0,
  );
});
test("Basket validation adds all finishes before checking stock", () => {
  const p = seed.products[0];
  assert.throws(
    () =>
      validateCart(
        [
          {
            product_id: p.id,
            color: "Ivory",
            temperature: "2700K",
            quantity: 12,
          },
          {
            product_id: p.id,
            color: "Beige",
            temperature: "2700K",
            quantity: 12,
          },
        ],
        [p],
      ),
    /only 20 available/,
  );
  assert.throws(
    () =>
      validateCart(
        [{ product_id: p.id, color: "Red", temperature: "2700K", quantity: 1 }],
        [p],
      ),
    /available finish/,
  );
});
test("Image and social URLs reject executable schemes", () => {
  assert.equal(safeImage("javascript:alert(1)"), "/assets/pendant-off.webp");
  assert.equal(safeLink("javascript:alert(1)"), "");
  assert.equal(safeImage("/assets/table-off.webp"), "/assets/table-off.webp");
});
