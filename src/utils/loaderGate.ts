/** Resolves once the first-load loader has handed over to the hero (instantly if no loader). */
export function loaderDone(): Promise<void> {
  if (typeof document === "undefined" || document.documentElement.dataset.loader !== "on") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => resolve();
    window.addEventListener("loader:done", done, { once: true });
  });
}
