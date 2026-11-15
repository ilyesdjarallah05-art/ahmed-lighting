import test from "node:test";
import assert from "node:assert/strict";
import { normalizeScene, prepareTour, validateTour } from "../lib/tours.ts";
import type { VirtualTour } from "../lib/types.ts";

const tour = (): VirtualTour => ({
  id: "tour-1",
  title: " Showroom ",
  description: " Démonstration ",
  location: " Alger ",
  cover_image: "",
  active: true,
  position: 1,
  scenes: [
    {
      id: "a",
      title: "Entrée",
      image_url: "/a.jpg",
      pitch: 110,
      yaw: -240,
      hfov: 180,
      position: 2,
      hotspots: [
        { id: "h", target_scene_id: "b", text: "Suite", pitch: -120, yaw: 250 },
      ],
    },
    {
      id: "b",
      title: "Galerie",
      image_url: "/b.jpg",
      pitch: 0,
      yaw: 0,
      hfov: 90,
      position: 1,
      hotspots: [],
    },
  ],
});

test("tour preparation orders scenes, trims copy, and clamps camera values", () => {
  const prepared = prepareTour(tour());
  assert.equal(prepared.title, "Showroom");
  assert.equal(prepared.scenes[0].id, "b");
  const entrance = prepared.scenes[1];
  assert.deepEqual(
    [entrance.pitch, entrance.yaw, entrance.hfov],
    [90, -180, 120],
  );
  assert.deepEqual(
    [entrance.hotspots[0].pitch, entrance.hotspots[0].yaw],
    [-90, 180],
  );
  assert.equal(prepared.cover_image, "/a.jpg");
});

test("tour validation rejects missing images and broken or self-referencing links", () => {
  const value = tour();
  value.scenes[0].image_url = "";
  value.scenes[0].hotspots[0].target_scene_id = "a";
  const errors = validateTour(value);
  assert.ok(errors.some((error) => error.includes("n’a pas d’image")));
  assert.ok(errors.some((error) => error.includes("même panorama")));
  value.scenes[0].hotspots[0].target_scene_id = "removed";
  assert.ok(validateTour(value).some((error) => error.includes("supprimé")));
});

test("scene normalization keeps safe panorama limits", () => {
  const normalized = normalizeScene(tour().scenes[0], 0);
  assert.equal(normalized.position, 0);
  assert.ok(normalized.hfov >= 30 && normalized.hfov <= 120);
});
