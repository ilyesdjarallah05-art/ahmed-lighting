"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main" className="container py-20">
      <div className="empty-state">
        <h2>Something went wrong.</h2>
        <p>Please try opening the collection again.</p>
        <button className="button button-dark" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
