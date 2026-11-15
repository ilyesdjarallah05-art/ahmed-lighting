import type { Metadata } from "next";
import { TourPage } from "@/components/tour-page";

export const metadata: Metadata = {
  title: "Visite 360°",
  description:
    "Visitez les showrooms Ahmed à 360 degrés et découvrez les luminaires dans leur espace.",
};

export default function Page() {
  return <TourPage />;
}
