"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useStore } from "./store-provider";
import { Empty, LightSwitch, Modal } from "./ui";
import { ProductCard } from "./storefront";
import {
  defaultFilters,
  filterProducts,
  finishColors,
  finishLabel,
  localized,
  temperatureLabel,
  type Filters,
} from "@/lib/catalog";
import { t } from "@/lib/i18n";

export function CatalogPage() {
  const s = useStore();
  const router = useRouter();
  const urlParams = useSearchParams();
  const [paramString, setParamString] = useState(urlParams.toString());
  const pendingUrl = useRef("");

  useEffect(() => {
    const url = urlParams.toString();
    if (pendingUrl.current && pendingUrl.current !== url) return;
    pendingUrl.current = "";
    setParamString(url);
  }, [urlParams]);

  const params = new URLSearchParams(paramString);
  const filters: Filters = {
    ...defaultFilters,
    q: params.get("q") || "",
    categories: params.getAll("category"),
    colors: params.getAll("color"),
    temperatures: params.getAll("temperature"),
    min: params.get("min") || "",
    max: params.get("max") || "",
    available: params.has("available"),
    preview: params.has("preview"),
    sort: params.get("sort") || "featured",
  };

  const products = filterProducts(s.products, filters);
  const colors = useMemo(
    () => [...new Set(s.products.flatMap((p) => p.colors))].sort(),
    [s.products],
  );
  const mobileOpen = params.get("filters") === "open";

  function update(key: string, value: string | string[] | boolean) {
    const next = new URLSearchParams(paramString);
    next.delete(key);
    if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
    else if (value) next.set(key, String(value));
    pendingUrl.current = next.toString();
    setParamString(next.toString());
    router.replace(`/catalog?${next}`, { scroll: false });
  }

  function toggle(key: string, values: string[], value: string) {
    update(
      key,
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  }

  function reset() {
    pendingUrl.current = "";
    setParamString("");
    router.replace("/catalog", { scroll: false });
  }

  const filterContent = (
    <form onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend>{t("lightingType", s.lang)}</legend>
        <div>
          {s.categories.map((c) => (
            <label className="check-option" key={c.id}>
              <input
                type="checkbox"
                checked={filters.categories.includes(c.id)}
                onChange={() => toggle("category", filters.categories, c.id)}
              />
              <span>
                {localized(c, "name", s.lang)}
                <small>
                  {
                    s.products.filter((p) => p.active && p.category_id === c.id)
                      .length
                  }
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t("finishColor", s.lang)}</legend>
        <div className="finish-options">
          {colors.map((c) => (
            <label className="check-option" key={c}>
              <input
                type="checkbox"
                checked={filters.colors.includes(c)}
                onChange={() => toggle("color", filters.colors, c)}
              />
              <i
                className="finish-swatch"
                style={{ background: finishColors[c] || "#999" }}
              />
              <span>{finishLabel(c, s.lang)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          {t("priceRange", s.lang)}{" "}
          <span className="text-[10px] text-[var(--muted)]">
            ({s.settings.currency})
          </span>
        </legend>
        <div className="price-inputs">
          <label>
            <span>{t("fromPrice", s.lang)}</span>
            <input
              aria-label="Minimum price"
              type="number"
              min={0}
              placeholder="0"
              value={filters.min}
              onChange={(e) => update("min", e.target.value)}
            />
          </label>
          <span>—</span>
          <label>
            <span>{t("toPrice", s.lang)}</span>
            <input
              aria-label="Maximum price"
              type="number"
              min={0}
              placeholder="Max"
              value={filters.max}
              onChange={(e) => update("max", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t("lightTemperature", s.lang)}</legend>
        {[
          ...new Set([
            "2700K",
            "3000K",
            "4000K",
            ...s.products.flatMap((p) => p.temperatures),
          ]),
        ].map((temp) => (
          <label className="check-option" key={temp}>
            <input
              type="checkbox"
              checked={filters.temperatures.includes(temp)}
              onChange={() => toggle("temperature", filters.temperatures, temp)}
            />
            <span>
              {temperatureLabel(temp, s.lang)}
              <small>{temp}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t("availability", s.lang)}</legend>
        <label className="check-option">
          <input
            type="checkbox"
            checked={filters.available}
            onChange={(e) => update("available", e.target.checked)}
          />
          <span>{t("availableOnly", s.lang)}</span>
        </label>
        <label className="check-option">
          <input
            type="checkbox"
            checked={filters.preview}
            onChange={(e) => update("preview", e.target.checked)}
          />
          <span>{t("withNightPreview", s.lang)}</span>
        </label>
      </fieldset>

      <button className="text-link reset-filters" type="button" onClick={reset}>
        {t("resetFilters", s.lang)} ↺
      </button>
      <button
        className="button button-dark mobile-filter-apply"
        type="button"
        onClick={() => update("filters", "")}
      >
        {t("showResults", s.lang, { count: products.length })} →
      </button>
    </form>
  );

  const selectedCategory =
    filters.categories.length === 1
      ? s.categories.find((c) => c.id === filters.categories[0])
      : null;

  const chips = [
    ...filters.categories.map((v) => ({
      key: "category",
      v,
      values: filters.categories,
      label: localized(s.categories.find((c) => c.id === v), "name", s.lang) || v,
    })),
    ...filters.colors.map((v) => ({
      key: "color",
      v,
      values: filters.colors,
      label: finishLabel(v, s.lang),
    })),
    ...filters.temperatures.map((v) => ({
      key: "temperature",
      v,
      values: filters.temperatures,
      label: temperatureLabel(v, s.lang),
    })),
  ];

  return (
    <main id="main" className="container catalog-page">
      <div className="breadcrumb">
        <Link href="/">{t("home", s.lang)}</Link>
        <span>/</span>
        <span>{t("theCollection", s.lang)}</span>
      </div>

      <div className="catalog-heading">
        <div>
          <span className="eyebrow">{t("heroEyebrow", s.lang)}</span>
          <h1>
            {filters.q ? (
              <>
                {t("resultsFor", s.lang)} <em>“{filters.q}”</em>
              </>
            ) : selectedCategory ? (
              <em>{localized(selectedCategory, "name", s.lang)}.</em>
            ) : (
              <em>{t("theCollectionTitle", s.lang)}</em>
            )}
          </h1>
          <p>{t("piecesForCorner", s.lang)}</p>
        </div>
        <LightSwitch />
      </div>

      <div className="catalog-layout">
        <aside className="filters" aria-label={t("filters", s.lang)}>
          <div className="filter-header">
            <h2>{t("refineSearch", s.lang)}</h2>
          </div>
          {filterContent}
        </aside>

        <section className="catalog-results" aria-label="Lighting results">
          <div className="catalog-toolbar">
            <div>
              <button
                className="button button-outline filter-open"
                onClick={() => update("filters", "open")}
              >
                <SlidersHorizontal size={13} /> {t("filters", s.lang)}
              </button>
              <span role="status" aria-live="polite">
                {s.loading
                  ? t("findingLight", s.lang)
                  : t("piecesCount", s.lang, { count: products.length })}
              </span>
            </div>
            <label className="sort-label">
              {t("sortBy", s.lang)}
              <select
                value={filters.sort}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="featured">{t("sortFeatured", s.lang)}</option>
                <option value="price-asc">{t("sortPriceAsc", s.lang)}</option>
                <option value="price-desc">{t("sortPriceDesc", s.lang)}</option>
                <option value="name">{t("sortName", s.lang)}</option>
                <option value="newest">{t("sortNewest", s.lang)}</option>
              </select>
            </label>
          </div>

          <div className="active-filters">
            {filters.q && (
              <button className="filter-chip" onClick={() => update("q", "")}>
                {t("searchLabel", s.lang)}: {filters.q} ×
              </button>
            )}
            {chips.map((c) => (
              <button
                className="filter-chip"
                key={`${c.key}-${c.v}`}
                onClick={() => toggle(c.key, c.values, c.v)}
              >
                {c.label} ×
              </button>
            ))}
            {filters.min && (
              <button className="filter-chip" onClick={() => update("min", "")}>
                {t("fromPrice", s.lang)} {filters.min} ×
              </button>
            )}
            {filters.max && (
              <button className="filter-chip" onClick={() => update("max", "")}>
                {t("toPrice", s.lang)} {filters.max} ×
              </button>
            )}
            {filters.available && (
              <button
                className="filter-chip"
                onClick={() => update("available", false)}
              >
                {t("availability", s.lang)} ×
              </button>
            )}
            {filters.preview && (
              <button
                className="filter-chip"
                onClick={() => update("preview", false)}
              >
                {t("withNightPreview", s.lang)} ×
              </button>
            )}
          </div>

          <div className="product-grid catalog-grid">
            {s.loading && !s.products.length ? (
              <div className="loading-state">{t("findingLight", s.lang)}</div>
            ) : products.length ? (
              products.map((p) => <ProductCard product={p} key={p.id} />)
            ) : (
              <Empty>
                <button className="button button-dark" onClick={reset}>
                  {t("clearFilters", s.lang)} ↺
                </button>
              </Empty>
            )}
          </div>

          <p className="scene-note">
            {t("sceneNoteCatalog", s.lang)}
          </p>
        </section>
      </div>

      <Modal
        open={mobileOpen}
        onOpenChange={(open) => update("filters", open ? "open" : "")}
        title={t("refineSearch", s.lang)}
        className="filters open filter-dialog"
      >
        {filterContent}
      </Modal>
    </main>
  );
}
