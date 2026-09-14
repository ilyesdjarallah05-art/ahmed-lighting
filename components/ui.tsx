"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Sun,
  X,
  LampCeiling,
  LampDesk,
  LampFloor,
  Spotlight,
  CircleDot,
  Lightbulb,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";
import { useStore } from "./store-provider";
import { safeImage } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import type { ReactNode } from "react";

export function CategoryIcon({ icon }: { icon: string }) {
  const Icon =
    (
      {
        pendant: LampCeiling,
        ceiling: Lightbulb,
        table: LampDesk,
        floor: LampFloor,
        spotlight: Spotlight,
        downlight: CircleDot,
      } as Record<string, typeof Sun>
    )[icon] || Lightbulb;
  return <Icon className="icon" aria-hidden="true" />;
}

export function LightSwitch() {
  const s = useStore();
  return (
    <button
      className="light-switch"
      onClick={s.toggleLights}
      aria-pressed={s.lights}
    >
      <span className="switch-track">
        <span />
      </span>
      <span>{s.lights ? t("lightsTurnOff", s.lang) : t("lightsTurnOn", s.lang)}</span>
      <Sun size={17} className="switch-icon" aria-hidden="true" />
    </button>
  );
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useStore();
  const languages: { code: Language; label: string }[] = [
    { code: "fr", label: "FR" },
    { code: "ar", label: "العربية" },
    { code: "en", label: "EN" },
  ];
  return (
    <div className={`language-switch ${className}`} role="group" aria-label="Language selection">
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-btn ${lang === l.code ? "active" : ""}`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function Scene({
  off,
  on,
  alt,
  className = "",
  children,
  eager = false,
}: {
  off: string;
  on?: string;
  alt: string;
  className?: string;
  children?: ReactNode;
  eager?: boolean;
}) {
  const { lights } = useStore();
  return (
    <div className={`scene-media ${on ? "has-night" : ""} ${className}`}>
      <img
        className="day-image"
        src={safeImage(off)}
        alt={alt}
        aria-hidden={lights && !!on}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
      />
      <img
        className="night-image"
        src={safeImage(on || off)}
        alt={`${alt}, illuminated at night`}
        aria-hidden={!lights || !on}
        loading={eager ? "eager" : "lazy"}
      />
      {children}
    </div>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-backdrop" />
        <Dialog.Content
          className={`info-dialog ${className}`}
          aria-describedby={description ? undefined : undefined}
        >
          <div className="drawer-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={21} />
            </Dialog.Close>
          </div>
          <Dialog.Description
            className={description ? "modal-description" : "sr-only"}
          >
            {description || title}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Quantity({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity-stepper">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus size={12} className="mx-auto" />
      </button>
      <input
        aria-label="Quantity"
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(
            Math.min(max, Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1)),
          );
        }}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={12} className="mx-auto" />
      </button>
    </div>
  );
}

export function Empty({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  const s = useStore();
  const defaultTitle =
    s.lang === "ar"
      ? "لم يتم العثور على أي منتجات."
      : s.lang === "en"
        ? "No lights found."
        : "Aucun luminaire trouvé.";
  const defaultDesc =
    s.lang === "ar"
      ? "جرب بحثاً مختلفاً أو قم بتعديل خيارات التصفية."
      : s.lang === "en"
        ? "Try a different search or adjust your filters."
        : "Essayez une autre recherche ou modifiez vos filtres.";

  return (
    <div className="empty-state">
      <h2>{title || defaultTitle}</h2>
      <p>{description || defaultDesc}</p>
      {children}
    </div>
  );
}

export { ChevronDown };
