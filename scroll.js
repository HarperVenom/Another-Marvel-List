// Save scroll position before unload
window.addEventListener("beforeunload", () => {
  localStorage.setItem("scrollY", window.scrollY);
});

// Restore scroll position on load
window.addEventListener("load", () => {
  const scrollY = localStorage.getItem("scrollY");

  // Use double rAF to wait for layout and rendering
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (scrollY !== null) {
        window.scrollTo(0, parseInt(scrollY));
      }

      // Reveal the page
      document.body.classList.remove("hidden");
    });
  });
});
