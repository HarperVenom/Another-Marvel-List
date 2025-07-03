window.addEventListener("beforeunload", () => {
  console.log(main.scrollTop);
  localStorage.setItem("scrollY", main.scrollTop);
});

function restoreScroll() {
  const scrollY = localStorage.getItem("scrollY");
  if (scrollY !== null) {
    main.scrollTo(0, parseInt(scrollY, 10));
  }
}
