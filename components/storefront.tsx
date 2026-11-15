"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Menu,
  X,
  Plus,
  Sun,
  Heart,
} from "lucide-react";
import { useStore } from "./store-provider";
import {
  CategoryIcon,
  ChevronDown,
  LanguageSwitch,
  LightSwitch,
  Scene,
  Empty,
  Modal,
  Quantity,
} from "./ui";
import {
  cartKey,
  finishColors,
  finishLabel,
  localized,
  money,
  priceOf,
  safeImage,
  safeLink,
} from "@/lib/catalog";
import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export function Brand() {
  const { settings, lang } = useStore();
  return (
    <Link
      href="/"
      className="brand"
      aria-label={`${settings.store_name} ${t("home", lang)}`}
    >
      {settings.logo_url ? (
        <img
          className="brand-logo"
          src={safeImage(settings.logo_url)}
          alt={settings.store_name}
        />
      ) : (
        <>
          <span className="brand-name">{settings.store_name}</span>
          <span className="brand-asterisk" aria-hidden="true">
            ✳
          </span>
        </>
      )}
    </Link>
  );
}

export function Header() {
  const s = useStore();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [query, setQuery] = useState("");

  const categoryLinks = s.categories.map((c) => (
    <Link
      key={c.id}
      href={`/catalog?category=${c.id}`}
      onClick={() => {
        setMenu(false);
        setDropdown(false);
      }}
    >
      {localized(c, "name", s.lang)}
    </Link>
  ));

  return (
    <header id="site-header">
      <div className="announcement">
        {localized(s.settings, "announcement", s.lang)}
      </div>
      <div className="header-main container">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/catalog">{t("allLighting", s.lang)}</Link>
          <div className={`nav-dropdown ${dropdown ? "open" : ""}`}>
            <button
              onClick={() => setDropdown((v) => !v)}
              aria-expanded={dropdown}
              aria-controls="category-menu"
            >
              {t("shopByType", s.lang)}{" "}
              <ChevronDown size={12} className="inline ms-1" />
            </button>
            <div className="nav-dropdown-menu" id="category-menu">
              {categoryLinks}
            </div>
          </div>
          <Link href="/catalog?sort=newest">{t("newArrivals", s.lang)}</Link>
          <Link href="/tour-360">{t("tour360", s.lang)}</Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitch className="header-lang-desktop" />
          <form
            className="header-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <input
              aria-label={t("searchPlaceholder", s.lang)}
              placeholder={t("searchPlaceholder", s.lang)}
              maxLength={120}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label={t("searchLabel", s.lang)}>
              <Search className="icon" />
            </button>
          </form>
          <button
            className="basket-button"
            onClick={() => s.setCartOpen(true)}
            aria-label={`${t("basket", s.lang)}, ${s.cart.reduce((n, i) => n + i.quantity, 0)} items`}
          >
            <ShoppingBag className="icon" />
            <span className="basket-count">
              {s.cart.reduce((n, i) => n + i.quantity, 0)}
            </span>
          </button>
          <button
            className="menu-button"
            onClick={() => setMenu(true)}
            aria-label={t("menu", s.lang)}
          >
            <Menu className="icon" />
          </button>
        </div>
      </div>
      <div className="header-rule container" />
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay-backdrop" />
          <Dialog.Content className="mobile-nav open">
            <div className="drawer-heading">
              <Dialog.Title>{t("exploreBrand", s.lang)}</Dialog.Title>
              <Dialog.Close className="icon-button" aria-label="Close menu">
                <X size={22} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Browse our lighting categories and collections.
            </Dialog.Description>
            <div className="my-3">
              <LanguageSwitch />
            </div>
            <Link href="/catalog" onClick={() => setMenu(false)}>
              {t("allLighting", s.lang)} ↗
            </Link>
            <span className="eyebrow text-[var(--muted)]">
              {t("shopByType", s.lang).toUpperCase()}
            </span>
            <div className="mobile-categories">{categoryLinks}</div>
            <Link href="/catalog?sort=newest" onClick={() => setMenu(false)}>
              {t("newArrivals", s.lang)}
            </Link>
            <Link href="/tour-360" onClick={() => setMenu(false)}>
              {t("tour360", s.lang)}
            </Link>
            <Link href="/catalog?filters=open" onClick={() => setMenu(false)}>
              {t("searchAndFilters", s.lang)}
            </Link>
            <LightSwitch />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  const s = useStore();
  const category = s.categories.find((c) => c.id === p.category_id);
  const pName = localized(p, "name", s.lang);
  const pBadge = localized(p, "badge", s.lang);
  const catName = localized(category, "name", s.lang) || t("lighting", s.lang);

  return (
    <article className="product-card">
      <Link className="card-image-link" href={`/product/${p.id}`}>
        <Scene
          off={p.image_off}
          on={p.image_on}
          alt={pName}
          className="absolute inset-0"
        >
          {p.stock <= 0 ? (
            <span className="card-badge sold-out">{t("soldOut", s.lang)}</span>
          ) : pBadge ? (
            <span className="card-badge">{pBadge}</span>
          ) : null}
          {p.image_on && (
            <span
              className="card-preview-icon"
              title={t("dayNightNotice", s.lang)}
            >
              <Sun size={15} />
            </span>
          )}
        </Scene>
      </Link>
      <div className="card-topline">
        <span>{catName}</span>
        <div
          className="color-dots"
          aria-label={p.colors.map((c) => finishLabel(c, s.lang)).join(", ")}
        >
          {p.colors.map((c) => (
            <i
              key={c}
              style={{ background: finishColors[c] || "#999" }}
              title={finishLabel(c, s.lang)}
            />
          ))}
        </div>
      </div>
      <h3 className="card-name">
        <Link href={`/product/${p.id}`}>{pName}</Link>
      </h3>
      <div className="card-bottom">
        <span className="card-price">
          {money(priceOf(p), s.settings.currency, s.settings.locale)}
          {p.sale_price !== null && (
            <del>{money(p.price, s.settings.currency, s.settings.locale)}</del>
          )}
        </span>
        <button
          className="card-add"
          disabled={p.stock <= 0}
          onClick={() => s.addToCart(p)}
          aria-label={`${t("addToBasket", s.lang)}: ${pName}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </article>
  );
}

export function CartDrawer() {
  const s = useStore();
  const items = s.cart.map((i) => ({
    ...i,
    product: s.products.find((p) => p.id === i.product_id),
  }));
  const subtotal = items.reduce(
    (n, i) => n + (i.product ? priceOf(i.product) * i.quantity : 0),
    0,
  );
  const invalid = items.some(
    (i) => !i.product || !i.product.active || i.quantity > i.product.stock,
  );

  return (
    <Dialog.Root open={s.cartOpen} onOpenChange={s.setCartOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-backdrop" />
        <Dialog.Content className="cart-drawer">
          <div className="drawer-heading">
            <div>
              <Dialog.Title>{t("cartTitle", s.lang)}</Dialog.Title>
              <span>
                {t("piecesChosen", s.lang, {
                  count: s.cart.reduce((n, i) => n + i.quantity, 0),
                })}
              </span>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close basket">
              <X size={21} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {t("cartNotice", s.lang)}
          </Dialog.Description>
          <div className="cart-items">
            {!items.length ? (
              <Empty
                title={t("cartEmptyTitle", s.lang)}
                description={t("cartEmptyDesc", s.lang)}
              >
                <Link
                  className="button button-dark"
                  href="/catalog"
                  onClick={() => s.setCartOpen(false)}
                >
                  {t("exploreLighting", s.lang)} ↗
                </Link>
              </Empty>
            ) : (
              items.map((i) => {
                const itemName = localized(i.product, "name", s.lang);
                return (
                  <div className="cart-item" key={cartKey(i)}>
                    <img
                      src={safeImage(i.product?.image_off || "")}
                      alt={itemName || t("soldOut", s.lang)}
                    />
                    <div className="cart-item-info">
                      <h3>{itemName || t("soldOut", s.lang)}</h3>
                      <p>
                        {finishLabel(i.color, s.lang)} · {i.temperature}
                      </p>
                      <div className="cart-item-bottom">
                        <Quantity
                          value={i.quantity}
                          max={Math.min(i.product?.stock || 99, 99)}
                          onChange={(n) =>
                            s.setCart(
                              s.cart.map((c) =>
                                cartKey(c) === cartKey(i)
                                  ? { ...c, quantity: n }
                                  : c,
                              ),
                            )
                          }
                        />
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
                      <button
                        className="remove-item"
                        onClick={() =>
                          s.setCart(
                            s.cart.filter((c) => cartKey(c) !== cartKey(i)),
                          )
                        }
                      >
                        {t("remove", s.lang)}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {items.length > 0 && (
            <div className="drawer-footer">
              <div className="subtotal-row">
                <span>{t("subtotal", s.lang)}</span>
                <strong>
                  {money(subtotal, s.settings.currency, s.settings.locale)}
                </strong>
              </div>
              <p>
                {invalid
                  ? "Certains articles ne sont plus disponibles. Veuillez mettre à jour votre sélection."
                  : t("cartNotice", s.lang)}
              </p>
              <Link
                className="button button-dark"
                href="/order"
                onClick={() => s.setCartOpen(false)}
              >
                {t("requestOrder", s.lang)} <ArrowUpRight size={17} />
              </Link>
              <button
                className="text-link mt-3 mx-auto flex"
                onClick={() => s.setCartOpen(false)}
              >
                {t("keepExploring", s.lang)}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Footer() {
  const { settings: s, categories, lang } = useStore();
  const [info, setInfo] = useState("");

  return (
    <footer id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>{t("footerTagline", lang)}</p>
          </div>
          <div>
            <h3>{t("findYourLight", lang)}</h3>
            <ul>
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link href={`/catalog?category=${c.id}`}>
                    {localized(c, "name", lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t("aboutUs", lang)}</h3>
            <ul>
              <li>
                <Link href="/tour-360">{t("tour360", lang)}</Link>
              </li>
              <li>
                <button
                  className="bg-transparent p-0"
                  onClick={() => setInfo(t("deliveryAndOrdering", lang))}
                >
                  {t("deliveryAndOrdering", lang)}
                </button>
              </li>
              <li>
                <Link href="/catalog">{t("theCollection", lang)}</Link>
              </li>
              <li>
                <Link href="/admin">{t("storeAdminLink", lang)}</Link>
              </li>
            </ul>
          </div>
          <div className="footer-contact">
            <h3>{t("letsTalkLighting", lang)}</h3>
            {s.phone && (
              <p>
                <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}>{s.phone}</a>
              </p>
            )}
            {s.email && (
              <p>
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </p>
            )}
            {localized(s, "address", lang) && (
              <p>{localized(s, "address", lang)}</p>
            )}
            {!s.phone && !s.email && <p>{t("contactNotice", lang)}</p>}
            <div className="flex gap-4 text-xs">
              {safeLink(s.instagram) && (
                <a
                  href={safeLink(s.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram ↗
                </a>
              )}
              {s.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp ↗
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.store_name}.{" "}
            {t("allRightsReserved", lang)}
          </span>
          <div>
            <span>{localized(s, "tagline", lang)}</span>
            <button
              className="bg-transparent p-0"
              onClick={() => setInfo(t("privacy", lang))}
            >
              {t("privacy", lang)}
            </button>
          </div>
        </div>
      </div>
      <Modal open={!!info} onOpenChange={() => setInfo("")} title={info}>
        <p className="mt-5">
          {info === t("privacy", lang)
            ? localized(s, "privacy_policy", lang)
            : localized(s, "delivery_info", lang)}
        </p>
      </Modal>
    </footer>
  );
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const s = useStore();
  const admin = path.startsWith("/admin");
  if (admin) return children;

  return (
    <>
      <a className="skip-link" href="#main">
        {t("skipToContent", s.lang)}
      </a>
      <Header />
      {s.error && (
        <div className="notice container my-5 flex items-center justify-between gap-4">
          <span>{s.error}</span>
          <button className="text-link" onClick={() => void s.refresh()}>
            {s.lang === "ar"
              ? "إعادة المحاولة"
              : s.lang === "en"
                ? "Retry"
                : "Réessayer"}
          </button>
        </div>
      )}
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}

export function HomePage() {
  const s = useStore();
  const hero =
    s.products.find((p) => p.id === s.settings.hero_product_id && p.active) ||
    s.products.find((p) => p.featured && p.active);
  const featured = s.products.filter((p) => p.active && p.featured).slice(0, 4);

  const heroName = localized(hero, "name", s.lang);

  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-sun" aria-hidden="true">
              ✳
            </span>{" "}
            {t("heroEyebrow", s.lang)}
          </span>
          <h1>
            {t("heroTitlePart1", s.lang)}
            <br />
            {t("heroTitlePart2", s.lang)}
            <br />
            <em>{t("heroTitleEm", s.lang)}</em>
          </h1>
          <p className="whitespace-pre-line">
            {localized(s.settings, "hero_description", s.lang)}
          </p>
          <Link className="button button-dark" href="/catalog">
            {t("heroCta", s.lang)} <ArrowUpRight size={17} />
          </Link>
          <div className="hero-footnote">
            <span className="fine-line" />
            {t("heroFootnote", s.lang)}
          </div>
        </div>
        <Scene
          off={hero?.image_off || "/assets/pendant-off.webp"}
          on={hero?.image_on || "/assets/pendant-on.webp"}
          alt={heroName || "Ahmed lighting hero"}
          className="hero-visual"
          eager
        >
          <span className="edition-badge">
            {t("editionBadge", s.lang)}
            <br />
            <span>{t("vol", s.lang)}</span>
          </span>
          {hero && (
            <div className="hero-product-label">
              <span>
                {t("meetThe", s.lang)} {heroName}
              </span>
              <Link
                href={`/product/${hero.id}`}
                aria-label={`Discover ${heroName}`}
              >
                <ArrowUpRight size={19} />
              </Link>
            </div>
          )}
        </Scene>
      </section>

      <section
        className="category-strip container"
        aria-label={t("shopByType", s.lang)}
      >
        {s.categories.map((c) => (
          <Link key={c.id} href={`/catalog?category=${c.id}`}>
            <CategoryIcon icon={c.icon} />
            {localized(c, "name", s.lang)}
          </Link>
        ))}
      </section>

      <section className="collection-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("everydayCollection", s.lang)}</span>
            <h2>
              {t("everydayTitle", s.lang)} <em>{t("everydayEm", s.lang)}</em>
            </h2>
          </div>
          <Link className="text-link" href="/catalog">
            {t("discoverAll", s.lang)} <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="lighting-toolbar">
          <p>
            <span className="little-dot" />
            {t("atmosphereChange", s.lang)}
          </p>
          <LightSwitch />
        </div>
        <div className="product-grid">
          {s.loading && !featured.length ? (
            <div className="loading-state">{t("findingLight", s.lang)}</div>
          ) : featured.length ? (
            featured.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <Empty
              title={t("noCollectionTitle", s.lang)}
              description={t("noCollectionDesc", s.lang)}
            />
          )}
        </div>
        <p className="scene-note">{t("sceneNoteHome", s.lang)}</p>
      </section>

      <section className="editorial-section container" id="about">
        <div className="editorial-number">{t("philosophyNumber", s.lang)}</div>
        <div>
          <h2>
            {t("philosophyTitle", s.lang)}
            <br />
            <em>{t("philosophyEm", s.lang)}</em>
          </h2>
          <p className="whitespace-pre-line">
            {localized(s.settings, "about", s.lang)}
          </p>
          <Link className="text-link" href="/catalog">
            {t("discoverAll", s.lang)} <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="editorial-mark" aria-hidden="true">
          ✳
        </div>
      </section>

      <section className="service-strip container">
        <div>
          <ArrowUpRight size={25} />
          <p>
            {t("deliveryTitle", s.lang)}
            <small>{t("deliverySub", s.lang)}</small>
          </p>
        </div>
        <div>
          <Heart size={23} />
          <p>
            {t("personalTouchTitle", s.lang)}
            <small>{t("personalTouchSub", s.lang)}</small>
          </p>
        </div>
        <div>
          <Sun size={25} />
          <p>
            {t("seeDifferenceTitle", s.lang)}
            <small>{t("seeDifferenceSub", s.lang)}</small>
          </p>
        </div>
      </section>
    </main>
  );
}
