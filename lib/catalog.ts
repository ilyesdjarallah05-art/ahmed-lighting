import type { CartItem, Language, Product } from "./types.ts";
import { t } from "./i18n.ts";

export const finishColors: Record<string, string> = {
  Ivory: "#e9e4d8",
  Ivoire: "#e9e4d8",
  Beige: "#c5b69c",
  White: "#ffffff",
  Blanc: "#ffffff",
  Black: "#313330",
  Noir: "#313330",
  Brass: "#b99b57",
  Laiton: "#b99b57",
  Silver: "#adb1b1",
  Argent: "#adb1b1",
  Bronze: "#93714d",
  Gold: "#d4af37",
  Doré: "#d4af37",
  Chrome: "#dcdde1",
  Wood: "#8b5a2b",
  Bois: "#8b5a2b",
};

export const priceOf = (product: Product) =>
  product.sale_price ?? product.price;

export function localized<T extends Record<string, any>>(
  record: T | null | undefined,
  field: string,
  lang: Language = "fr",
): string {
  if (!record) return "";
  if (lang === "ar" && record[`${field}_ar`]) return record[`${field}_ar`];
  if (lang === "en" && record[`${field}_en`]) return record[`${field}_en`];
  return record[field] || record[`${field}_fr`] || "";
}

export function finishLabel(finish: string, lang: Language = "fr"): string {
  const normalized = finish.charAt(0).toUpperCase() + finish.slice(1);
  const key = `finish_${normalized}`;
  const translated = t(key, lang);
  return translated !== key ? translated : finish;
}

export function temperatureLabel(temp: string, lang: Language = "fr"): string {
  const key = `temp_${temp}`;
  const translated = t(key, lang);
  return translated !== key ? translated : temp;
}

export function money(value: number, currency = "DZD", locale = "fr-DZ") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

export function safeImage(value: string) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value || "")) return value;
  if (/^data:image\/(png|jpeg|webp|avif);base64,/i.test(value || ""))
    return value;
  return "/assets/pendant-off.webp";
}

export function safeLink(value: string) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

export const cartKey = (item: CartItem) =>
  `${item.product_id}:${item.color}:${item.temperature}`;

export type Filters = {
  q: string;
  categories: string[];
  colors: string[];
  temperatures: string[];
  min: string;
  max: string;
  available: boolean;
  preview: boolean;
  sort: string;
};

export const defaultFilters: Filters = {
  q: "",
  categories: [],
  colors: [],
  temperatures: [],
  min: "",
  max: "",
  available: false,
  preview: false,
  sort: "featured",
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterProducts(products: Product[], filters: Filters) {
  const rawQ = filters.q.trim();
  const q = normalizeText(rawQ);
  const result = products.filter((p) => {
    if (!p.active) return false;
    if (q) {
      const searchHaystack = normalizeText(
        [
          p.name,
          p.name_ar,
          p.name_en,
          p.description,
          p.description_ar,
          p.description_en,
          p.sku,
          p.category_id.replaceAll("-", " "),
          p.colors.join(" "),
          p.material,
          p.material_ar,
          p.material_en,
        ]
          .filter(Boolean)
          .join(" "),
      );
      if (!searchHaystack.includes(q)) return false;
    }
    if (
      filters.categories.length &&
      !filters.categories.includes(p.category_id)
    ) {
      return false;
    }
    if (
      filters.colors.length &&
      !p.colors.some((c) => filters.colors.includes(c))
    ) {
      return false;
    }
    if (
      filters.temperatures.length &&
      !p.temperatures.some((t) => filters.temperatures.includes(t))
    ) {
      return false;
    }
    if (filters.min && priceOf(p) < Number(filters.min)) return false;
    if (filters.max && priceOf(p) > Number(filters.max)) return false;
    if (filters.available && p.stock <= 0) return false;
    if (filters.preview && !p.image_on) return false;
    return true;
  });

  return result.sort((a, b) =>
    filters.sort === "price-asc"
      ? priceOf(a) - priceOf(b)
      : filters.sort === "price-desc"
        ? priceOf(b) - priceOf(a)
        : filters.sort === "name"
          ? a.name.localeCompare(b.name)
          : filters.sort === "newest"
            ? (b.created_at || "").localeCompare(a.created_at || "")
            : Number(b.featured) - Number(a.featured),
  );
}

export function validateCart(items: CartItem[], products: Product[]) {
  const quantities = new Map<string, number>();
  if (!items.length || items.length > 30)
    throw new Error("Please add between 1 and 30 items to your basket.");
  return items.map((i) => {
    const p = products.find((p) => p.id === i.product_id && p.active);
    if (
      !p ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 99
    )
      throw new Error("A product is unavailable. Please review your basket.");
    const quantity = (quantities.get(p.id) || 0) + i.quantity;
    quantities.set(p.id, quantity);
    if (quantity > p.stock)
      throw new Error(
        `${p.name} has only ${p.stock} available. Please update your basket.`,
      );
    if (!p.colors.includes(i.color) || !p.temperatures.includes(i.temperature))
      throw new Error(
        `Please choose an available finish and temperature for ${p.name}.`,
      );
    return {
      ...i,
      name: p.name,
      sku: p.sku,
      unit_price: priceOf(p),
      image_off: p.image_off,
    };
  });
}
