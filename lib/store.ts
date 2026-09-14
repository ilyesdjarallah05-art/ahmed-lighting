import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seed } from "./seed";
import { validateCart } from "./catalog";
import type {
  Category,
  Order,
  OrderPayload,
  Product,
  Settings,
  StoreData,
} from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export const configured = Boolean(url && publicKey);
export function isDemo() {
  return (
    !configured &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) &&
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEMO !== "false"
  );
}
let client: SupabaseClient;
export function db() {
  if (!configured)
    throw new Error(
      "The store is not connected yet. Please contact the store owner.",
    );
  return (client ||= createClient(url, publicKey));
}
function localRead(): StoreData {
  try {
    const saved = JSON.parse(localStorage.getItem("zitex-demo-v2") || "null");
    if (
      saved?.products &&
      saved?.categories &&
      saved?.settings &&
      saved?.orders
    )
      return saved;
  } catch {
    /* default data */
  }
  return structuredClone(seed);
}
function localSave(data: StoreData) {
  try {
    localStorage.setItem("zitex-demo-v2", JSON.stringify(data));
  } catch {
    throw new Error(
      "Browser storage is full. Use smaller images or connect Supabase.",
    );
  }
}
function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function readStore(admin = false): Promise<StoreData> {
  if (!configured) {
    const data = isDemo() ? localRead() : structuredClone(seed);
    return admin
      ? data
      : {
          ...data,
          products: data.products.filter((p) => p.active),
          orders: [],
        };
  }
  const s = db();
  const [products, categories, settings, orders] = await Promise.all([
    s.from("products").select("*").order("created_at", { ascending: false }),
    s.from("categories").select("*").order("position"),
    s.from("site_settings").select("data").eq("id", 1).single(),
    admin
      ? s
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ]);
  return {
    products: checked(products) || [],
    categories: checked(categories) || [],
    settings: { ...seed.settings, ...checked(settings)?.data },
    orders: checked(orders) || [],
  };
}
export async function isAdmin() {
  if (isDemo()) return sessionStorage.getItem("zitex-demo-admin") === "true";
  if (!configured) return false;
  const result = await db().auth.getSession();
  if (result.error) throw result.error;
  const session = result.data.session;
  if (!session) return false;
  return Boolean(
    checked(
      await db()
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ),
  );
}
export async function signIn(email: string, password: string) {
  const result = await db().auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  if (!(await isAdmin())) {
    await db().auth.signOut();
    throw new Error("This account does not have administrator access.");
  }
}
export function demoSignIn() {
  if (!isDemo())
    throw new Error("Demo access is available only on your local computer.");
  sessionStorage.setItem("zitex-demo-admin", "true");
}
export async function signOut() {
  if (isDemo()) sessionStorage.removeItem("zitex-demo-admin");
  else if (configured) {
    const result = await db().auth.signOut();
    if (result.error) throw result.error;
  }
}
async function guard() {
  if (!(await isAdmin()))
    throw new Error("Please sign in with an administrator account.");
}
export async function saveProduct(product: Product) {
  await guard();
  if (isDemo()) {
    const data = localRead();
    const index = data.products.findIndex((p) => p.id === product.id);
    if (index >= 0)
      data.products[index] = { ...data.products[index], ...product };
    else
      data.products.unshift({
        ...product,
        created_at: new Date().toISOString(),
      });
    localSave(data);
  } else checked(await db().from("products").upsert(product));
}
export async function deleteProduct(id: string) {
  await guard();
  if (isDemo()) {
    const data = localRead();
    data.products = data.products.filter((p) => p.id !== id);
    localSave(data);
  } else checked(await db().from("products").delete().eq("id", id));
}
export async function saveSettings(settings: Settings) {
  await guard();
  if (isDemo()) {
    const data = localRead();
    data.settings = settings;
    localSave(data);
  } else
    checked(
      await db().from("site_settings").update({ data: settings }).eq("id", 1),
    );
}
export async function saveCategory(category: Category) {
  await guard();
  if (isDemo()) {
    const data = localRead();
    if (data.categories.some((c) => c.id === category.id))
      throw new Error("This category already exists.");
    data.categories.push(category);
    localSave(data);
  } else checked(await db().from("categories").insert(category));
}
export async function updateOrder(id: string, status: Order["status"]) {
  await guard();
  if (isDemo()) {
    const data = localRead();
    const order = data.orders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found.");
    if (order.status === "cancelled" && status !== "cancelled")
      throw new Error("Cancelled orders cannot be reopened.");
    if (status === "cancelled" && order.status !== "cancelled")
      order.items.forEach((i) => {
        const p = data.products.find((p) => p.id === i.product_id);
        if (p) p.stock += i.quantity;
      });
    order.status = status;
    localSave(data);
  } else checked(await db().from("orders").update({ status }).eq("id", id));
}
export async function uploadImage(file: File) {
  await guard();
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
  )
    throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Each image must be smaller than 5 MB.");
  if (isDemo())
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Could not read this image."));
      r.readAsDataURL(file);
    });
  const path = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  checked(
    await db()
      .storage.from("lighting-images")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" }),
  );
  return db().storage.from("lighting-images").getPublicUrl(path).data.publicUrl;
}
export async function placeOrder(
  payload: OrderPayload,
): Promise<{ reference: string; demo?: boolean; telegram_status?: string }> {
  if (isDemo()) {
    const data = localRead();
    const existing = data.orders.find(
      (o) => o.request_id === payload.request_id,
    );
    if (existing) return { reference: existing.reference, demo: true };
    const items = validateCart(payload.items, data.products);
    items.forEach((i) => {
      data.products.find((p) => p.id === i.product_id)!.stock -= i.quantity;
    });
    const id = crypto.randomUUID();
    const reference = `ZT-${id.slice(0, 8).toUpperCase()}`;
    data.orders.unshift({
      id,
      reference,
      request_id: payload.request_id,
      ...payload.customer,
      items,
      subtotal: items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
      currency: data.settings.currency,
      status: "new",
      telegram_status: "demo",
      created_at: new Date().toISOString(),
    });
    localSave(data);
    return { reference, demo: true };
  }
  const result = await db().functions.invoke("place-order", { body: payload });
  if (result.error) {
    let message = result.error.message;
    try {
      message = (await result.error.context.json()).error || message;
    } catch {
      /* network failure */
    }
    throw new Error(message);
  }
  return result.data;
}
export async function retryTelegram(id: string) {
  await guard();
  return checked(
    await db().functions.invoke("place-order", {
      body: { retry_order_id: id },
    }),
  );
}
