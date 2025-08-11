const menuWrapper = document.querySelector(".menu-wrapper");
const menu = document.querySelector("#menu");
const menuPanel = menu.querySelector(".panel");

const gradient = document.querySelector("#gradient");
const settingsButton = document.querySelector("#settings-button");
const hideModeSwitch = document.querySelector("#hide-button");
const backButton = document.querySelector("#back-button");

let activeTitle;
let nextTitleIndex;

settingsButton.addEventListener("click", () => {
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
});

hideModeSwitch.addEventListener("click", () => {
  storage.setHideMode(!storage.isHideMode());

  updateHideModeSwitchIcon();
});

function indexOf(titleData) {
  return titleElements.findIndex(
    (currentTitle) => currentTitle.titleData.id === titleData.id
  );
}

function updateTitles() {
  activeTitle = titleElements[titleElements.length - 1];

  for (let i = 0; i < titleElements.length; i++) {
    if (!storage.isCompleted(titleElements[i].titleData)) {
      activeTitle = titleElements[i];
      break;
    }
  }

  updateHideModeSwitchIcon();

  titleElements.forEach((title) => {
    const checkmark = title.querySelector(".checkmark");
    if (storage.isHideMode() && storage.isCompleted(title.titleData)) {
      checkmark.style.display = "block";
    } else {
      checkmark.style.display = "none";
    }

    // checkmark.style.display = "none";

    updateLock(title);
    // updateFade(title);
  });
}

function scrollToActive(smooth = false) {
  if (!storage.isHideMode()) return;
  if (smooth) {
    main.style.scrollBehavior = "smooth";
  } else {
    main.style.scrollBehavior = "auto";
  }
  main.scrollTo(0, getScrollChangeTo(activeTitle));
  console.log(activeTitle);
}

function getScrollChangeTo(title) {
  const rect = title.getBoundingClientRect();

  return main.scrollTop + rect.top - (window.innerHeight / 3 - rect.height / 2);
}

function isActive(id) {
  return titleElements[activeTitle].id == id;
}

function updateFade(title) {
  const poster = title.querySelector(".poster");
  if (storage.isHideMode() && storage.isCompleted(title.titleData)) {
    poster.classList.add("fade");
  } else {
    poster.classList.remove("fade");
  }
}

function updateLock(title) {
  const lock = title.querySelector(".lock");

  if (storage.isHideMode()) {
    if (!storage.isCompleted(title.titleData) && activeTitle !== title) {
      lock.classList.remove("hidden");
    } else {
      lock.classList.add("hidden");
    }
  } else {
    lock.classList.add("hidden");
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
