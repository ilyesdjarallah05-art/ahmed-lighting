import type { PanoramaScene, VirtualTour } from "./types.ts";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

export function orderedScenes(tour: VirtualTour) {
  return [...(tour.scenes || [])].sort((a, b) => a.position - b.position);
}

export function normalizeScene(
  scene: PanoramaScene,
  position: number,
): PanoramaScene {
  return {
    ...scene,
    position,
    pitch: clamp(Number(scene.pitch), -90, 90),
    yaw: clamp(Number(scene.yaw), -180, 180),
    hfov: clamp(Number(scene.hfov) || 100, 30, 120),
    hotspots: (scene.hotspots || []).map((hotspot) => ({
      ...hotspot,
      pitch: clamp(Number(hotspot.pitch), -90, 90),
      yaw: clamp(Number(hotspot.yaw), -180, 180),
    })),
  };
}

export function validateTour(tour: VirtualTour): string[] {
  const errors: string[] = [];
  if (!tour.title.trim())
    errors.push("Le nom français de la visite est requis.");
  if (!tour.scenes.length) errors.push("Ajoutez au moins un panorama.");
  const ids = new Set<string>();
  tour.scenes.forEach((scene, index) => {
    if (!scene.title.trim())
      errors.push(`Le panorama ${index + 1} doit avoir un nom français.`);
    if (!scene.image_url.trim())
      errors.push(
        `Le panorama « ${scene.title || index + 1} » n’a pas d’image.`,
      );
    if (ids.has(scene.id))
      errors.push("Chaque panorama doit avoir un identifiant unique.");
    ids.add(scene.id);
  });
  tour.scenes.forEach((scene) =>
    scene.hotspots.forEach((hotspot) => {
      if (hotspot.target_scene_id === scene.id)
        errors.push(
          `Un lien de « ${scene.title} » pointe vers le même panorama.`,
        );
      else if (!ids.has(hotspot.target_scene_id))
        errors.push(
          `Un lien de « ${scene.title} » pointe vers un panorama supprimé.`,
        );
    }),
  );
  return errors;
}

export function prepareTour(tour: VirtualTour): VirtualTour {
  return {
    ...tour,
    title: tour.title.trim(),
    description: tour.description.trim(),
    location: tour.location.trim(),
    cover_image: tour.cover_image.trim() || tour.scenes[0]?.image_url || "",
    position: Number(tour.position) || 0,
    scenes: orderedScenes(tour).map(normalizeScene),
  };
}
