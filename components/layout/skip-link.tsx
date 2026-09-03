/**
 * First-in-tab-order control that jumps past the header into the page's
 * `<main>`. Site, legal, and other layouts that render a main landmark must
 * give it `id="main-content"` (and `tabIndex={-1}` so the jump can land).
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
