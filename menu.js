const hideButton = document.querySelector("#hide-button");

let activeIndex;
let nextTitleIndex;

hideButton.addEventListener("click", () => {
  storage.setHideMode(!storage.isHideMode());

  updateTitles();
});

function indexOf(movie) {
  return titles.findIndex((currentTitle) => currentTitle.movie.id === movie.id);
}

function updateTitles() {
  if (storage.isHideMode()) {
    for (let i = 0; i < titles.length; i++) {
      if (storage.isLocked(titles[i].movie)) {
        if (i == 0) break;
        else activeIndex = i - 1;
        break;
      }
    }
  }

  nextTitleIndex = activeIndex + 1;

  if (isNaN(nextTitleIndex)) nextTitleIndex = 0;

  titles.forEach((title) => {
    updateLock(title);
  });
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
