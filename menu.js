const menuWrapper = document.querySelector(".menu-wrapper");

const settingsButton = document.querySelector("#hide-button");
const backButton = document.querySelector("#back-button");

let activeIndex;
let nextTitleIndex;

settingsButton.addEventListener("click", () => {
  storage.setHideMode(!storage.isHideMode());
  updateTitles();
});

backButton.addEventListener("click", () => {
  storage.lock(titles[activeIndex].movie.id);
  updateTitles();
});

function indexOf(movie) {
  return titles.findIndex((currentTitle) => currentTitle.movie.id === movie.id);
}

function updateTitles() {
  activeIndex = titles.length - 1;
  if (storage.isHideMode()) {
    for (let i = 0; i < titles.length; i++) {
      if (storage.isLocked(titles[i].movie)) {
        if (i == 0) {
          activeIndex = -1;
          break;
        } else activeIndex = i - 1;
        break;
      }
    }
  }

  if (storage.isHideMode() && activeIndex != -1) {
    backButton.classList.remove("hidden");
    settingsButton.classList.remove("center");
  } else {
    backButton.classList.add("hidden");
    settingsButton.classList.add("center");
  }

  nextTitleIndex = activeIndex + 1;

  titles.forEach((title) => {
    updateLock(title);
  });

  if (storage.isHideMode()) scrollToActive(true);
}

function scrollToActive(smooth = false) {
  if (activeIndex == -1) {
    main.scrollTo(0, 0);
    return;
  }
  const title = titles[activeIndex];

  if (smooth) {
    main.style.scrollBehavior = "smooth";
  } else {
    main.style.scrollBehavior = "auto";
  }
  main.scrollTo(0, getScrollChangeTo(title));
}

function getScrollChangeTo(title) {
  const rect = title.getBoundingClientRect();

  return main.scrollTop + rect.top - (window.innerHeight / 3 - rect.height / 2);
}

function isActive(id) {
  return titles[activeIndex].id == id;
}

function updateLock(title) {
  const lock = title.querySelector(".lock");

  if (storage.isHideMode()) {
    if (storage.isLocked(title.movie)) {
      lock.classList.remove("hidden");
    } else {
      lock.classList.add("hidden");
    }
  } else {
    lock.classList.add("hidden");
  }

  if (indexOf(title.movie) == nextTitleIndex) {
    lock.classList.add("next");
    lock.querySelector("svg").classList.remove("hidden");
  } else {
    lock.querySelector("svg").classList.add("hidden");
    lock.classList.remove("next");
  }
}

function getScrollbarWidth(element) {
  return element.offsetWidth - element.clientWidth;
}
window.addEventListener("load", () => {
  updateMenuShift();
});

window.addEventListener("resize", () => {
  updateMenuShift();
  scrollToActive();
});

function updateMenuShift() {
  menuWrapper.style.width = `calc(100vw - ${getScrollbarWidth(main)}px)`;
}

function toggleMenu() {
  if (menuWrapper.classList.contains("hidden")) {
    menuWrapper.classList.remove("hidden");
  } else {
    menuWrapper.classList.add("hidden");
  }
}
