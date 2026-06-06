export function BackToTopButton({ show }) {
  return (
    <button
      className={`back-to-top ${show ? "show" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ^
    </button>
  );
}
