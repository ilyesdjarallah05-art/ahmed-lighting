// Intelligent lighting domain translation engine (French -> Arabic & English)

const lightingGlossary: Record<string, { ar: string; en: string }> = {
  // Product Types
  "suspension en lin": { ar: "ثريا معلقة من الكتان", en: "Linen pendant" },
  suspension: { ar: "ثريا معلقة", en: "Pendant light" },
  suspensions: { ar: "ثريات معلقة", en: "Pendants" },
  "lampe de table": { ar: "مصباح طاولة", en: "Table lamp" },
  "lampe à poser": { ar: "مصباح طاولة", en: "Table lamp" },
  "lampes à poser": { ar: "مصابيح طاولة", en: "Table lamps" },
  lampadaire: { ar: "مصباح أرضي", en: "Floor lamp" },
  lampadaires: { ar: "مصابيح أرضية", en: "Floor lamps" },
  plafonnier: { ar: "مصباح سقف", en: "Ceiling lamp" },
  plafonniers: { ar: "مصابيح سقف", en: "Ceiling lamps" },
  "spot sur rail": { ar: "سبوت إضاءة للمسار", en: "Track spotlight" },
  spot: { ar: "مصباح سبوت", en: "Spotlight" },
  spots: { ar: "أضواء سبوت", en: "Spotlights" },
  "spot encastré": { ar: "سبوت مدمج في السقف", en: "Recessed downlight" },
  "spots encastrés": { ar: "أضواء سبوت غائرة", en: "Downlights" },
  applique: { ar: "إضاءة جدارية", en: "Wall lamp" },
  appliques: { ar: "مصابيح جدارية", en: "Wall lamps" },
  lustre: { ar: "نجفة فاخرة", en: "Chandelier" },

  // Materials & Finishes
  "lin · acier thermolaqué": { ar: "كتان · فولاذ مطلي", en: "Linen · powder-coated steel" },
  "céramique texturée · lin": { ar: "سيراميك ذو ملمس · كتان", en: "Textured ceramic · linen" },
  "acier thermolaqué · lin": { ar: "فولاذ مطلي · كتان", en: "Powder-coated steel · linen" },
  "laiton brossé · diffuseur acrylique": { ar: "نحاس مصقول · موزع أكريليك", en: "Brushed brass · acrylic diffuser" },
  "aluminium · diffuseur dépoli": { ar: "ألومنيوم · موزع ضوء غير لامع", en: "Aluminium · frosted diffuser" },
  aluminium: { ar: "ألومنيوم", en: "Aluminium" },
  laiton: { ar: "نحاس", en: "Brass" },
  "laiton brossé": { ar: "نحاس مصقول", en: "Brushed brass" },
  lin: { ar: "كتان", en: "Linen" },
  céramique: { ar: "سيراميك", en: "Ceramic" },
  verre: { ar: "زجاج", en: "Glass" },
  bois: { ar: "خشب", en: "Wood" },
  acier: { ar: "فولاذ", en: "Steel" },
  ivoire: { ar: "عاجي", en: "Ivory" },
  beige: { ar: "بيج", en: "Beige" },
  noir: { ar: "أسود", en: "Black" },
  blanc: { ar: "أبيض", en: "White" },
  doré: { ar: "ذهبي", en: "Gold" },
  argent: { ar: "فضي", en: "Silver" },
  bronze: { ar: "برونزي", en: "Bronze" },

  // Badges & Labels
  "édition lumière": { ar: "إصدار الإضاءة", en: "The light edit" },
  "un favori discret": { ar: "الأكثر طلباً وهدوءاً", en: "A quiet favorite" },
  "prix spécial": { ar: "سعر خاص", en: "Special price" },
  nouveauté: { ar: "وصل حديثاً", en: "New arrival" },
  "nouvelle perspective": { ar: "منظور جديد", en: "New perspective" },
  "produit vedette": { ar: "منتج مميز", en: "Featured item" },
  sélection: { ar: "تشكيلة مختارة", en: "Selection" },
  "coup de cœur": { ar: "اختيار مميز", en: "Top pick" },
};

const wordReplacements: { fr: RegExp; ar: string; en: string }[] = [
  { fr: /\bune courbe douce\b/gi, ar: "انحناءة لطيفة", en: "A gentle curve" },
  { fr: /\blueur plus douce\b/gi, ar: "توهج أكثر نعومة", en: "softer glow" },
  { fr: /\blumière douce\b/gi, ar: "إضاءة هادئة وناعمة", en: "soft light" },
  { fr: /\blumière chaleureuse\b/gi, ar: "إضاءة دافئة ومريحة", en: "warm light" },
  { fr: /\bchaleur\b/gi, ar: "الدفء", en: "warmth" },
  { fr: /\bmaison\b/gi, ar: "المنزل", en: "home" },
  { fr: /\bsalon\b/gi, ar: "غرفة المعيشة", en: "living room" },
  { fr: /\bchambre\b/gi, ar: "غرفة النوم", en: "bedroom" },
  { fr: /\btable à manger\b/gi, ar: "طاولة الطعام", en: "dining table" },
  { fr: /\bcouloir\b/gi, ar: "الممرات", en: "hallway" },
  { fr: /\bcuisine\b/gi, ar: "المطبخ", en: "kitchen" },
  { fr: /\bsans complications\b/gi, ar: "بكل سهولة ويسر", en: "without complications" },
  { fr: /\bfait pour durer\b/gi, ar: "صُنع ليدوم طويلاً", en: "made to last" },
  { fr: /\bdesign moderne\b/gi, ar: "تصميم عصري أنيق", en: "modern design" },
  { fr: /\bambiance intime\b/gi, ar: "أجواء حميمية مريحة", en: "intimate ambiance" },
];

export function translateLightingText(text: string, targetLang: "ar" | "en"): string {
  if (!text || !text.trim()) return "";
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct glossary exact match
  if (lightingGlossary[lower]) {
    return lightingGlossary[lower][targetLang];
  }

  // 2. Check for starting matches or common patterns
  for (const [key, val] of Object.entries(lightingGlossary)) {
    if (lower.startsWith(key)) {
      const rest = trimmed.slice(key.length).trim();
      const translatedPrefix = val[targetLang];
      return rest ? `${translatedPrefix} ${rest}` : translatedPrefix;
    }
  }

  // 3. For sentences / descriptions, apply known phrases
  let translated = trimmed;
  let matchesFound = false;

  for (const item of wordReplacements) {
    if (item.fr.test(translated)) {
      matchesFound = true;
      translated = translated.replace(item.fr, item[targetLang]);
    }
  }

  if (matchesFound) {
    return translated;
  }

  // 4. If target is English and French has recognizable words
  if (targetLang === "en") {
    return trimmed
      .replace(/Lampe/gi, "Lamp")
      .replace(/Suspension/gi, "Pendant")
      .replace(/Plafonnier/gi, "Ceiling Lamp")
      .replace(/Spot/gi, "Spotlight")
      .replace(/en lin/gi, "Linen")
      .replace(/en céramique/gi, "Ceramic")
      .replace(/en laiton/gi, "Brass")
      .replace(/en aluminium/gi, "Aluminium")
      .replace(/lumière/gi, "light")
      .replace(/chaleureux/gi, "warm")
      .replace(/moderne/gi, "modern");
  }

  // 5. If target is Arabic, provide graceful Arabic transliteration/translation
  if (targetLang === "ar") {
    let arText = trimmed;
    const commonWords: [RegExp, string][] = [
      [/suspension/gi, "ثريا معلقة"],
      [/plafonnier/gi, "مصباح سقف"],
      [/lampadaire/gi, "مصباح أرضي"],
      [/lampe à poser/gi, "مصباح طاولة"],
      [/lampe/gi, "مصباح"],
      [/spot/gi, "سبوت إضاءة"],
      [/lin/gi, "كتان"],
      [/céramique/gi, "سيراميك"],
      [/laiton/gi, "نحاس"],
      [/aluminium/gi, "ألومنيوم"],
      [/ivoire/gi, "عاجي"],
      [/noir/gi, "أسود"],
      [/blanc/gi, "أبيض"],
      [/doré/gi, "ذهبي"],
      [/lumière/gi, "إضاءة"],
    ];
    for (const [pattern, replacement] of commonWords) {
      arText = arText.replace(pattern, replacement);
    }
    return arText;
  }

  return trimmed;
}

export function autoTranslateProduct(product: {
  name: string;
  description?: string;
  material?: string;
  badge?: string;
}) {
  return {
    name_ar: translateLightingText(product.name, "ar"),
    name_en: translateLightingText(product.name, "en"),
    description_ar: product.description
      ? translateLightingText(product.description, "ar")
      : "",
    description_en: product.description
      ? translateLightingText(product.description, "en")
      : "",
    material_ar: product.material
      ? translateLightingText(product.material, "ar")
      : "",
    material_en: product.material
      ? translateLightingText(product.material, "en")
      : "",
    badge_ar: product.badge ? translateLightingText(product.badge, "ar") : "",
    badge_en: product.badge ? translateLightingText(product.badge, "en") : "",
  };
}

export function autoTranslateCategory(name: string) {
  return {
    name_ar: translateLightingText(name, "ar"),
    name_en: translateLightingText(name, "en"),
  };
}
