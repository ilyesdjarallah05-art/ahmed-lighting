"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { seed } from "@/lib/seed";
import { configured, isDemo, readStore } from "@/lib/store";
import { cartKey, localized } from "@/lib/catalog";
import type { CartItem, Language, Product, StoreData } from "@/lib/types";

type Context = StoreData & {
  loading: boolean;
  error: string;
  demo: boolean;
  lights: boolean;
  toggleLights: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    p: Product,
    color?: string,
    temperature?: string,
    quantity?: number,
  ) => void;
  notify: (message: string, error?: boolean) => void;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Context | null>(null);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("StoreProvider is missing");
  return context;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(
    configured ? { ...seed, products: [], categories: [] } : seed,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [lights, setLights] = useState(false);
  const [lang, setLangState] = useState<Language>("fr");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );

  const setLang = useCallback((nextLang: Language) => {
    setLangState(nextLang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("zitex-lang", nextLang);
      } catch {
        /* storage may be blocked */
      }
      document.documentElement.lang = nextLang;
      document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await readStore();
      setData(data);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load the collection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDemo(isDemo());
    void refresh();
    try {
      const savedLang = (localStorage.getItem("zitex-lang") as Language) || "fr";
      if (["fr", "ar", "en"].includes(savedLang)) {
        setLangState(savedLang);
        document.documentElement.lang = savedLang;
        document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
      }
      const saved = JSON.parse(localStorage.getItem("zitex-cart") || "[]");
      if (Array.isArray(saved))
        setCart(
          saved
            .filter(
              (i) =>
                typeof i?.product_id === "string" &&
                typeof i.color === "string" &&
                typeof i.temperature === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 99,
            )
            .slice(0, 30),
        );
      setLights(localStorage.getItem("zitex-lights") === "true");
    } catch {
      /* fresh session */
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "zitex-demo-v2") void refresh();
      if (e.key === "zitex-lang" && e.newValue) {
        const nextLang = e.newValue as Language;
        if (["fr", "ar", "en"].includes(nextLang)) {
          setLangState(nextLang);
          document.documentElement.lang = nextLang;
          document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
        }
      }
    };
    const onFocus = () => void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    document.body.classList.toggle("lights-on", lights);
    if (hydrated)
      try {
        localStorage.setItem("zitex-lights", String(lights));
      } catch {
        /* optional preference */
      }
  }, [lights, hydrated]);

  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem("zitex-cart", JSON.stringify(cart));
      } catch {
        /* still works in memory */
      }
  }, [cart, hydrated]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  const notify = (text: string, error = false) => setToast({ text, error });

  function addToCart(
    p: Product,
    color = p.colors[0],
    temperature = p.temperatures[0],
    quantity = 1,
  ) {
    const productName = localized(p, "name", lang);
    const already = cart
      .filter((i) => i.product_id === p.id)
      .reduce((sum, i) => sum + i.quantity, 0);
    if (
      !p.active ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity + already > p.stock ||
      !p.colors.includes(color) ||
      !p.temperatures.includes(temperature)
    ) {
      const checkMsg =
        lang === "ar"
          ? `يرجى مراجعة الخيارات والكمية المتوفرة لـ ${productName}.`
          : lang === "en"
            ? `Please check the options and available quantity for ${productName}.`
            : `Veuillez vérifier les options et la quantité disponible pour ${productName}.`;
      notify(checkMsg, true);
      return;
    }
    const item = { product_id: p.id, color, temperature, quantity };
    const exists = cart.find((i) => cartKey(i) === cartKey(item));
    if (!exists && cart.length >= 30) {
      const limitMsg =
        lang === "ar"
          ? "يمكن أن تحتوي سلتك على ما يصل إلى 30 منتجاً مختلفاً."
          : lang === "en"
            ? "Your basket can contain up to 30 different items."
            : "Votre panier peut contenir jusqu'à 30 articles différents.";
      notify(limitMsg, true);
      return;
    }
    setCart(
      exists
        ? cart.map((i) =>
            cartKey(i) === cartKey(item)
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...cart, item],
    );
    const addedMsg =
      lang === "ar"
        ? `تمت إضافة ${productName} إلى سلتك.`
        : lang === "en"
          ? `${productName} added to your basket.`
          : `${productName} ajouté à votre panier.`;
    notify(addedMsg);
  }

  return (
    <StoreContext.Provider
      value={{
        ...data,
        loading,
        error,
        demo,
        lights,
        toggleLights: () => setLights((v) => !v),
        lang,
        setLang,
        cart,
        setCart,
        cartOpen,
        setCartOpen,
        addToCart,
        notify,
        refresh,
      }}
    >
      {children}
      <div
        className={`toast ${toast ? "show" : ""} ${toast?.error ? "error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast?.text}
      </div>
    </StoreContext.Provider>
  );
}
