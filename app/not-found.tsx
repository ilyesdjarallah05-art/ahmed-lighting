import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container py-20">
      <div className="empty-state">
        <h1 className="text-5xl mb-5">A little lost?</h1>
        <p>This page isn’t in our collection.</p>
        <Link className="button button-dark" href="/catalog">
          Find your light ↗
        </Link>
      </div>
    </main>
  );
}
