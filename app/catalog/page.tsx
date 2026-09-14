import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog-page";
export const metadata = { title: "The collection" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <main id="main" className="container py-20">
          Finding your light…
        </main>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
