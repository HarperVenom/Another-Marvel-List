const menuWrapper = document.querySelector(".menu-wrapper");
const menu = document.querySelector("#menu");
const menuPanel = menu.querySelector(".panel");

const gradient = document.querySelector("#gradient");
const settingButton = document.querySelector("#settings-button");
const hideModeSwitch = document.querySelector("#hide-button");
const backButton = document.querySelector("#back-button");

let activeIndex;
let nextTitleIndex;

settingButton.addEventListener("click", () => {
  if (menu.classList.contains("open")) {
    menu.classList.remove("open");
    menuPanel.classList.add("hidden");
    gradient.classList.remove("hidden");

    updateTitles();
    if (storage.isHideMode()) scrollToActive(true);
  } else {
    menu.classList.add("open");
    menuPanel.classList.remove("hidden");
    gradient.classList.add("hidden");
  }

  updateHotBar();
});

hideModeSwitch.addEventListener("click", () => {
  storage.setHideMode(!storage.isHideMode());

  updateHideModeSwitchIcon();
});

backButton.addEventListener("click", () => {
  storage.lock(titles[activeIndex].movie.id);
  updateTitles();

  scrollToActive(true);
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

  updateHotBar();
  updateHideModeSwitchIcon();

  nextTitleIndex = activeIndex + 1;

  titles.forEach((title) => {
    updateLock(title);
  });
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

  // const highlight = title.querySelector(".highlight");
  // if (indexOf(title.movie) == activeIndex) {
  //   highlight.classList.remove("hidden");
  // } else {
  //   highlight.classList.add("hidden");
  // }

  if (indexOf(title.movie) == nextTitleIndex) {
    lock.classList.add("next");
    lock.querySelector("svg").classList.remove("hidden");
  } else {
    lock.querySelector("svg").classList.add("hidden");
    lock.classList.remove("next");
  }
}

window.addEventListener("load", () => {
  updateMenuShift();
});

let previousWidth = window.innerWidth;

window.addEventListener("resize", () => {
  const currentWidth = window.innerWidth;

  if (currentWidth !== previousWidth) {
    previousWidth = currentWidth;
    updateMenuShift();

    if (storage.isHideMode()) {
      scrollToActive();
    }
  }
});

function updateMenuShift() {
  const scrollBarWidth =
    main.getBoundingClientRect().width -
    titleListContainer.getBoundingClientRect().width;
  menuWrapper.style.width = `calc(100vw - ${scrollBarWidth}px)`;
}

function toggleMenu() {
  if (menuWrapper.classList.contains("hidden")) {
    menuWrapper.classList.remove("hidden");
  } else {
    menuWrapper.classList.add("hidden");
  }
}

function updateHotBar() {
  if (
    storage.isHideMode() &&
    activeIndex != -1 &&
    !menu.classList.contains("open")
  ) {
    backButton.classList.remove("hidden");
    settingButton.classList.remove("center");
  } else {
    backButton.classList.add("hidden");
    settingButton.classList.add("center");
  }
}

function updateHideModeSwitchIcon() {
  const visibleIcon = hideModeSwitch.querySelector(".visible");
  const notVisibleIcon = hideModeSwitch.querySelector(".not-visible");

  if (storage.isHideMode()) {
    visibleIcon.classList.add("hidden");
    notVisibleIcon.classList.remove("hidden");
  } else {
    visibleIcon.classList.remove("hidden");
    notVisibleIcon.classList.add("hidden");
  }
}
