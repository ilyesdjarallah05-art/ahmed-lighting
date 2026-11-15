"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { localized, safeImage } from "@/lib/catalog";
import { orderedScenes } from "@/lib/tours";
import type { Language, VirtualTour } from "@/lib/types";

type Props = {
  tour: VirtualTour;
  lang: Language;
  activeScene?: string;
  className?: string;
  onSceneChange?: (id: string) => void;
  onViewerReady?: (viewer: Pannellum.Viewer | null) => void;
};

export function PanoramaViewer({
  tour,
  lang,
  activeScene,
  className = "",
  onSceneChange,
  onViewerReady,
}: Props) {
  const reactId = useId();
  const id = `panorama-${reactId.replace(/:/g, "")}`;
  const viewer = useRef<Pannellum.Viewer | null>(null);
  const sceneChangeHandler = useRef(onSceneChange);
  const readyHandler = useRef(onViewerReady);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.pannellum),
  );
  const scenes = useMemo(() => orderedScenes(tour), [tour]);
  const firstScene = scenes[0]?.id;

  useEffect(() => {
    sceneChangeHandler.current = onSceneChange;
  }, [onSceneChange]);
  useEffect(() => {
    readyHandler.current = onViewerReady;
  }, [onViewerReady]);

  const destroy = useCallback(() => {
    if (viewer.current) {
      readyHandler.current?.(null);
      viewer.current.destroy();
      viewer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!scriptReady || !firstScene || !window.pannellum) return;
    destroy();
    const config: Pannellum.TourOptions = {
      default: {
        firstScene,
        sceneFadeDuration: 300,
        autoLoad: true,
        autoRotate: -1,
        autoRotateInactivityDelay: 4500,
        showControls: true,
        compass: false,
        escapeHTML: true,
        hotSpotDebug: false,
        strings: {
          loadButtonLabel:
            lang === "ar"
              ? "فتح المشهد"
              : lang === "en"
                ? "Open panorama"
                : "Ouvrir le panorama",
          loadingLabel:
            lang === "ar"
              ? "جار التحميل…"
              : lang === "en"
                ? "Loading…"
                : "Chargement…",
          twoTouchActivate:
            lang === "ar"
              ? "استخدم إصبعين لتحريك المشهد"
              : lang === "en"
                ? "Use two fingers to move the view"
                : "Utilisez deux doigts pour déplacer la vue",
          ctrlZoomActivate:
            lang === "ar"
              ? "استخدم Ctrl مع التمرير للتكبير"
              : lang === "en"
                ? "Use Ctrl + scroll to zoom"
                : "Utilisez Ctrl + défilement pour zoomer",
        },
      },
      scenes: Object.fromEntries(
        scenes.map((scene) => [
          scene.id,
          {
            type: "equirectangular" as const,
            panorama: safeImage(scene.image_url),
            title: localized(scene, "title", lang),
            pitch: scene.pitch,
            yaw: scene.yaw,
            hfov: scene.hfov,
            hotSpots: (scene.hotspots || []).map((hotspot) => ({
              id: hotspot.id,
              type: "scene" as const,
              sceneId: hotspot.target_scene_id,
              pitch: hotspot.pitch,
              yaw: hotspot.yaw,
              text: localized(hotspot, "text", lang),
            })),
          },
        ]),
      ),
    };
    viewer.current = window.pannellum.viewer(id, config);
    viewer.current.on("scenechange", (sceneId) =>
      sceneChangeHandler.current?.(sceneId),
    );
    readyHandler.current?.(viewer.current);
    return destroy;
  }, [destroy, firstScene, id, lang, scenes, scriptReady]);

  useEffect(() => {
    if (
      activeScene &&
      viewer.current &&
      viewer.current.getScene() !== activeScene
    )
      viewer.current.loadScene(activeScene);
  }, [activeScene]);

  return (
    <>
      <Script
        src="/vendor/pannellum/pannellum.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        id={id}
        className={`panorama-viewer ${className}`}
        aria-label={localized(tour, "title", lang)}
      />
    </>
  );
}
