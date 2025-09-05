const posterContainer = document.querySelector("#poster-container");
const shadow = posterContainer.querySelector(".shadow");
const infoContainer = overviewContainer.querySelector(".info");
const completeButtonContainer = overview.querySelector(".button-container");
const completeButton =
  completeButtonContainer.querySelector("#complete-button");

let overviewOpened = false;
let transitioning = false;
let lastClickedTitle = null;
let currentCompleteButtonClickListener = null;

// ---- OPEN ----
function openOverview(titleElement) {
  if (transitioning || overviewOpened) return;
  overviewOpened = true;
  lastClickedTitle = titleElement;

  document.body.classList.add("noscroll");
  overview.classList.remove("hidden");
  toggleMenu();

  if (!history.state || !history.state.overviewOpen) {
    history.pushState({ overviewOpen: true }, "", "");
  }

  settingsButton.classList.add("hidden");
  overview.style.overflow = "hidden";

  // your poster + text + data setup
  const title = titleElement.titleData;
  const name = title.name;
  const isSeries = title.type === "episodeBlock";

  let colors, date, duration, description, links;
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

  const glow = document.querySelector("#glow");
  const [color1] = colors.split(" ");
  glow.style.backgroundColor = adjustColor(color1);
  titleElement.querySelector(".highlight").style.opacity = 0;

  const bigImg = new Image();
  bigImg.classList.add("poster", "hidden");
  bigImg.style.boxShadow = getShadow(colors);

  const oldImg = posterContainer.querySelector(".poster");
  if (oldImg) oldImg.remove();
  posterContainer.prepend(bigImg);

  const titleEl = overviewContainer.querySelector(".title");
  const details = overviewContainer.querySelector(".details");
  const dateEl = overviewContainer.querySelector(".date");
  const durationEl = overviewContainer.querySelector(".duration");
  const descEl = overviewContainer.querySelector(".description");

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
    if (storage.isCompleted(title)) {
      completeButton.classList.add("checked");
    } else {
      completeButton.classList.remove("checked");
    }
    setCompleteButtonListener(title);
  } else {
    if (isFirstBlock) {
      descEl.classList.remove("inactive");
      descEl.textContent = description;
    } else {
      descEl.classList.add("inactive");
    }

    dateEl.textContent = formatEpisodeDateRange(title);
    durationEl.textContent = formatTotalDuration(title);

    completeButtonContainer.classList.add("inactive");
  }

  updateLinks(links, isFirstBlock);
  updateEpisodes(titleElement, colors);

  const contents = Array.from(overviewContainer.querySelectorAll(".content"));
  const noPropagation = [
    titleEl,
    details,
    descEl,
    episodesContainer,
    completeButton,
  ];
  noPropagation.forEach((content) => {
    content.addEventListener("click", (e) => e.stopPropagation());
  });

  animateImageTransition(
    titleElement.querySelector(".poster"),
    bigImg,
    () => {
      titleElement.querySelector(".poster").style.visibility = "hidden";
      setIsGlowing(true);
    },
    (clone) => {
      bigImg.src = `${postersPath + "/" + title.id + ".webp"}`;
      transitioning = false;
      contents.forEach((c) => c.classList.remove("hidden"));
      overview.style.overflow = "auto";

      const finishTransition = () => {
        void bigImg.offsetHeight;
        bigImg.classList.remove("hidden");
        requestAnimationFrame(() => clone.remove());
      };
      if (bigImg.complete) finishTransition();
      else bigImg.onload = finishTransition;
    }
  );

  bigImg.classList.add("hidden");
  transitioning = true;
}

// ---- CLOSE ----
function closeOverview() {
  if (transitioning || !overviewOpened) return;
  overviewOpened = false;
  toggleMenu();

  const bigImg = overview.querySelector(".poster");
  if (!bigImg || !lastClickedTitle) return;

  let fromEl = bigImg;
  if (!fromEl.complete) {
    bigImg.src = "";
    fromEl = currentClone;
  }

  main.style.overflow = "hidden";

  animateImageTransition(
    fromEl,
    lastClickedTitle.querySelector(".poster"),
    () => {
      if (fromEl !== bigImg) fromEl.remove();
      bigImg.style.visibility = "hidden";
      setIsGlowing(false);
      const contents = overview.querySelectorAll(".content");
      contents.forEach((c) => c.classList.add("hidden"));
      settingsButton.classList.remove("hidden");
    },
    (clone) => {
      clone.remove();
      main.style.overflow = "auto";
      overview.classList.add("hidden");

      transitioning = false;
      lastClickedTitle.querySelector(".poster").style.visibility = "visible";
      overview.scrollTop = 0;

      const highlight = lastClickedTitle.querySelector(".highlight");
      highlight.style.transition = "opacity 0.5s ease, outline-color 0.1s ease";
      void highlight.offsetWidth;
      highlight.style.opacity = 1;
      highlight.classList.remove("pulse");
      void highlight.offsetWidth;
      highlight.classList.add("pulse");
      setTimeout(() => {
        highlight.style.transition =
          "opacity 0.1s ease, outline-color 0.1s ease";
      }, 500);

      if (history.state && history.state.overviewOpen) {
        history.back(); // <--- keep back navigation
      }
    }
  );

  transitioning = true;
}

// ---- TOGGLE (wrapper) ----
function toggleOverview(open) {
  if (open === undefined) open = !overviewOpened;
  if (open) openOverview(lastClickedTitle);
  else closeOverview();
}

// ---- BACK/FORWARD ----
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.overviewOpen) {
    if (!overviewOpened) openOverview(lastClickedTitle);
  } else {
    if (overviewOpened) closeOverview();
  }
});

// ---- click to close ----
overview.addEventListener("click", (e) => {
  e.stopPropagation();
  closeOverview();
});

// ---- poster click ----
function onPosterClick(img, titleElement) {
  if (overviewOpened || transitioning) return;
  openOverview(titleElement);
}

// ---- helpers ----
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
    boxShadow: fromStyle.boxShadow || "-15px 15px 20px rgba(0,0,0,0)",
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
    requestAnimationFrame(() => {
      clone.style.top = `${toRectTop}px`;
      clone.style.left = `${toRect.left}px`;
      clone.style.width = `${toRect.width}px`;
      clone.style.height = `${toRect.height}px`;
      clone.style.filter = toStyle.filter;
      clone.style.boxShadow = toStyle.boxShadow;
    });
    clone.addEventListener("transitionend", () => onEnd?.(clone), {
      once: true,
    });
  }

  if (clone.complete) onCloneLoad();
  else clone.onload = onCloneLoad;
}

function setIsGlowing(isGlowing) {
  if (isGlowing) glowContainer.classList.remove("hidden");
  else glowContainer.classList.add("hidden");
}

function setCompleteButtonListener(title) {
  if (currentCompleteButtonClickListener) {
    completeButton.removeEventListener(
      "click",
      currentCompleteButtonClickListener
    );
  }
  currentCompleteButtonClickListener = function () {
    if (!storage.isCompleted(title)) {
      storage.completeTitle(title.id);
      completeButton.classList.add("checked");
    } else {
      storage.uncompleteTitle(title.id);
      completeButton.classList.remove("checked");
    }
    updateTitles();
    updateListInfo();
    setTimeout(() => closeOverview(), 100);
  };
  completeButton.addEventListener("click", currentCompleteButtonClickListener);
}

function formatEpisodeDateRange(season) {
  if (!season.episodes || season.episodes.length === 0) return "";

  const dates = season.episodes
    .map((ep) => new Date(ep.date))
    .sort((a, b) => a - b);

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const longFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const shortFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (firstDate.getTime() === lastDate.getTime()) {
    return longFormatter.format(firstDate);
  } else {
    return `${shortFormatter.format(firstDate)} - ${shortFormatter.format(
      lastDate
    )}`;
  }
}

function formatTotalDuration(season) {
  if (!season.episodes || season.episodes.length === 0) return "0m";

  const totalMinutes = season.episodes.reduce(
    (sum, ep) => sum + ep.duration,
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}
