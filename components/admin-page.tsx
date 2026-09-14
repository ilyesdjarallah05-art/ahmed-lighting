"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings as SettingsIcon,
  Plus,
  ArrowUpRight,
  LogOut,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Lightbulb,
  Send,
  Languages,
} from "lucide-react";
import { Brand } from "./storefront";
import { Modal } from "./ui";
import { useStore } from "./store-provider";
import * as api from "@/lib/store";
import { finishLabel, money, priceOf, safeImage } from "@/lib/catalog";
import { seed } from "@/lib/seed";
import { autoTranslateCategory, autoTranslateProduct, translateLightingText } from "@/lib/translate";
import type { Product, Order, Settings, StoreData, Language } from "@/lib/types";

const blankProduct = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  name_ar: "",
  name_en: "",
  sku: "",
  category_id: "",
  price: 0,
  sale_price: null,
  stock: 1,
  colors: ["Ivory"],
  temperatures: ["2700K"],
  material: "",
  material_ar: "",
  material_en: "",
  dimensions: "",
  wattage: "",
  description: "",
  description_ar: "",
  description_en: "",
  image_off: "",
  image_on: "",
  gallery: [],
  active: true,
  featured: false,
  badge: "",
  badge_ar: "",
  badge_en: "",
});

const messageOf = (e: unknown) =>
  e instanceof Error ? e.message : "Une erreur est survenue. Veuillez réessayer.";

export function AdminPage() {
  const store = useStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<StoreData>(seed);
  const [tab, setTab] = useState("dashboard");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [remove, setRemove] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);

  async function load() {
    const d = await api.readStore(true);
    setData(d);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await api.isAdmin();
        if (auth && mounted) {
          await load();
          setAuthenticated(true);
        }
      } catch (e) {
        if (mounted) setError(messageOf(e));
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function action(fn: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      await store.refresh();
      store.notify(success);
    } catch (e) {
      setError(messageOf(e));
      store.notify(messageOf(e), true);
    } finally {
      setBusy(false);
    }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api.signIn(String(f.get("email")), String(f.get("password")));
      await load();
      setAuthenticated(true);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  if (checking)
    return (
      <main className="admin-login">
        <p>Ouverture de votre espace de gestion…</p>
      </main>
    );

  if (!authenticated)
    return (
      <main className="admin-login">
        <div className="login-card">
          <Brand />
          <span className="eyebrow mt-8">ESPACE D'ADMINISTRATION</span>
          <h1>
            Votre commerce,
            <br />
            <em>illuminé.</em>
          </h1>
          <p>Gérez votre collection de luminaires, vos coordonnées et vos commandes.</p>

          {api.configured ? (
            <form onSubmit={login} className="grid gap-4">
              <label className="form-field">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="form-field">
                Mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                />
              </label>
              <button className="button button-dark" disabled={busy}>
                {busy ? "Connexion en cours…" : "Accéder à l'administration"}
                <ArrowUpRight size={17} />
              </button>
            </form>
          ) : api.isDemo() ? (
            <>
              <p className="notice">
                Aperçu démo local · Les modifications sont enregistrées sur cet ordinateur. Connectez
                Supabase pour activer les comptes sécurisés et les notifications Telegram.
              </p>
              <button
                className="button button-dark w-full mt-3"
                onClick={() => {
                  api.demoSignIn();
                  void load().then(() => setAuthenticated(true));
                }}
              >
                Ouvrir l'administration de démonstration <ArrowUpRight size={17} />
              </button>
            </>
          ) : (
            <p className="notice">
              Veuillez connecter votre projet Supabase dans .env.local pour activer la connexion administrateur.
            </p>
          )}
          {error && (
            <p role="alert" className="error-note mt-4">
              {error}
            </p>
          )}
          <Link href="/" className="text-link mt-6">
            Retour à la boutique ↗
          </Link>
        </div>
      </main>
    );

  const tabs = [
    { id: "dashboard", name: "Tableau de bord", icon: LayoutDashboard },
    { id: "products", name: "Produits", icon: Package },
    { id: "orders", name: "Commandes", icon: ShoppingBag },
    { id: "settings", name: "Réglages de la boutique", icon: SettingsIcon },
  ];

  const newOrders = data.orders.filter((o) => o.status === "new");
  const shownProducts = data.products.filter((p) =>
    `${p.name} ${p.name_ar || ""} ${p.name_en || ""} ${p.sku} ${p.category_id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const shownOrders = data.orders.filter(
    (o) => orderStatus === "all" || o.status === orderStatus,
  );

  function exportOrders() {
    const rows = [
      [
        "Reference",
        "Nom",
        "Telephone",
        "Ville",
        "Sous-total",
        "Devise",
        "Statut",
        "Telegram",
        "Date",
      ],
      ...shownOrders.map((o) => [
        o.reference,
        o.customer_name,
        o.phone,
        o.city,
        String(o.subtotal),
        o.currency,
        o.status,
        o.telegram_status,
        o.created_at,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map(
            (v) =>
              `"${(/^[=+\-@\t\r]/.test(v) ? "'" : "") + v.replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "zitex-commandes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const ordersTable = (orders: Order[]) =>
    orders.length ? (
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Sous-total</th>
              <th>Telegram</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.reference}</strong>
                  <small>{new Date(o.created_at).toLocaleDateString()}</small>
                </td>
                <td>
                  {o.customer_name}
                  <small>
                    {o.city} · {o.phone}
                  </small>
                </td>
                <td>{money(o.subtotal, o.currency)}</td>
                <td>
                  <span className={`status-pill ${o.telegram_status}`}>
                    {o.telegram_status === "sent"
                      ? "Envoyé"
                      : o.telegram_status === "demo"
                        ? "Démo"
                        : o.telegram_status === "failed"
                          ? "Échec"
                          : "En attente"}
                  </span>
                  {o.telegram_status === "failed" && (
                    <button
                      title="Réessayer l'envoi Telegram"
                      className="admin-icon"
                      disabled={busy}
                      onClick={() =>
                        void action(
                          () => api.retryTelegram(o.id),
                          "Notification Telegram renvoyée.",
                        )
                      }
                    >
                      <Send size={13} />
                    </button>
                  )}
                </td>
                <td>
                  <select
                    className="status-select"
                    value={o.status}
                    disabled={busy || o.status === "cancelled"}
                    onChange={(e) =>
                      void action(
                        () =>
                          api.updateOrder(
                            o.id,
                            e.target.value as Order["status"],
                          ),
                        "Statut de la commande mis à jour.",
                      )
                    }
                  >
                    <option value="new">Nouveau</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </td>
                <td>
                  <button
                    className="admin-icon"
                    onClick={() => setSelectedOrder(o)}
                    aria-label={`Détails de la commande ${o.reference}`}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="admin-empty">
        <ShoppingBag size={28} />
        <h3>Aucune commande pour le moment.</h3>
        <p>Les demandes des clients apparaîtront ici avec leurs coordonnées et leurs articles choisis.</p>
      </div>
    );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <span className="eyebrow">ESPACE DE GESTION</span>
        <nav aria-label="Navigation administration">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => {
                setTab(t.id);
                setError("");
              }}
            >
              <t.icon size={17} />
              {t.name}
              {t.id === "orders" && newOrders.length > 0 && (
                <span>{newOrders.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <p>
            <Lightbulb size={15} />
            {api.isDemo() ? "Mode démonstration locale" : "Connecté à Supabase"}
          </p>
          <button
            onClick={() =>
              void api
                .signOut()
                .then(() => setAuthenticated(false))
                .catch((e) => setError(messageOf(e)))
            }
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main id="main" className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">PILOTAGE DU MAGASIN</span>
            <h1>{tabs.find((t) => t.id === tab)?.name}</h1>
          </div>
          <div className="admin-top-actions">
            <Link className="button button-outline" href="/" target="_blank">
              Voir la boutique <ArrowUpRight size={15} />
            </Link>
            <button
              className="button button-dark"
              onClick={() =>
                setEdit({
                  ...blankProduct(),
                  category_id: data.categories[0]?.id || "",
                })
              }
            >
              <Plus size={15} />
              Nouveau produit
            </button>
          </div>
        </header>

        {error && (
          <p className="notice error-note" role="alert">
            {error}
          </p>
        )}

        {tab === "dashboard" && (
          <>
            <div className="stats-grid">
              <article>
                <span>Produits en ligne</span>
                <strong>{data.products.filter((p) => p.active).length}</strong>
                <small>Modèles visibles aux clients</small>
              </article>
              <article>
                <span>Nouvelles demandes</span>
                <strong>{newOrders.length}</strong>
                <small>En attente de confirmation</small>
              </article>
              <article>
                <span>Total commandes</span>
                <strong>{data.orders.length}</strong>
                <small>Historique complet</small>
              </article>
              <article>
                <span>Montant demandé</span>
                <strong className="stat-money">
                  {money(
                    data.orders
                      .filter((o) => o.status !== "cancelled")
                      .reduce((n, o) => n + o.subtotal, 0),
                    data.settings.currency,
                  )}
                </strong>
                <small>Hors frais de livraison · Paiement à la réception</small>
              </article>
            </div>

            <div className="admin-card">
              <div className="admin-section-heading">
                <h2>
                  Dernières demandes <span>{newOrders.length} nouvelles</span>
                </h2>
                <button
                  className="text-link"
                  onClick={() => {
                    setTab("orders");
                    setOrderStatus("new");
                  }}
                >
                  Gérer toutes les commandes ↗
                </button>
              </div>
              {ordersTable(newOrders.slice(0, 5))}
            </div>
          </>
        )}

        {tab === "products" && (
          <div className="admin-card">
            <div className="admin-section-heading">
              <h2>
                Catalogue <span>{data.products.length} articles</span>
              </h2>
              <div className="flex gap-3">
                <input
                  className="admin-search"
                  placeholder="Rechercher par nom, SKU ou catégorie…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  className="button button-outline"
                  onClick={() => setCategoryModal(true)}
                >
                  <Plus size={14} />
                  Ajouter une catégorie
                </button>
              </div>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Aperçu Nuit</th>
                    <th>Visibilité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shownProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={safeImage(p.image_off)} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            {p.name_ar && <small className="text-[10px] text-[var(--muted)]">{p.name_ar}</small>}
                            <small>{p.sku}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {
                          data.categories.find((c) => c.id === p.category_id)
                            ?.name
                        }
                      </td>
                      <td>{money(priceOf(p), data.settings.currency)}</td>
                      <td>{p.stock}</td>
                      <td>{p.image_on ? "Jour + Nuit ✓" : "Jour seul"}</td>
                      <td>
                        <span
                          className={`status-pill ${p.active ? "sent" : ""}`}
                        >
                          {p.active ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td>
                        <div className="flex">
                          <button
                            className="admin-icon"
                            title="Modifier le produit"
                            aria-label={`Modifier ${p.name}`}
                            onClick={() => setEdit(p)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="admin-icon"
                            title={p.active ? "Désactiver" : "Mettre en ligne"}
                            aria-label={`${p.active ? "Désactiver" : "Mettre en ligne"} ${p.name}`}
                            disabled={busy}
                            onClick={() =>
                              void action(
                                () =>
                                  api.saveProduct({ ...p, active: !p.active }),
                                "Visibilité mise à jour.",
                              )
                            }
                          >
                            {p.active ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </button>
                          <button
                            className="admin-icon danger"
                            title="Supprimer le produit"
                            aria-label={`Supprimer ${p.name}`}
                            onClick={() => setRemove(p)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shownProducts.length && (
                <div className="admin-empty">
                  Aucun produit ne correspond à votre recherche.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="admin-card">
            <div className="admin-section-heading">
              <h2>
                Commandes reçues <span>{data.orders.length} total</span>
              </h2>
              <div className="flex gap-3">
                <select
                  aria-label="Filtrer par statut"
                  className="status-select"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  <option value="all">Toutes les demandes</option>
                  <option value="new">Nouveau</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <button
                  className="button button-outline"
                  onClick={exportOrders}
                >
                  <Download size={14} />
                  Exporter CSV
                </button>
              </div>
            </div>
            {ordersTable(shownOrders)}
          </div>
        )}

        {tab === "settings" && (
          <SettingsForm
            settings={data.settings}
            products={data.products}
            onSave={(settings) =>
              action(() => api.saveSettings(settings), "Réglages du magasin enregistrés.")
            }
          />
        )}
      </main>

      <Modal
        open={!!edit}
        onOpenChange={(v) => {
          if (!v && !busy) setEdit(null);
        }}
        title={
          edit && data.products.some((p) => p.id === edit.id)
            ? "Modifier le luminaire"
            : "Ajouter un nouveau luminaire"
        }
        className="product-edit-modal"
      >
        {edit && (
          <ProductForm
            key={edit.id}
            product={edit}
            categories={data.categories}
            onSave={async (p) => {
              await api.saveProduct(p);
              await load();
              await store.refresh();
              setEdit(null);
              store.notify("Luminaire enregistré avec succès.");
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!remove}
        onOpenChange={() => setRemove(null)}
        title="Supprimer ce luminaire ?"
      >
        <p className="mt-5">
          « {remove?.name} » sera retiré de votre collection. Les commandes existantes conserveront les détails de cet article.
        </p>
        <div className="flex gap-3">
          <button
            className="button button-outline"
            onClick={() => setRemove(null)}
          >
            Annuler
          </button>
          <button
            disabled={busy}
            className="button button-dark"
            onClick={() =>
              void action(async () => {
                await api.deleteProduct(remove!.id);
                setRemove(null);
              }, "Produit supprimé.")
            }
          >
            Confirmer la suppression
          </button>
        </div>
      </Modal>

      <Modal
        open={categoryModal}
        onOpenChange={setCategoryModal}
        title="Créer une nouvelle catégorie"
      >
        <CategoryCreateForm
          onSave={async (category) => {
            await action(async () => {
              await api.saveCategory(category);
              setCategoryModal(false);
            }, "Catégorie ajoutée.");
          }}
          busy={busy}
          totalCategories={data.categories.length}
        />
      </Modal>

      <Modal
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        title={selectedOrder?.reference || "Détails de la commande"}
      >
        {selectedOrder && (
          <div className="order-details">
            <h3 className="mt-5 text-base">{selectedOrder.customer_name}</h3>
            <p>
              {selectedOrder.phone}
              <br />
              {selectedOrder.email}
              <br />
              {selectedOrder.city}
              <br />
              {selectedOrder.address}
            </p>
            {selectedOrder.notes && (
              <p className="notice">{selectedOrder.notes}</p>
            )}
            {selectedOrder.items.map((i, n) => (
              <div className="cart-item" key={n}>
                <img src={safeImage(i.image_off)} alt="" />
                <div>
                  <strong className="text-sm">{i.name}</strong>
                  <p>
                    {i.sku} · {finishLabel(i.color)} · {i.temperature}
                    <br />
                    Qté {i.quantity} ·{" "}
                    {money(i.unit_price * i.quantity, selectedOrder.currency)}
                  </p>
                </div>
              </div>
            ))}
            <div className="subtotal-row mt-5">
              <span>Sous-total</span>
              <strong>
                {money(selectedOrder.subtotal, selectedOrder.currency)}
              </strong>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">
              Les frais de livraison et la date d'envoi sont convenus avec le client par téléphone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CategoryCreateForm({
  onSave,
  busy,
  totalCategories,
}: {
  onSave: (cat: { id: string; name: string; name_ar?: string; name_en?: string; icon: string; position: number }) => Promise<void>;
  busy: boolean;
  totalCategories: number;
}) {
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("ceiling");

  function handleAutoTranslate() {
    if (!name) return;
    const res = autoTranslateCategory(name);
    setNameAr(res.name_ar);
    setNameEn(res.name_en);
  }

  return (
    <form
      className="grid gap-4 mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        const cleanName = name.trim();
        const id = cleanName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (!id) return;
        void onSave({
          id,
          name: cleanName,
          name_ar: nameAr.trim(),
          name_en: nameEn.trim(),
          icon,
          position: totalCategories + 1,
        });
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">Traductions disponibles pour vos clients</span>
        <button
          type="button"
          className="button button-outline text-xs py-1 px-3 min-h-0 h-auto"
          onClick={handleAutoTranslate}
          disabled={!name}
        >
          ✨ Auto-traduire
        </button>
      </div>

      <label className="form-field">
        Nom de la catégorie (Français) *
        <input
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Appliques murales"
        />
      </label>

      <label className="form-field" dir="rtl">
        اسم الفئة (بالعربية)
        <input
          maxLength={60}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder="مثال: إضاءة جدارية"
        />
      </label>

      <label className="form-field">
        Category name (English)
        <input
          maxLength={60}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Ex. Wall sconces"
        />
      </label>

      <label className="form-field">
        Icône
        <select value={icon} onChange={(e) => setIcon(e.target.value)}>
          <option value="pendant">Suspension (Pendant)</option>
          <option value="table">Lampe de table (Table)</option>
          <option value="floor">Lampadaire (Floor)</option>
          <option value="spotlight">Spot orientable (Spotlight)</option>
          <option value="downlight">Spot encastré (Downlight)</option>
          <option value="ceiling">Plafonnier / Éclairage général (Ceiling)</option>
        </select>
      </label>

      <button disabled={busy} className="button button-dark">
        Créer la catégorie +
      </button>
    </form>
  );
}

function ProductForm({
  product,
  categories,
  onSave,
}: {
  product: Product;
  categories: StoreData["categories"];
  onSave: (p: Product) => Promise<void>;
}) {
  const [p, setP] = useState(product);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [langTab, setLangTab] = useState<Language>("fr");

  const field = (key: keyof Product, value: unknown) =>
    setP((prev) => ({ ...prev, [key]: value }));

  function handleAutoTranslate() {
    if (!p.name) return;
    const translated = autoTranslateProduct({
      name: p.name,
      description: p.description,
      material: p.material,
      badge: p.badge,
    });
    setP((prev) => ({
      ...prev,
      name_ar: prev.name_ar || translated.name_ar,
      name_en: prev.name_en || translated.name_en,
      description_ar: prev.description_ar || translated.description_ar,
      description_en: prev.description_en || translated.description_en,
      material_ar: prev.material_ar || translated.material_ar,
      material_en: prev.material_en || translated.material_en,
      badge_ar: prev.badge_ar || translated.badge_ar,
      badge_en: prev.badge_en || translated.badge_en,
    }));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const next: Product = {
        ...p,
        name: p.name.trim(),
        name_ar: (p.name_ar || "").trim(),
        name_en: (p.name_en || "").trim(),
        sku: p.sku.trim(),
        material: (p.material || "").trim(),
        material_ar: (p.material_ar || "").trim(),
        material_en: (p.material_en || "").trim(),
        description: (p.description || "").trim(),
        description_ar: (p.description_ar || "").trim(),
        description_en: (p.description_en || "").trim(),
        badge: (p.badge || "").trim(),
        badge_ar: (p.badge_ar || "").trim(),
        badge_en: (p.badge_en || "").trim(),
        colors: String(f.get("colors"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        temperatures: String(f.get("temperatures"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        gallery: String(f.get("gallery"))
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (!next.colors.length || !next.temperatures.length)
        throw new Error("Ajoutez au moins une finition/couleur et une température de lumière.");
      if (next.sale_price !== null && next.sale_price >= next.price)
        throw new Error("Le prix promotionnel doit être inférieur au prix normal.");

      const off = f.get("off_file") as File;
      const on = f.get("on_file") as File;
      if (off?.size) next.image_off = await api.uploadImage(off);
      if (on?.size) next.image_on = await api.uploadImage(on);
      if (!next.image_off)
        throw new Error("Veuillez renseigner une image de jour pour le produit.");

      await onSave(next);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="admin-form mt-5">
      <div className="full bg-[var(--surface)] p-4 rounded border border-[var(--line)] mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded border transition ${
                langTab === "fr"
                  ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
                  : "bg-transparent border-[var(--line)]"
              }`}
              onClick={() => setLangTab("fr")}
            >
              🇫🇷 Français (Principal)
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded border transition ${
                langTab === "ar"
                  ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
                  : "bg-transparent border-[var(--line)]"
              }`}
              onClick={() => setLangTab("ar")}
            >
              🇸🇦 العربية
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded border transition ${
                langTab === "en"
                  ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
                  : "bg-transparent border-[var(--line)]"
              }`}
              onClick={() => setLangTab("en")}
            >
              🇬🇧 English
            </button>
          </div>
          <button
            type="button"
            className="button button-outline text-xs py-1.5 px-3 min-h-0 h-auto"
            onClick={handleAutoTranslate}
            title="Traduire automatiquement le titre, la description, la matière et le badge depuis le français"
            disabled={!p.name}
          >
            ✨ Auto-traduire (FR → AR & EN)
          </button>
        </div>

        {langTab === "fr" && (
          <div className="grid gap-3">
            <label className="form-field">
              Nom du produit (Français) *
              <input
                required
                maxLength={100}
                value={p.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="Ex. Suspension en lin Forma"
              />
            </label>
            <label className="form-field">
              Description (Français)
              <textarea
                rows={3}
                maxLength={3000}
                value={p.description}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Une courbe douce. Une lueur apaisante…"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-field">
                Matière / Matériaux (Français)
                <input
                  value={p.material}
                  onChange={(e) => field("material", e.target.value)}
                  maxLength={150}
                  placeholder="Ex. Lin · acier thermolaqué"
                />
              </label>
              <label className="form-field">
                Badge / Étiquette (Français)
                <input
                  value={p.badge}
                  onChange={(e) => field("badge", e.target.value)}
                  maxLength={40}
                  placeholder="Ex. Édition lumière, Coup de cœur"
                />
              </label>
            </div>
          </div>
        )}

        {langTab === "ar" && (
          <div className="grid gap-3" dir="rtl">
            <label className="form-field">
              اسم المنتج (بالعربية)
              <input
                maxLength={100}
                value={p.name_ar || ""}
                onChange={(e) => field("name_ar", e.target.value)}
                placeholder="مثال: ثريا كتان فورما"
              />
            </label>
            <label className="form-field">
              الوصف (بالعربية)
              <textarea
                rows={3}
                maxLength={3000}
                value={p.description_ar || ""}
                onChange={(e) => field("description_ar", e.target.value)}
                placeholder="انحناءة انسيابية وتوهج دافئ ومريح…"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-field">
                المادة (بالعربية)
                <input
                  value={p.material_ar || ""}
                  onChange={(e) => field("material_ar", e.target.value)}
                  maxLength={150}
                  placeholder="مثال: كتان · فولاذ مطلي"
                />
              </label>
              <label className="form-field">
                شارة المنتج (بالعربية)
                <input
                  value={p.badge_ar || ""}
                  onChange={(e) => field("badge_ar", e.target.value)}
                  maxLength={40}
                  placeholder="مثال: إصدار الإضاءة"
                />
              </label>
            </div>
          </div>
        )}

        {langTab === "en" && (
          <div className="grid gap-3">
            <label className="form-field">
              Product name (English)
              <input
                maxLength={100}
                value={p.name_en || ""}
                onChange={(e) => field("name_en", e.target.value)}
                placeholder="Ex. Forma linen pendant"
              />
            </label>
            <label className="form-field">
              Description (English)
              <textarea
                rows={3}
                maxLength={3000}
                value={p.description_en || ""}
                onChange={(e) => field("description_en", e.target.value)}
                placeholder="A gentle curve. A softer glow…"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-field">
                Material (English)
                <input
                  value={p.material_en || ""}
                  onChange={(e) => field("material_en", e.target.value)}
                  maxLength={150}
                  placeholder="Ex. Linen · powder-coated steel"
                />
              </label>
              <label className="form-field">
                Badge / Label (English)
                <input
                  value={p.badge_en || ""}
                  onChange={(e) => field("badge_en", e.target.value)}
                  maxLength={40}
                  placeholder="Ex. The light edit"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="form-grid">
        <label className="form-field">
          Référence / SKU *
          <input
            required
            maxLength={50}
            value={p.sku}
            onChange={(e) => field("sku", e.target.value)}
            placeholder="Ex. ZT-P001"
          />
        </label>
        <label className="form-field">
          Catégorie *
          <select
            required
            value={p.category_id}
            onChange={(e) => field("category_id", e.target.value)}
          >
            <option value="" disabled>
              Sélectionnez une catégorie
            </option>
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Stock disponible *
          <input
            type="number"
            min={0}
            step={1}
            required
            value={p.stock}
            onChange={(e) => field("stock", Number(e.target.value))}
          />
        </label>
        <label className="form-field">
          Prix standard *
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={p.price}
            onChange={(e) => field("price", Number(e.target.value))}
          />
        </label>
        <label className="form-field">
          Prix promo (facultatif)
          <input
            type="number"
            min={0}
            step="0.01"
            value={p.sale_price ?? ""}
            onChange={(e) =>
              field(
                "sale_price",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </label>
        <label className="form-field">
          Finitions / Couleurs *
          <input
            name="colors"
            required
            defaultValue={p.colors.join(", ")}
            placeholder="Ivory, Beige, Black, Brass"
          />
          <small>Séparez par des virgules (ex: Ivory, Black, Brass).</small>
        </label>
        <label className="form-field">
          Températures de lumière *
          <input
            name="temperatures"
            required
            defaultValue={p.temperatures.join(", ")}
            placeholder="2700K, 3000K, 4000K"
          />
        </label>
        <label className="form-field">
          Dimensions
          <input
            value={p.dimensions}
            onChange={(e) => field("dimensions", e.target.value)}
            maxLength={150}
            placeholder="Ex. Ø 45 × H 28 cm"
          />
        </label>
        <label className="form-field">
          Puissance / Culot
          <input
            value={p.wattage}
            onChange={(e) => field("wattage", e.target.value)}
            maxLength={100}
            placeholder="Ex. E27 · max. 40W ou 12W LED"
          />
        </label>

        <div className="image-pair-field full">
          <div>
            <h3>01 / Image de jour (Éteint) *</h3>
            {p.image_off && (
              <img src={safeImage(p.image_off)} alt="Image de jour actuelle" />
            )}
            <label className="form-field">
              URL de l'image
              <input
                value={p.image_off}
                onChange={(e) => field("image_off", e.target.value)}
                placeholder="/assets/… ou https://…"
              />
            </label>
            <label className="form-field mt-3">
              Ou téléverser un fichier
              <input
                name="off_file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
              />
            </label>
          </div>
          <div>
            <h3>02 / Image de nuit (Allumé)</h3>
            {p.image_on && (
              <img src={safeImage(p.image_on)} alt="Image de nuit actuelle" />
            )}
            <label className="form-field">
              URL de l'image
              <input
                value={p.image_on}
                onChange={(e) => field("image_on", e.target.value)}
                placeholder="Image identique avec la lumière allumée"
              />
            </label>
            <label className="form-field mt-3">
              Ou téléverser un fichier
              <input
                name="on_file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
              />
            </label>
          </div>
          <p className="full">
            Pour un effet optimal avec le bouton « Allumer la lumière », utilisez le même cadrage pour l'image de jour et l'image de nuit.
          </p>
        </div>

        <label className="form-field full">
          Galerie d'images supplémentaires
          <textarea
            name="gallery"
            rows={2}
            defaultValue={p.gallery.join("\n")}
            placeholder="Une URL d'image par ligne"
          />
        </label>

        <div className="flex gap-6 full text-xs">
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={p.active}
              onChange={(e) => field("active", e.target.checked)}
            />
            Publier le produit (visible sur la boutique)
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={p.featured}
              onChange={(e) => field("featured", e.target.checked)}
            />
            Mettre en avant sur la page d'accueil
          </label>
        </div>
      </div>

      {error && (
        <p className="error-note mt-4" role="alert">
          {error}
        </p>
      )}

      <button disabled={busy} className="button button-dark w-full mt-6">
        {busy ? "Enregistrement en cours…" : "Enregistrer le luminaire"}
        <ArrowUpRight size={17} />
      </button>
    </form>
  );
}

function SettingsForm({
  settings: initial,
  products,
  onSave,
}: {
  settings: Settings;
  products: Product[];
  onSave: (s: Settings) => Promise<void>;
}) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settingsTab, setSettingsTab] = useState<Language>("fr");

  const field = (key: keyof Settings, value: string) =>
    setS((prev) => ({ ...prev, [key]: value }));

  function handleAutoTranslateSettings() {
    if (!s.announcement && !s.hero_description && !s.about) return;
    setS((prev) => ({
      ...prev,
      tagline_ar: prev.tagline_ar || translateLightingText(prev.tagline, "ar"),
      tagline_en: prev.tagline_en || translateLightingText(prev.tagline, "en"),
      announcement_ar: prev.announcement_ar || translateLightingText(prev.announcement, "ar"),
      announcement_en: prev.announcement_en || translateLightingText(prev.announcement, "en"),
      hero_description_ar: prev.hero_description_ar || translateLightingText(prev.hero_description, "ar"),
      hero_description_en: prev.hero_description_en || translateLightingText(prev.hero_description, "en"),
      about_ar: prev.about_ar || translateLightingText(prev.about, "ar"),
      about_en: prev.about_en || translateLightingText(prev.about, "en"),
      address_ar: prev.address_ar || prev.address,
      address_en: prev.address_en || prev.address,
      delivery_info_ar: prev.delivery_info_ar || translateLightingText(prev.delivery_info, "ar"),
      delivery_info_en: prev.delivery_info_en || translateLightingText(prev.delivery_info, "en"),
      privacy_policy_ar: prev.privacy_policy_ar || translateLightingText(prev.privacy_policy, "ar"),
      privacy_policy_en: prev.privacy_policy_en || translateLightingText(prev.privacy_policy, "en"),
    }));
  }

  return (
    <form
      className="admin-card settings-card"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const currency = s.currency.toUpperCase();
          new Intl.NumberFormat(s.locale, { style: "currency", currency });
          const logo = f.get("logo") as File;
          const logo_url = logo?.size
            ? await api.uploadImage(logo)
            : s.logo_url;
          const next = { ...s, currency, logo_url };
          await onSave(next);
          setS(next);
        } catch (e) {
          setError(messageOf(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="admin-section-heading">
        <h2>Personnalisation du magasin</h2>
        <button
          type="button"
          className="button button-outline text-xs py-1.5 px-3 min-h-0 h-auto"
          onClick={handleAutoTranslateSettings}
        >
          ✨ Auto-traduire les textes (FR → AR & EN)
        </button>
      </div>

      <div className="form-grid">
        <label className="form-field">
          Nom de la boutique *
          <input
            required
            maxLength={60}
            value={s.store_name}
            onChange={(e) => field("store_name", e.target.value)}
          />
        </label>
        <label className="form-field">
          Devise (Code ISO à 3 lettres) *
          <input
            required
            minLength={3}
            maxLength={3}
            value={s.currency}
            onChange={(e) => field("currency", e.target.value.toUpperCase())}
            placeholder="DZD"
          />
        </label>
        <label className="form-field">
          Format des prix et nombres
          <select
            value={s.locale}
            onChange={(e) => field("locale", e.target.value)}
          >
            <option value="fr-DZ">Français (Algérie)</option>
            <option value="ar-DZ">العربية (الجزائر)</option>
            <option value="en-DZ">English (Algeria)</option>
            <option value="fr-FR">Français (France)</option>
            <option value="en-US">English (United States)</option>
          </select>
        </label>
        <label className="form-field">
          Produit vedette de la page d'accueil
          <select
            value={s.hero_product_id}
            onChange={(e) => field("hero_product_id", e.target.value)}
          >
            <option value="">Premier produit vedette</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          URL du logo
          <input
            value={s.logo_url}
            onChange={(e) => field("logo_url", e.target.value)}
            placeholder="Laissez vide pour utiliser le texte stylisé"
          />
        </label>
        <label className="form-field">
          Ou téléverser votre logo
          <input
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          {s.logo_url && (
            <img
              src={safeImage(s.logo_url)}
              alt="Logo actuel"
              className="max-h-16 max-w-32 object-contain mt-2"
            />
          )}
        </label>

        <div className="full bg-[var(--surface)] p-4 rounded border border-[var(--line)] my-2">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded border ${
                settingsTab === "fr"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-transparent"
              }`}
              onClick={() => setSettingsTab("fr")}
            >
              🇫🇷 Textes en Français
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded border ${
                settingsTab === "ar"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-transparent"
              }`}
              onClick={() => setSettingsTab("ar")}
            >
              🇸🇦 النصوص بالعربية
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded border ${
                settingsTab === "en"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-transparent"
              }`}
              onClick={() => setSettingsTab("en")}
            >
              🇬🇧 English Texts
            </button>
          </div>

          {settingsTab === "fr" && (
            <div className="grid gap-3">
              <label className="form-field">
                Slogan (Français)
                <input
                  maxLength={100}
                  value={s.tagline}
                  onChange={(e) => field("tagline", e.target.value)}
                  placeholder="L'éclairage, pensé pour vous."
                />
              </label>
              <label className="form-field">
                Bandeau d'annonce supérieur (Français)
                <input
                  maxLength={180}
                  value={s.announcement}
                  onChange={(e) => field("announcement", e.target.value)}
                />
              </label>
              <label className="form-field">
                Texte d'introduction de la page d'accueil (Français)
                <textarea
                  rows={2}
                  maxLength={400}
                  value={s.hero_description}
                  onChange={(e) => field("hero_description", e.target.value)}
                />
              </label>
              <label className="form-field">
                Notre histoire (Français)
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={s.about}
                  onChange={(e) => field("about", e.target.value)}
                />
              </label>
              <label className="form-field">
                Informations de livraison & commande (Français)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.delivery_info}
                  onChange={(e) => field("delivery_info", e.target.value)}
                />
              </label>
              <label className="form-field">
                Texte de confidentialité (Français)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.privacy_policy}
                  onChange={(e) => field("privacy_policy", e.target.value)}
                />
              </label>
            </div>
          )}

          {settingsTab === "ar" && (
            <div className="grid gap-3" dir="rtl">
              <label className="form-field">
                الشعار اللفظي (بالعربية)
                <input
                  maxLength={100}
                  value={s.tagline_ar || ""}
                  onChange={(e) => field("tagline_ar", e.target.value)}
                  placeholder="إضاءة راقية، صُممت من أجلك."
                />
              </label>
              <label className="form-field">
                شريط الإعلان العلوي (بالعربية)
                <input
                  maxLength={180}
                  value={s.announcement_ar || ""}
                  onChange={(e) => field("announcement_ar", e.target.value)}
                />
              </label>
              <label className="form-field">
                مقدمة الصفحة الرئيسية (بالعربية)
                <textarea
                  rows={2}
                  maxLength={400}
                  value={s.hero_description_ar || ""}
                  onChange={(e) => field("hero_description_ar", e.target.value)}
                />
              </label>
              <label className="form-field">
                قصة المتجر (بالعربية)
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={s.about_ar || ""}
                  onChange={(e) => field("about_ar", e.target.value)}
                />
              </label>
              <label className="form-field">
                معلومات التوصيل والطلب (بالعربية)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.delivery_info_ar || ""}
                  onChange={(e) => field("delivery_info_ar", e.target.value)}
                />
              </label>
              <label className="form-field">
                سياسة الخصوصية (بالعربية)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.privacy_policy_ar || ""}
                  onChange={(e) => field("privacy_policy_ar", e.target.value)}
                />
              </label>
            </div>
          )}

          {settingsTab === "en" && (
            <div className="grid gap-3">
              <label className="form-field">
                Tagline (English)
                <input
                  maxLength={100}
                  value={s.tagline_en || ""}
                  onChange={(e) => field("tagline_en", e.target.value)}
                  placeholder="Light, considered."
                />
              </label>
              <label className="form-field">
                Announcement banner (English)
                <input
                  maxLength={180}
                  value={s.announcement_en || ""}
                  onChange={(e) => field("announcement_en", e.target.value)}
                />
              </label>
              <label className="form-field">
                Homepage introduction (English)
                <textarea
                  rows={2}
                  maxLength={400}
                  value={s.hero_description_en || ""}
                  onChange={(e) => field("hero_description_en", e.target.value)}
                />
              </label>
              <label className="form-field">
                Our story (English)
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={s.about_en || ""}
                  onChange={(e) => field("about_en", e.target.value)}
                />
              </label>
              <label className="form-field">
                Delivery & ordering info (English)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.delivery_info_en || ""}
                  onChange={(e) => field("delivery_info_en", e.target.value)}
                />
              </label>
              <label className="form-field">
                Privacy policy (English)
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={s.privacy_policy_en || ""}
                  onChange={(e) => field("privacy_policy_en", e.target.value)}
                />
              </label>
            </div>
          )}
        </div>

        <label className="form-field">
          Téléphone
          <input
            value={s.phone}
            maxLength={100}
            onChange={(e) => field("phone", e.target.value)}
            placeholder="+213 …"
          />
        </label>
        <label className="form-field">
          Email de contact
          <input
            type="email"
            value={s.email}
            maxLength={150}
            onChange={(e) => field("email", e.target.value)}
          />
        </label>
        <label className="form-field">
          Lien Instagram
          <input
            type="url"
            value={s.instagram}
            maxLength={200}
            onChange={(e) => field("instagram", e.target.value)}
          />
        </label>
        <label className="form-field">
          Numéro WhatsApp
          <input
            value={s.whatsapp}
            maxLength={100}
            onChange={(e) => field("whatsapp", e.target.value)}
            placeholder="+213 …"
          />
        </label>
        <label className="form-field full">
          Adresse du showroom / magasin
          <input
            value={s.address}
            maxLength={500}
            onChange={(e) => field("address", e.target.value)}
            placeholder="Alger, Algérie"
          />
        </label>
      </div>

      <div className="notice mt-6">
        <strong>Intégration Telegram</strong>
        <p className="mb-0 mt-2">
          Le jeton de bot et l'identifiant du canal sont configurés en toute sécurité dans les secrets Supabase Edge Functions. Ils n'apparaissent jamais dans le code public.
        </p>
      </div>

      {error && (
        <p className="error-note mt-4" role="alert">
          {error}
        </p>
      )}

      <button disabled={busy} className="button button-dark mt-6">
        {busy ? "Enregistrement…" : "Enregistrer les réglages"}
        <ArrowUpRight size={17} />
      </button>
    </form>
  );
}
