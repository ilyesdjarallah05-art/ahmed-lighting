"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useStore } from "./store-provider";
import { Empty } from "./ui";
import {
  cartKey,
  finishLabel,
  localized,
  money,
  priceOf,
  safeImage,
  validateCart,
} from "@/lib/catalog";
import { configured, placeOrder } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Customer } from "@/lib/types";

export function OrderPage() {
  const s = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    reference: string;
    demo?: boolean;
  } | null>(null);

  const items = s.cart.map((i) => ({
    ...i,
    product: s.products.find((p) => p.id === i.product_id),
  }));

  const subtotal = items.reduce(
    (n, i) => n + (i.product ? priceOf(i.product) * i.quantity : 0),
    0,
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("website")) return;
    setBusy(true);
    setError("");

    try {
      if (!configured && !s.demo) {
        throw new Error(
          s.lang === "ar"
            ? "الطلب غير متاح حالياً حتى يتم ربط المتجر."
            : s.lang === "en"
              ? "Ordering is not available until the store is connected."
              : "La commande n'est pas disponible tant que la boutique n'est pas connectée.",
        );
      }
      validateCart(s.cart, s.products);
      const customer: Customer = {
        customer_name: String(f.get("customer_name") || "").trim(),
        phone: String(f.get("phone") || "").trim(),
        email: String(f.get("email") || "").trim(),
        city: String(f.get("city") || "").trim(),
        address: String(f.get("address") || "").trim(),
        notes: String(f.get("notes") || "").trim(),
      };
      if (customer.phone.replace(/\D/g, "").length < 7) {
        throw new Error(
          s.lang === "ar"
            ? "يرجى إدخال رقم هاتف صحيح للتواصل."
            : s.lang === "en"
              ? "Please enter a valid phone number."
              : "Veuillez entrer un numéro de téléphone valide.",
        );
      }

      const signature = JSON.stringify({ customer, items: s.cart });
      let request_id = crypto.randomUUID();
      try {
        const previous = JSON.parse(
          sessionStorage.getItem("zitex-order-attempt") || "null",
        );
        if (previous?.signature === signature) request_id = previous.id;
        sessionStorage.setItem(
          "zitex-order-attempt",
          JSON.stringify({ id: request_id, signature }),
        );
      } catch {
        /* storage may be blocked */
      }

      const result = await placeOrder({
        request_id,
        items: s.cart,
        customer,
        website: "",
      });

      setSuccess(result);
      s.setCart([]);
      try {
        sessionStorage.removeItem("zitex-order-attempt");
      } catch {
        /* optional */
      }
      await s.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : s.lang === "ar"
            ? "تعذر إرسال طلبك. يرجى المحاولة مرة أخرى."
            : s.lang === "en"
              ? "Could not submit your order. Please try again."
              : "Impossible d'envoyer votre commande. Veuillez réessayer.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="container order-page">
      <div className="breadcrumb">
        <Link href="/">{t("home", s.lang)}</Link>
        <span>/</span>
        <Link href="/catalog">{t("theCollection", s.lang)}</Link>
        <span>/</span>
        <span>{t("orderTitle", s.lang)}</span>
      </div>

      <div className="catalog-heading">
        <div>
          <span className="eyebrow">{t("heroEyebrow", s.lang)}</span>
          <h1>{t("orderTitle", s.lang)}</h1>
          <p>{t("orderSubtitle", s.lang)}</p>
        </div>
      </div>

      {success ? (
        <div className="order-success">
          <div className="success-mark">
            <Check size={28} />
          </div>
          <h2>
            {success.demo
              ? t("orderDemoTitle", s.lang)
              : t("orderSuccessTitle", s.lang)}
          </h2>
          <p>
            {success.demo
              ? t("orderDemoDesc", s.lang)
              : t("orderSuccessDesc", s.lang)}
          </p>
          <div className="order-reference">
            <small>{t("yourReference", s.lang)}</small>
            {success.reference}
          </div>
          <Link className="button button-dark" href="/catalog">
            {t("keepExploring", s.lang)} <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : !items.length && !s.loading ? (
        <Empty
          title={t("orderEmptyTitle", s.lang)}
          description={t("orderEmptyDesc", s.lang)}
        >
          <Link className="button button-dark" href="/catalog">
            {t("exploreLighting", s.lang)} ↗
          </Link>
        </Empty>
      ) : (
        <div className="checkout-grid">
          <form className="checkout-panel" onSubmit={submit}>
            <h2>{t("formWhereToGo", s.lang)}</h2>
            {s.demo && (
              <p className="notice mb-5">
                {t("demoNoticeOrder", s.lang)}
              </p>
            )}
            <div className="form-grid">
              <label className="form-field">
                {t("fullName", s.lang)}
                <input
                  name="customer_name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>

              <label className="form-field">
                {t("phone", s.lang)}
                <input
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  placeholder={t("phonePlaceholder", s.lang)}
                />
              </label>

              <label className="form-field">
                {t("emailOptional", s.lang)}
                <input
                  name="email"
                  autoComplete="email"
                  type="email"
                  maxLength={150}
                />
              </label>

              <label className="form-field">
                {t("cityRegion", s.lang)}
                <input
                  name="city"
                  autoComplete="address-level2"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>

              <label className="form-field full">
                {t("deliveryAddress", s.lang)}
                <textarea
                  name="address"
                  autoComplete="street-address"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={2}
                />
              </label>

              <label className="form-field full">
                {t("notesField", s.lang)}
                <textarea
                  name="notes"
                  placeholder={t("notesPlaceholder", s.lang)}
                  maxLength={1000}
                  rows={3}
                />
              </label>
            </div>

            <div className="honeypot" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="consent-label">
              <input type="checkbox" required />
              {t("consentText", s.lang)}
            </label>

            {error && (
              <p className="error-note mt-4" role="alert">
                {error}
              </p>
            )}

            <button
              className="button button-dark"
              type="submit"
              disabled={busy || s.loading || !!s.error}
            >
              {busy ? t("sendingRequest", s.lang) : t("sendOrderRequest", s.lang)}
              <ArrowUpRight size={18} />
            </button>

            <p className="text-[11px] text-[var(--muted)] text-center mt-3 mb-0">
              {t("nothingChargedOnline", s.lang)}
            </p>
          </form>

          <aside className="order-summary">
            <h2>{t("orderSummaryTitle", s.lang)}</h2>
            {items.map((i) => (
              <div className="cart-item" key={cartKey(i)}>
                <img
                  src={safeImage(i.product?.image_off || "")}
                  alt={localized(i.product, "name", s.lang) || t("soldOut", s.lang)}
                />
                <div className="cart-item-info">
                  <h3>{localized(i.product, "name", s.lang) || t("soldOut", s.lang)}</h3>
                  <p>
                    {finishLabel(i.color, s.lang)} · {i.temperature}
                  </p>
                  <div className="cart-item-bottom">
                    <span className="text-xs">{s.lang === "ar" ? "الكمية" : s.lang === "en" ? "Qty" : "Qté"} {i.quantity}</span>
                    <span className="cart-item-price">
                      {i.product
                        ? money(
                            priceOf(i.product) * i.quantity,
                            s.settings.currency,
                            s.settings.locale,
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="subtotal-row">
              <span>{t("subtotal", s.lang)}</span>
              <strong>
                {money(subtotal, s.settings.currency, s.settings.locale)}
              </strong>
            </div>
            <p>{t("cartNotice", s.lang)}</p>
            <button
              className="text-link text-xs"
              onClick={() => s.setCartOpen(true)}
            >
              {t("editBasket", s.lang)} ↗
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
