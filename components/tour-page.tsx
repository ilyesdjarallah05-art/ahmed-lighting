"use client";

import { useMemo, useState } from "react";
import { MapPin, Move3d, Store } from "lucide-react";
import { useStore } from "./store-provider";
import { PanoramaViewer } from "./panorama-viewer";
import { localized, safeImage } from "@/lib/catalog";
import { orderedScenes } from "@/lib/tours";
import { t } from "@/lib/i18n";

export function TourPage() {
  const store = useStore();
  const tours = useMemo(
    () =>
      [...store.tours]
        .filter((tour) => tour.active)
        .sort((a, b) => a.position - b.position),
    [store.tours],
  );
  const [selectedTourId, setSelectedTourId] = useState("");
  const tour = tours.find((item) => item.id === selectedTourId) || tours[0];
  const scenes = tour ? orderedScenes(tour) : [];
  const [selectedScenes, setSelectedScenes] = useState<Record<string, string>>(
    {},
  );
  const selectedScene = tour ? selectedScenes[tour.id] || scenes[0]?.id : "";

  if (!store.loading && !tour)
    return (
      <main className="tour-page tour-empty">
        <div className="empty-illustration">
          <Move3d size={36} />
        </div>
        <span className="eyebrow">{t("tour360", store.lang)}</span>
        <h1>{t("tourEmptyTitle", store.lang)}</h1>
        <p>{t("tourEmptyDesc", store.lang)}</p>
      </main>
    );

  return (
    <main className="tour-page">
      <header className="tour-hero">
        <div>
          <span className="eyebrow">{t("tourEyebrow", store.lang)}</span>
          <h1>{t("tourTitle", store.lang)}</h1>
          <p>{t("tourSubtitle", store.lang)}</p>
        </div>
        <Move3d aria-hidden size={44} strokeWidth={1.2} />
      </header>

      {tours.length > 1 && (
        <div
          className="tour-store-tabs"
          aria-label={t("tourChooseStore", store.lang)}
        >
          {tours.map((item) => (
            <button
              key={item.id}
              className={item.id === tour?.id ? "active" : ""}
              onClick={() => setSelectedTourId(item.id)}
            >
              <img
                src={safeImage(item.cover_image || item.scenes[0]?.image_url)}
                alt=""
              />
              <span>
                <Store size={15} />
                {localized(item, "title", store.lang)}
              </span>
            </button>
          ))}
        </div>
      )}

      {tour && (
        <section className="tour-shell">
          <div className="tour-heading">
            <div>
              <h2>{localized(tour, "title", store.lang)}</h2>
              {tour.location && (
                <p>
                  <MapPin size={15} />
                  {localized(tour, "location", store.lang)}
                </p>
              )}
            </div>
            <p>{localized(tour, "description", store.lang)}</p>
          </div>
          <div className="tour-experience">
            <div className="tour-canvas-wrap">
              <PanoramaViewer
                key={`${tour.id}-${store.lang}`}
                tour={tour}
                lang={store.lang}
                activeScene={selectedScene}
                onSceneChange={(id) =>
                  setSelectedScenes((current) => ({
                    ...current,
                    [tour.id]: id,
                  }))
                }
              />
              <div className="tour-drag-hint">
                <Move3d size={15} />
                {t("tourDragHint", store.lang)}
              </div>
            </div>
            <aside className="tour-scenes">
              <span className="eyebrow">{t("tourSpaces", store.lang)}</span>
              <p>{t("tourSpacesHint", store.lang)}</p>
              <div>
                {scenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    className={scene.id === selectedScene ? "active" : ""}
                    onClick={() =>
                      setSelectedScenes((current) => ({
                        ...current,
                        [tour.id]: scene.id,
                      }))
                    }
                  >
                    <span>{localized(scene, "title", store.lang)}</span>
                    <small>
                      {index + 1} / {scenes.length}
                    </small>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
