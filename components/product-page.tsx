"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "./store-provider";
import { ProductCard } from "./storefront";
import { Empty, LightSwitch, Quantity, Scene } from "./ui";
import {
  finishColors,
  finishLabel,
  localized,
  money,
  priceOf,
  safeImage,
  temperatureLabel,
} from "@/lib/catalog";
import { t } from "@/lib/i18n";

export function ProductPage({ id }: { id: string }) {
  const s = useStore();
  const p = s.products.find((p) => p.id === id && p.active);
  const [color, setColor] = useState("");
  const [temperature, setTemperature] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [gallery, setGallery] = useState(0);

  const pName = localized(p, "name", s.lang);
  const pDesc = localized(p, "description", s.lang);
  const pMat = localized(p, "material", s.lang);

  useEffect(() => {
    if (p) {
      setColor(p.colors[0]);
      setTemperature(p.temperatures[0]);
      setQuantity(1);
      setGallery(0);
      document.title = `${pName || p.name} — ${s.settings.store_name}`;
    }
  }, [p?.id, pName, p?.name, s.settings.store_name]);

  if (s.loading && !p)
    return (
      <main id="main" className="container py-20">
        {t("findingLight", s.lang)}
      </main>
    );

  if (!p)
    return (
      <main id="main" className="container py-20">
        <Empty
          title={t("productUnavailableTitle", s.lang)}
          description={t("productUnavailableDesc", s.lang)}
        >
          <Link className="button button-dark" href="/catalog">
            {t("exploreLighting", s.lang)} ↗
          </Link>
        </Empty>
      </main>
    );

  const category = s.categories.find((c) => c.id === p.category_id);
  const catName = localized(category, "name", s.lang) || t("lighting", s.lang);
  const images = [p.image_off, ...p.gallery];
  const related = s.products
    .filter((other) => other.active && other.id !== p.id)
    .sort(
      (a, b) =>
        Number(b.category_id === p.category_id) -
        Number(a.category_id === p.category_id),
    )
    .slice(0, 4);

  return (
    <main id="main" className="container product-page">
      <div className="breadcrumb">
        <Link href="/">{t("home", s.lang)}</Link>
        <span>/</span>
        <Link href="/catalog">{t("theCollection", s.lang)}</Link>
        <span>/</span>
        <span>{pName}</span>
      </div>

      <div className="product-detail">
        <div className="product-gallery">
          <Scene
            off={images[gallery]}
            on={gallery === 0 ? p.image_on : ""}
            alt={pName}
            className="gallery-main"
            eager
          />
          <div className="gallery-thumbnails">
            {images.map((image, i) => (
              <button
                key={`${image}-${i}`}
                className={gallery === i ? "active" : ""}
                aria-label={`View product image ${i + 1}`}
                aria-pressed={gallery === i}
                onClick={() => setGallery(i)}
              >
                <img src={safeImage(image)} alt="" />
              </button>
            ))}
          </div>
          <div className="gallery-controls">
            <span>
              {gallery === 0 && p.image_on
                ? s.lights
                  ? t("afterDarkGlow", s.lang)
                  : t("daylightNatural", s.lang)
                : t("productDetailLabel", s.lang)}
            </span>
            {p.image_on && <LightSwitch />}
          </div>
        </div>

        <div className="product-info">
          <span className="eyebrow">
            {catName} / {p.sku}
          </span>
          <h1>{pName}</h1>
          <div className="detail-price">
            {money(priceOf(p), s.settings.currency, s.settings.locale)}
            {p.sale_price !== null && (
              <del>
                {money(p.price, s.settings.currency, s.settings.locale)}
              </del>
            )}
          </div>
          <p
            className={`availability ${p.stock === 0 ? "text-[var(--danger)]" : ""}`}
          >
            {p.stock > 0
              ? `● ${t("availableToOrder", s.lang)}`
              : t("soldOut", s.lang)}
          </p>
          <p className="product-description whitespace-pre-line">{pDesc}</p>

          <form
            className="product-options"
            onSubmit={(e) => {
              e.preventDefault();
              s.addToCart(p, color, temperature, quantity);
            }}
          >
            <fieldset>
              <legend>{t("finishColor", s.lang)}</legend>
              <div className="option-buttons">
                {p.colors.map((c) => (
                  <label key={c}>
                    <input
                      type="radio"
                      name="finish"
                      value={c}
                      checked={color === c}
                      onChange={() => setColor(c)}
                      required
                    />
                    <i
                      className="finish-swatch"
                      style={{ background: finishColors[c] || "#999" }}
                    />
                    {finishLabel(c, s.lang)}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>{t("lightTemperature", s.lang)}</legend>
              <div className="option-buttons">
                {p.temperatures.map((temp) => (
                  <label key={temp}>
                    <input
                      type="radio"
                      name="temperature"
                      checked={temperature === temp}
                      onChange={() => setTemperature(temp)}
                      required
                    />
                    {temperatureLabel(temp, s.lang)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="quantity-row">
              <span>{s.lang === "ar" ? "الكمية" : s.lang === "en" ? "Quantity" : "Quantité"}</span>
              <Quantity
                value={quantity}
                onChange={setQuantity}
                max={Math.min(p.stock || 1, 99)}
              />
            </div>

            <button
              className="button button-dark"
              disabled={p.stock <= 0}
              type="submit"
            >
              {p.stock > 0
                ? t("addToYourLightEdit", s.lang)
                : t("soldOut", s.lang)}
              <ArrowUpRight size={18} />
            </button>
            <p className="product-request-note">
              {t("noOnlinePaymentNote", s.lang)}
            </p>
          </form>

          <dl className="spec-list">
            {[
              [t("specMaterial", s.lang), pMat],
              [t("specDimensions", s.lang), p.dimensions],
              [t("specPower", s.lang), p.wattage],
              [t("specReference", s.lang), p.sku],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <section className="related-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("relatedEyebrow", s.lang)}</span>
            <h2>{t("relatedTitle", s.lang)}</h2>
          </div>
          <Link className="text-link" href="/catalog">
            {t("theCollection", s.lang)} <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="product-grid">
          {related.map((item) => (
            <ProductCard product={item} key={item.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
