export type Language = "fr" | "ar" | "en";

export type Category = {
  id: string;
  name: string; // French (primary / default)
  name_ar?: string;
  name_en?: string;
  icon: string;
  position: number;
};
export type Product = {
  id: string;
  name: string; // French (primary / default)
  name_ar?: string;
  name_en?: string;
  sku: string;
  category_id: string;
  price: number;
  sale_price: number | null;
  stock: number;
  colors: string[];
  temperatures: string[];
  material: string;
  material_ar?: string;
  material_en?: string;
  dimensions: string;
  wattage: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  image_off: string;
  image_on: string;
  gallery: string[];
  active: boolean;
  featured: boolean;
  badge: string;
  badge_ar?: string;
  badge_en?: string;
  created_at?: string;
};
export type Settings = {
  store_name: string;
  tagline: string;
  tagline_ar?: string;
  tagline_en?: string;
  currency: string;
  locale: string;
  logo_url: string;
  announcement: string;
  announcement_ar?: string;
  announcement_en?: string;
  hero_description: string;
  hero_description_ar?: string;
  hero_description_en?: string;
  hero_product_id: string;
  about: string;
  about_ar?: string;
  about_en?: string;
  phone: string;
  email: string;
  address: string;
  address_ar?: string;
  address_en?: string;
  instagram: string;
  whatsapp: string;
  delivery_info: string;
  delivery_info_ar?: string;
  delivery_info_en?: string;
  privacy_policy: string;
  privacy_policy_ar?: string;
  privacy_policy_en?: string;
};
export type PanoramaHotspot = {
  id: string;
  target_scene_id: string;
  text: string;
  text_ar?: string;
  text_en?: string;
  pitch: number;
  yaw: number;
};
export type PanoramaScene = {
  id: string;
  title: string;
  title_ar?: string;
  title_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  image_url: string;
  pitch: number;
  yaw: number;
  hfov: number;
  position: number;
  hotspots: PanoramaHotspot[];
};
export type VirtualTour = {
  id: string;
  title: string;
  title_ar?: string;
  title_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  location: string;
  location_ar?: string;
  location_en?: string;
  cover_image: string;
  active: boolean;
  position: number;
  scenes: PanoramaScene[];
  created_at?: string;
};
export type CartItem = {
  product_id: string;
  color: string;
  temperature: string;
  quantity: number;
};
export type Customer = {
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
};
export type OrderItem = CartItem & {
  name: string;
  sku: string;
  unit_price: number;
  image_off: string;
};
export type Order = Customer & {
  id: string;
  reference: string;
  request_id: string;
  items: OrderItem[];
  subtotal: number;
  currency: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
  telegram_status: "pending" | "sent" | "failed" | "demo";
  created_at: string;
};
export type StoreData = {
  products: Product[];
  categories: Category[];
  settings: Settings;
  orders: Order[];
  tours: VirtualTour[];
};
export type OrderPayload = {
  request_id: string;
  items: CartItem[];
  customer: Customer;
  website: string;
};
