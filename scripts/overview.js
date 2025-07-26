const posterContainer = document.querySelector("#poster-container");
const shadow = posterContainer.querySelector(".shadow");
const infoContainer = overviewContainer.querySelector(".info");
const completeButtonContainer = overview.querySelector(".button-container");
const completeButton =
  completeButtonContainer.querySelector("#complete-button");

let overviewOpened = false;
let transitioning = false;

function onPosterClick(img, titleElement) {
  if (overviewOpened || transitioning) return;

  const title = titleElement.titleData;

  const name = title.name;
  let colors, date, duration, description, links;

  const isSeries = title.type === "episodeBlock";

  if (isSeries) {
    colors = title.commonData.colors;
    date = "";
    duration = "";
    description = title.commonData.description;
    links = title.commonData.links;
  } else {
    colors = title.colors;
    date = title.date;
    duration = title.duration;
    description = title.description;
    links = title.links;
  }

  if (storage.isHideMode() && storage.isLocked(title)) {
    if (indexOf(title) != nextTitleIndex) return;
    storage.unlock(title.id);
    titleElement.querySelector(".lock").classList.add("hidden");
    updateTitles();
    return;
  }

  lastClickedThumbnail = img;
  toggleOverview();

  const glow = document.querySelector("#glow");

  const [color1, color2] = colors.split(" ");

  const color = adjustColor(color1);

  glow.style.backgroundColor = color;
  completeButtonContainer.style.background = `linear-gradient(to top, ${color} 80%, transparent)`;
  // completeButton.querySelector("path").style.fill = color;
  // poster;

  const bigImg = new Image();
  const titleEl = overviewContainer.querySelector(".title");
  const details = overviewContainer.querySelector(".details");
  const dateEl = overviewContainer.querySelector(".date");
  const durationEl = overviewContainer.querySelector(".duration");
  const descEl = overviewContainer.querySelector(".description");

  // Replace the old poster
  bigImg.classList.add("poster");
  bigImg.classList.add("hidden");
  bigImg.style.boxShadow = getShadow(colors);

  const oldImg = posterContainer.querySelector(".poster");
  if (oldImg) oldImg.remove();
  posterContainer.prepend(bigImg);

  titleEl.innerHTML = name;

  const isFirstBlock =
    !isSeries || (isSeries && title.episodes[0].episodeIndex === 0);

  if (!isSeries) {
    details.classList.remove("inactive");
    dateEl.textContent = formatDate(date);
    durationEl.textContent = formatDuration(duration);

    descEl.classList.remove("inactive");
    descEl.textContent = description;

    completeButtonContainer.classList.remove("inactive");
  } else {
    if (isFirstBlock) {
      descEl.classList.remove("inactive");
      descEl.textContent = description;
    } else {
      descEl.classList.add("inactive");
    }
    details.classList.add("inactive");

    completeButtonContainer.classList.add("inactive");
  }

  updateLinks(links, isFirstBlock);
  updateEpisodes(titleElement, colors);

  settingsButton.classList.add("hidden");

  const contents = Array.from(overviewContainer.querySelectorAll(".content"));
  // contents.push(completeButtonContainer)

  const noPropagation = [titleEl, details, descEl, episodesContainer];
  noPropagation.forEach((content) => {
    content.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  overview.style.overflow = "hidden";

  const startTransition = () => {
    animateImageTransition(
      img,
      bigImg,
      // on clone load
      () => {
        // shadow.classList.remove("hidden");
        img.style.visibility = "hidden";
        setIsGlowing(true);
      },
      // on transition end
      (clone) => {
        bigImg.src = `${postersPath + "/" + title.id + ".webp"}`;

        transitioning = false;
        contents.forEach((content) => {
          content.classList.remove("hidden");
        });
        overview.style.overflow = "auto";

        const finishTransition = () => {
          void bigImg.offsetHeight;
          bigImg.classList.remove("hidden");
          requestAnimationFrame(() => {
            clone.remove();
          });
        };

        if (bigImg.complete) {
          finishTransition();
        } else {
          bigImg.onload = finishTransition;
        }

        // posterContainer.classList.add("shadow");
      }
    );

    bigImg.classList.add("hidden");
    transitioning = true;
  };

  startTransition();
}

overview.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleOverview();
});

function toggleOverview() {
  if (transitioning) return;
  overviewOpened = !overviewOpened;
  toggleMenu();

  if (overviewOpened) {
    document.body.classList.add("noscroll");
    overview.classList.remove("hidden");
  } else {
    const bigImg = overview.querySelector(".poster");
    if (!bigImg || !lastClickedThumbnail) return;

    const closeTransition = () => {
      // posterContainer.classList.remove("shadow");

      let fromEl = bigImg;
      if (!fromEl.complete) {
        bigImg.src = "";
        fromEl = currentClone;
      }

      main.style.overflow = "hidden";

      animateImageTransition(
        fromEl,
        lastClickedThumbnail,
        // on clone load
        () => {
          if (fromEl != bigImg) {
            fromEl.remove();
          }
          bigImg.style.visibility = "hidden";

          setIsGlowing(false);

          const contents = overview.querySelectorAll(".content");
          contents.forEach((content) => {
            content.classList.add("hidden");
          });
          settingsButton.classList.remove("hidden");
        },
        // on transition end
        (clone) => {
          clone.style.transition = "";
          clone.remove();
          main.style.overflow = "auto";
          overview.classList.add("hidden");

          transitioning = false;
          lastClickedThumbnail.style.visibility = "visible";
          overview.scrollTop = 0;
        }
      );

      transitioning = true;
    };

    closeTransition();
  }
}

function animateImageTransition(fromEl, toEl, onCloneLoadCallback, onEnd) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const containerRect = overview.getBoundingClientRect();
  const top = fromRect.top - containerRect.top + overview.scrollTop;
  const left = fromRect.left - containerRect.left + overview.scrollLeft;

  const toRectTop = toRect.top + overview.scrollTop;

  const fromStyle = getComputedStyle(fromEl);
  const toStyle = getComputedStyle(toEl);

  const clone = fromEl.cloneNode(true);
  Object.assign(clone.style, {
    position: "absolute",
    top: `${top}px`,
    left: `${left}px`,
    width: `${fromRect.width}px`,
    height: `${fromRect.height}px`,
    borderRadius: fromStyle.borderRadius,
    filter: fromStyle.filter,
    margin: 0,
    zIndex: 9999,
    boxShadow: fromStyle.boxShadow
      ? fromStyle.boxShadow
      : "-15px 15px 20px rgba(0, 0, 0, 0)",
    pointerEvents: "none",
    willChange: "top, left, width, height",
    transition:
      "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease",
    objectFit: "cover",
  });

  overview.appendChild(clone);
  clone.getBoundingClientRect();
  currentClone = clone;

  function onCloneLoad() {
    onCloneLoadCallback();

    // Ensure transition happens in next frame
    requestAnimationFrame(() => {
      clone.style.top = `${toRectTop}px`;
      clone.style.left = `${toRect.left}px`;
      clone.style.width = `${toRect.width}px`;
      clone.style.height = `${toRect.height}px`;
      clone.style.borderRadius = toStyle.borderRadius; // or adapt dynamically if needed
      clone.style.filter = toStyle.filter;
      clone.style.boxShadow = toStyle.boxShadow;
    });

    clone.addEventListener(
      "transitionend",
      () => {
        onEnd?.(clone);
      },
      { once: true }
    );
  }

  if (clone.complete) {
    onCloneLoad();
  } else {
    clone.onload = onCloneLoad;
  }
}

function setIsGlowing(isGlowing) {
  if (isGlowing) {
    glowContainer.classList.remove("hidden");
  } else {
    glowContainer.classList.add("hidden");
  }
}
