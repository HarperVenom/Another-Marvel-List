window.addEventListener("beforeunload", () => {
  localStorage.setItem("scrollY", main.scrollTop);
});

function restoreScroll() {
  if (storage.isHideMode()) {
    scrollToActive();
    return;
  }

  const scrollY = localStorage.getItem("scrollY");
  if (scrollY !== null) {
    main.scrollTo(0, parseInt(scrollY, 10));
  }
}
