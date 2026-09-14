import test from "node:test";
import assert from "node:assert/strict";
import { filterProducts, defaultFilters, localized, finishLabel, temperatureLabel } from "../lib/catalog.ts";
import { t, getDir } from "../lib/i18n.ts";
import { autoTranslateProduct, autoTranslateCategory, translateLightingText } from "../lib/translate.ts";
import { seed } from "../lib/seed.ts";

test("i18n dictionary supports fr, ar, en and fallback", () => {
  assert.equal(t("lightsTurnOn", "fr"), "Allumer la lumière");
  assert.equal(t("lightsTurnOn", "ar"), "تشغيل الإضاءة");
  assert.equal(t("lightsTurnOn", "en"), "Turn on the lights");

  assert.equal(getDir("ar"), "rtl");
  assert.equal(getDir("fr"), "ltr");
  assert.equal(getDir("en"), "ltr");

  // Parameter replacement
  assert.equal(t("piecesChosen", "fr", { count: 3 }), "3 pièce(s) sélectionnée(s)");
});

test("Finish and temperature labels translate correctly", () => {
  assert.equal(finishLabel("Ivory", "fr"), "Ivoire");
  assert.equal(finishLabel("Ivory", "ar"), "عاجي");
  assert.equal(finishLabel("Ivory", "en"), "Ivory");

  assert.equal(temperatureLabel("2700K", "fr"), "Blanc très chaud (2700K)");
  assert.equal(temperatureLabel("2700K", "ar"), "أبيض دافئ جداً (2700K)");
});

test("Multilingual search matches across French, Arabic and English", () => {
  // Search in French: "suspension"
  const frResults = filterProducts(seed.products, { ...defaultFilters, q: "suspension" });
  assert.ok(frResults.some((p) => p.sku === "ZT-P001"));

  // Search in Arabic: "كتان" (linen)
  const arResults = filterProducts(seed.products, { ...defaultFilters, q: "كتان" });
  assert.ok(arResults.some((p) => p.sku === "ZT-P001"));

  // Search in English: "pendant"
  const enResults = filterProducts(seed.products, { ...defaultFilters, q: "pendant" });
  assert.ok(enResults.some((p) => p.sku === "ZT-P001"));

  // Accent-insensitive search in French: "ceramique" matches "céramique"
  const accentResults = filterProducts(seed.products, { ...defaultFilters, q: "ceramique" });
  assert.ok(accentResults.some((p) => p.sku === "ZT-T001"));
});

test("Auto-translation engine translates lighting terms from French to Arabic & English", () => {
  const result = autoTranslateProduct({
    name: "Suspension en lin Forma",
    description: "Une courbe douce. Une lueur apaisante.",
    material: "Lin · acier thermolaqué",
    badge: "Édition lumière",
  });

  assert.ok(result.name_ar.includes("ثريا") || result.name_ar.includes("كتان"));
  assert.ok(result.name_en.toLowerCase().includes("pendant") || result.name_en.toLowerCase().includes("linen"));
  assert.ok(result.material_ar.includes("كتان"));
  assert.ok(result.badge_ar.includes("إصدار"));

  const cat = autoTranslateCategory("Suspensions");
  assert.equal(cat.name_ar, "ثريات معلقة");
  assert.equal(cat.name_en, "Pendants");
});
