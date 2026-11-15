"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  MapPin,
  Move3d,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Modal } from "./ui";
import { PanoramaViewer } from "./panorama-viewer";
import * as api from "@/lib/store";
import { safeImage } from "@/lib/catalog";
import { prepareTour, validateTour } from "@/lib/tours";
import { translateLightingText } from "@/lib/translate";
import type { Language, PanoramaScene, VirtualTour } from "@/lib/types";

const blankScene = (position: number): PanoramaScene => ({
  id: crypto.randomUUID(),
  title: "",
  title_ar: "",
  title_en: "",
  description: "",
  description_ar: "",
  description_en: "",
  image_url: "",
  pitch: 0,
  yaw: 0,
  hfov: 100,
  position,
  hotspots: [],
});
const blankTour = (): VirtualTour => ({
  id: crypto.randomUUID(),
  title: "",
  title_ar: "",
  title_en: "",
  description: "",
  description_ar: "",
  description_en: "",
  location: "",
  location_ar: "",
  location_en: "",
  cover_image: "",
  active: false,
  position: 0,
  scenes: [blankScene(0)],
});
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Une erreur est survenue.";

async function assertPanorama(file: File) {
  const src = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () =>
          reject(new Error("Cette image ne peut pas être lue."));
        image.src = src;
      },
    );
    const ratio = dimensions.width / dimensions.height;
    if (ratio < 1.8 || ratio > 2.2)
      throw new Error(
        "Le panorama doit être équirectangulaire, avec un format proche de 2:1 (par exemple 4096 × 2048 px).",
      );
    if (dimensions.width < 2000)
      throw new Error(
        "Le panorama est trop petit. Utilisez au moins 2000 px de largeur; 4096 × 2048 px est recommandé.",
      );
  } finally {
    URL.revokeObjectURL(src);
  }
}

export function ToursAdmin({
  tours,
  onChanged,
}: {
  tours: VirtualTour[];
  onChanged: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<VirtualTour | null>(null);
  const [remove, setRemove] = useState<VirtualTour | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function perform(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await work();
      await onChanged();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card tour-admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>
            Visites virtuelles <span>{tours.length} showroom(s)</span>
          </h2>
          <p>
            Publiez des panoramas reliés pour permettre aux clients de se
            déplacer dans vos magasins.
          </p>
        </div>
        <button
          className="button button-dark"
          onClick={() => setEdit(blankTour())}
        >
          <Plus size={15} /> Nouvelle visite
        </button>
      </div>
      {error && (
        <p className="notice error-note" role="alert">
          {error}
        </p>
      )}
      <div className="tour-admin-grid">
        {tours.map((tour) => (
          <article key={tour.id} className="tour-admin-item">
            <img
              src={safeImage(tour.cover_image || tour.scenes[0]?.image_url)}
              alt=""
            />
            <div>
              <span className={`status-chip ${tour.active ? "success" : ""}`}>
                {tour.active ? <Eye size={12} /> : <EyeOff size={12} />}
                {tour.active ? "Publié" : "Brouillon"}
              </span>
              <h3>{tour.title}</h3>
              <p>
                <MapPin size={13} />{" "}
                {tour.location || "Emplacement non renseigné"}
              </p>
              <small>
                {tour.scenes.length} panorama(s) ·{" "}
                {tour.scenes.reduce(
                  (sum, scene) => sum + scene.hotspots.length,
                  0,
                )}{" "}
                lien(s)
              </small>
            </div>
            <div className="tour-admin-actions">
              <button
                className="icon-button"
                title={tour.active ? "Masquer" : "Publier"}
                disabled={busy}
                onClick={() =>
                  void perform(() =>
                    api.saveTour({ ...tour, active: !tour.active }),
                  )
                }
              >
                {tour.active ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className="icon-button"
                title="Modifier"
                onClick={() => setEdit(structuredClone(tour))}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button danger"
                title="Supprimer"
                onClick={() => setRemove(tour)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!tours.length && (
          <div className="tour-admin-empty">
            <Move3d size={32} />
            <h3>Créez votre première visite 360°</h3>
            <p>
              Ajoutez les panoramas du showroom, puis reliez-les avec des points
              de passage.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={!!edit}
        onOpenChange={(open) => !open && !busy && setEdit(null)}
        title={
          edit && tours.some((tour) => tour.id === edit.id)
            ? "Modifier la visite 360°"
            : "Nouvelle visite 360°"
        }
        description="Configurez le showroom, ses panoramas et les liens entre les espaces."
        className="tour-edit-modal"
      >
        {edit && (
          <TourForm
            key={edit.id}
            tour={edit}
            busy={busy}
            error={error}
            onCancel={() => setEdit(null)}
            onSave={(tour) =>
              void perform(async () => {
                await api.saveTour(tour);
                setEdit(null);
              })
            }
          />
        )}
      </Modal>
      <Modal
        open={!!remove}
        onOpenChange={(open) => !open && !busy && setRemove(null)}
        title="Supprimer cette visite ?"
        description="La visite disparaîtra du site. Les fichiers déjà envoyés restent dans Supabase Storage."
      >
        <div className="modal-actions">
          <button
            className="button button-outline"
            onClick={() => setRemove(null)}
          >
            Annuler
          </button>
          <button
            className="button button-danger"
            disabled={busy}
            onClick={() =>
              remove &&
              void perform(async () => {
                await api.deleteTour(remove.id);
                setRemove(null);
              })
            }
          >
            {busy ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function TourForm({
  tour: initial,
  busy,
  error,
  onSave,
  onCancel,
}: {
  tour: VirtualTour;
  busy: boolean;
  error: string;
  onSave: (tour: VirtualTour) => void;
  onCancel: () => void;
}) {
  const [tour, setTour] = useState(initial);
  const [lang, setLang] = useState<Language>("fr");
  const [sceneId, setSceneId] = useState(initial.scenes[0]?.id || "");
  const [uploading, setUploading] = useState("");
  const [localError, setLocalError] = useState("");
  const [viewer, setViewer] = useState<Pannellum.Viewer | null>(null);
  const scene =
    tour.scenes.find((item) => item.id === sceneId) || tour.scenes[0];
  const previewTour = useMemo(
    () => ({ ...tour, scenes: tour.scenes.filter((item) => item.image_url) }),
    [tour],
  );

  function patchTour(patch: Partial<VirtualTour>) {
    setTour((current) => ({ ...current, ...patch }));
  }
  function patchScene(id: string, patch: Partial<PanoramaScene>) {
    setTour((current) => ({
      ...current,
      scenes: current.scenes.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }
  function moveScene(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= tour.scenes.length) return;
    const scenes = [...tour.scenes];
    [scenes[index], scenes[destination]] = [scenes[destination], scenes[index]];
    patchTour({
      scenes: scenes.map((item, position) => ({ ...item, position })),
    });
  }
  function translateAll() {
    const translate = (value: string, target: "ar" | "en") =>
      translateLightingText(value, target);
    setTour((current) => ({
      ...current,
      title_ar: translate(current.title, "ar"),
      title_en: translate(current.title, "en"),
      description_ar: translate(current.description, "ar"),
      description_en: translate(current.description, "en"),
      location_ar: translate(current.location, "ar"),
      location_en: translate(current.location, "en"),
      scenes: current.scenes.map((item) => ({
        ...item,
        title_ar: translate(item.title, "ar"),
        title_en: translate(item.title, "en"),
        description_ar: translate(item.description || "", "ar"),
        description_en: translate(item.description || "", "en"),
        hotspots: item.hotspots.map((hotspot) => ({
          ...hotspot,
          text_ar: translate(hotspot.text, "ar"),
          text_en: translate(hotspot.text, "en"),
        })),
      })),
    }));
  }
  async function upload(scene: PanoramaScene, file?: File) {
    if (!file) return;
    setLocalError("");
    setUploading(scene.id);
    try {
      await assertPanorama(file);
      patchScene(scene.id, { image_url: await api.uploadPanorama(file) });
    } catch (cause) {
      setLocalError(messageOf(cause));
    } finally {
      setUploading("");
    }
  }
  function addHotspot() {
    if (!scene) return;
    const target = tour.scenes.find((item) => item.id !== scene.id);
    if (!target) {
      setLocalError("Ajoutez un deuxième panorama avant de créer un lien.");
      return;
    }
    patchScene(scene.id, {
      hotspots: [
        ...scene.hotspots,
        {
          id: crypto.randomUUID(),
          target_scene_id: target.id,
          text: target.title || "Espace suivant",
          text_ar: target.title_ar || "",
          text_en: target.title_en || "",
          pitch: viewer?.getPitch() || 0,
          yaw: viewer?.getYaw() || 0,
        },
      ],
    });
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const prepared = prepareTour(tour);
    const errors = validateTour(prepared);
    if (errors.length) {
      setLocalError(errors[0]);
      return;
    }
    onSave(prepared);
  }
  const suffix = lang === "fr" ? "" : `_${lang}`;
  const value = (record: Record<string, unknown>, field: string) =>
    String(record[`${field}${suffix}`] || "");
  const field = (record: "tour" | "scene", name: string, next: string) => {
    const key = `${name}${suffix}`;
    if (record === "tour") patchTour({ [key]: next } as Partial<VirtualTour>);
    else if (scene)
      patchScene(scene.id, { [key]: next } as Partial<PanoramaScene>);
  };

  return (
    <form onSubmit={submit} className="tour-form">
      <div className="tour-form-toolbar">
        <div className="language-tabs" role="tablist">
          {(["fr", "ar", "en"] as Language[]).map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={lang === item}
              className={lang === item ? "active" : ""}
              onClick={() => setLang(item)}
              key={item}
            >
              {item === "fr"
                ? "Français"
                : item === "ar"
                  ? "العربية"
                  : "English"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={translateAll}
        >
          Traduire depuis le français
        </button>
      </div>
      {(localError || error) && (
        <p className="notice error-note" role="alert">
          {localError || error}
        </p>
      )}
      <fieldset dir={lang === "ar" ? "rtl" : "ltr"}>
        <legend>Informations du showroom</legend>
        <div className="form-grid">
          <label className="form-field">
            Nom {lang === "fr" && "*"}
            <input
              required={lang === "fr"}
              value={value(tour as unknown as Record<string, unknown>, "title")}
              onChange={(event) => field("tour", "title", event.target.value)}
            />
          </label>
          <label className="form-field">
            Adresse / ville
            <input
              value={value(
                tour as unknown as Record<string, unknown>,
                "location",
              )}
              onChange={(event) =>
                field("tour", "location", event.target.value)
              }
            />
          </label>
          <label className="form-field full">
            Introduction
            <textarea
              rows={3}
              value={value(
                tour as unknown as Record<string, unknown>,
                "description",
              )}
              onChange={(event) =>
                field("tour", "description", event.target.value)
              }
            />
          </label>
        </div>
      </fieldset>
      <div className="tour-editor">
        <aside className="tour-scene-editor-list">
          <div>
            <strong>Panoramas</strong>
            <button
              type="button"
              className="icon-button"
              title="Ajouter"
              onClick={() => {
                const next = blankScene(tour.scenes.length);
                patchTour({ scenes: [...tour.scenes, next] });
                setSceneId(next.id);
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          {tour.scenes.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={item.id === scene?.id ? "active" : ""}
              onClick={() => setSceneId(item.id)}
            >
              <span>
                {index + 1}. {item.title || "Sans nom"}
              </span>
              <small>{item.image_url ? "Image prête" : "Image requise"}</small>
            </button>
          ))}
        </aside>
        {scene && (
          <div className="tour-scene-fields">
            <div className="scene-fields-heading">
              <div>
                <strong>Panorama {tour.scenes.indexOf(scene) + 1}</strong>
                <small>
                  Format équirectangulaire 2:1 recommandé : 4096 × 2048 px.
                </small>
              </div>
              <div>
                <button
                  type="button"
                  className="icon-button"
                  title="Monter"
                  onClick={() => moveScene(tour.scenes.indexOf(scene), -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  title="Descendre"
                  onClick={() => moveScene(tour.scenes.indexOf(scene), 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  title="Supprimer"
                  disabled={tour.scenes.length === 1}
                  onClick={() => {
                    const scenes = tour.scenes
                      .filter((item) => item.id !== scene.id)
                      .map((item, position) => ({
                        ...item,
                        position,
                        hotspots: item.hotspots.filter(
                          (hotspot) => hotspot.target_scene_id !== scene.id,
                        ),
                      }));
                    patchTour({ scenes });
                    setSceneId(scenes[0]?.id || "");
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="form-grid" dir={lang === "ar" ? "rtl" : "ltr"}>
              <label className="form-field">
                Nom de l’espace {lang === "fr" && "*"}
                <input
                  required={lang === "fr"}
                  value={value(
                    scene as unknown as Record<string, unknown>,
                    "title",
                  )}
                  onChange={(event) =>
                    field("scene", "title", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                Description
                <input
                  value={value(
                    scene as unknown as Record<string, unknown>,
                    "description",
                  )}
                  onChange={(event) =>
                    field("scene", "description", event.target.value)
                  }
                />
              </label>
            </div>
            <label
              className={`panorama-upload ${uploading === scene.id ? "loading" : ""}`}
            >
              <ImagePlus size={22} />
              <span>
                {uploading === scene.id
                  ? "Envoi vers Supabase…"
                  : scene.image_url
                    ? "Remplacer le panorama"
                    : "Choisir le panorama 360°"}
              </span>
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!!uploading}
                onChange={(event) =>
                  void upload(scene, event.target.files?.[0])
                }
              />
            </label>
            <label className="form-field">
              Ou coller l’URL publique de l’image
              <input
                type="url"
                value={
                  scene.image_url.startsWith("data:") ? "" : scene.image_url
                }
                onChange={(event) =>
                  patchScene(scene.id, { image_url: event.target.value })
                }
                placeholder="https://…/panorama.jpg"
              />
            </label>
            {scene.image_url && previewTour.scenes.length > 0 && (
              <div className="admin-panorama-preview">
                <PanoramaViewer
                  key={`${scene.id}-${previewTour.scenes.length}`}
                  tour={previewTour}
                  lang="fr"
                  activeScene={scene.id}
                  onViewerReady={setViewer}
                />
              </div>
            )}
            <div className="camera-row">
              <label>
                Angle horizontal
                <input
                  type="number"
                  min={-180}
                  max={180}
                  value={scene.yaw}
                  onChange={(event) =>
                    patchScene(scene.id, { yaw: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Angle vertical
                <input
                  type="number"
                  min={-90}
                  max={90}
                  value={scene.pitch}
                  onChange={(event) =>
                    patchScene(scene.id, { pitch: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Champ de vue
                <input
                  type="number"
                  min={30}
                  max={120}
                  value={scene.hfov}
                  onChange={(event) =>
                    patchScene(scene.id, { hfov: Number(event.target.value) })
                  }
                />
              </label>
              <button
                type="button"
                className="button button-outline"
                disabled={!viewer}
                onClick={() =>
                  viewer &&
                  patchScene(scene.id, {
                    yaw: Math.round(viewer.getYaw()),
                    pitch: Math.round(viewer.getPitch()),
                    hfov: Math.round(viewer.getHfov()),
                  })
                }
              >
                Utiliser la vue actuelle
              </button>
            </div>
            <div className="hotspot-editor">
              <div className="scene-fields-heading">
                <div>
                  <strong>Liens vers les autres espaces</strong>
                  <small>
                    Orientez l’aperçu vers une porte, puis ajoutez le lien à
                    cette position.
                  </small>
                </div>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={addHotspot}
                >
                  <Link2 size={14} /> Ajouter à la vue actuelle
                </button>
              </div>
              {scene.hotspots.map((hotspot) => (
                <div className="hotspot-row" key={hotspot.id}>
                  <select
                    value={hotspot.target_scene_id}
                    onChange={(event) =>
                      patchScene(scene.id, {
                        hotspots: scene.hotspots.map((item) =>
                          item.id === hotspot.id
                            ? { ...item, target_scene_id: event.target.value }
                            : item,
                        ),
                      })
                    }
                  >
                    {tour.scenes
                      .filter((item) => item.id !== scene.id)
                      .map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.title || "Sans nom"}
                        </option>
                      ))}
                  </select>
                  <input
                    value={value(
                      hotspot as unknown as Record<string, unknown>,
                      "text",
                    )}
                    placeholder="Texte du repère"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    onChange={(event) => {
                      const key = `text${suffix}`;
                      patchScene(scene.id, {
                        hotspots: scene.hotspots.map((item) =>
                          item.id === hotspot.id
                            ? { ...item, [key]: event.target.value }
                            : item,
                        ),
                      });
                    }}
                  />
                  <input
                    type="number"
                    title="Angle horizontal"
                    value={hotspot.yaw}
                    onChange={(event) =>
                      patchScene(scene.id, {
                        hotspots: scene.hotspots.map((item) =>
                          item.id === hotspot.id
                            ? { ...item, yaw: Number(event.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                  <input
                    type="number"
                    title="Angle vertical"
                    value={hotspot.pitch}
                    onChange={(event) =>
                      patchScene(scene.id, {
                        hotspots: scene.hotspots.map((item) =>
                          item.id === hotspot.id
                            ? { ...item, pitch: Number(event.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() =>
                      patchScene(scene.id, {
                        hotspots: scene.hotspots.filter(
                          (item) => item.id !== hotspot.id,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!scene.hotspots.length && (
                <p className="subtle">Aucun lien dans ce panorama.</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="tour-publish-row">
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={tour.active}
            onChange={(event) => patchTour({ active: event.target.checked })}
          />{" "}
          Publier immédiatement sur le site
        </label>
        <label>
          Ordre d’affichage{" "}
          <input
            type="number"
            min={0}
            value={tour.position}
            onChange={(event) =>
              patchTour({ position: Number(event.target.value) })
            }
          />
        </label>
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={onCancel}
        >
          Annuler
        </button>
        <button className="button button-dark" disabled={busy || !!uploading}>
          {busy ? "Enregistrement…" : "Enregistrer la visite"}
        </button>
      </div>
    </form>
  );
}
