let titles = [];
const storage = new TitlesStorage();

let overviewOpened = false;
let transitioning = false;

const postersPath = "posters";

const main = document.querySelector("main");
const titleListContainer = document.querySelector(".title-list-container");
const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");
const posterContainer = document.querySelector("#poster-container");

// const blur = document.querySelector("#blur");
const glowContainer = document.querySelector("#glow-container");

let lastClickedThumbnail = null;

let currentClone;

async function fillMovieList() {
  const response = await fetch("titles.json");
  const movies = await response.json();

  const list = document.querySelector(".list");
  list.innerHTML = "";

  movies.forEach((movie, index) => {
    if (movie.title == "") return;

    const li = document.createElement("li");
    li.innerHTML = `
     <div class="highlight hidden"></div>
     <div class="poster-wrapper">
      <img class="poster" 
          src = "${getPosterPath() + "/" + movie.id + ".webp"}";
          loading="lazy" 
          alt=""
          onerror="
          this.onerror = null;
          this.src = '${postersPath}/${movie.id + ".webp"}';
          this.onerror = () => {
            this.onerror = null;
            this.src = '';
          };" 
          />

      <div class="lock">
        ${clickSvg("rgba(50, 50, 50)")}
      </div>
    </div>
      `;

    const [color1, color2] = movie.colors.split(" ");

    const highlight = li.querySelector(".highlight");
    highlight.style.backgroundColor = color2;

    const img = li.querySelector(".poster");
    img.addEventListener("click", () => {
      if (overviewOpened || transitioning) return;

      if (storage.isHideMode() && storage.isLocked(movie)) {
        if (indexOf(movie) != nextTitleIndex) return;
        storage.unlock(movie.id);
        li.querySelector(".lock").classList.add("hidden");
        updateTitles();
        return;
      }

      lastClickedThumbnail = img;
      toggleOverview();

      const glow = document.querySelector("#glow");

      glow.style.background = `linear-gradient(
      ${window.innerWidth > 800 ? 45 : 135}deg,
      ${color1},
      ${color2} 100%
      )`;

      const bigImg = new Image();
      const titleEl = overviewContainer.querySelector(".title");
      const dateEl = overviewContainer.querySelector(".date");
      const durationEl = overviewContainer.querySelector(".duration");
      const descEl = overviewContainer.querySelector(".description");

      // Replace the old poster
      bigImg.classList.add("poster");
      bigImg.classList.add("hidden");

      const oldImg = posterContainer.querySelector(".poster");
      if (oldImg) oldImg.remove();
      posterContainer.prepend(bigImg);

      titleEl.innerHTML = movie.title;
      dateEl.textContent = formatDate(movie.date);
      durationEl.textContent = formatDuration(movie.duration);
      descEl.textContent = movie.description;

      const info = overviewContainer.querySelector(".info");
      info.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      overview.style.overflow = "hidden";

      const startTransition = () => {
        animateImageTransition(
          img,
          bigImg,
          // on clone load
          () => {
            img.style.visibility = "hidden";
            setIsGlowing(true);
          },
          // on transition end
          (clone) => {
            bigImg.src = `${postersPath + "/" + movie.id + ".webp"}`;

            transitioning = false;
            info.classList.remove("hidden");
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
          }
        );

        bigImg.classList.add("hidden");
        transitioning = true;
      };

      startTransition();
    });

    list.appendChild(li);
    li.movie = movie;
    titles.push(li);
  });

  fillYears();

  updateTitles();
  restoreScroll();

  document.body.classList.remove("hidden");
}

overview.addEventListener("click", () => {
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
          overview.querySelector(".info").classList.add("hidden");
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
    margin: 0,
    zIndex: 9999,
    pointerEvents: "none",
    willChange: "top, left, width, height",
    transition:
      "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease",
    objectFit: "cover",
  });

  overview.appendChild(clone);
  // document.body.appendChild(clone);
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

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

fillMovieList();

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getYear(dateStr) {
  return dateStr.split("-")[0];
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = "";
  if (hours > 0) result += `${hours}h`;
  if (mins > 0) result += (hours > 0 ? " " : "") + `${mins}m`;
  return result;
}

function hexToRgba(hex, alpha = 1) {
  // Remove '#' if present
  hex = hex.replace(/^#/, "");

  // Expand shorthand form (e.g. "abc" → "aabbcc")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6) {
    throw new Error("Invalid hex color: " + hex);
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPosterPath() {
  const width = window.innerWidth;

  // return "new-posters";

  // if (width < 600) return "posters-100-150";
  if (width < 900) return "small-posters";
  return "posters";
}

let currentPostersPath = "";

function updatePostersOnResize() {
  const newPostersPath = getPosterPath();
  if (newPostersPath === currentPostersPath) return;

  currentPostersPath = newPostersPath;

  titles.forEach((li) => {
    const movie = li.movie; // store the movie on each <li> when created
    const img = li.querySelector(".poster");

    // Update src manually instead of setting innerHTML again
    img.src = `${newPostersPath}/${movie.id + ".webp"}`;
    img.onerror = function () {
      this.onerror = null;
      this.src = `fallback-folder/${movie.id + ".webp"}`;
      this.onerror = () => {
        this.onerror = null;
        this.src = "";
      };
    };
  });
}

window.addEventListener("resize", () => {
  updatePostersOnResize();
});

function fillYears() {
  let lastYear = 0;
  titles.forEach((title) => {
    const currentYear = getYear(title.movie.date);
    if (currentYear > lastYear) {
      lastYear = currentYear;

      const yearLabel = document.createElement("div");
      yearLabel.textContent = currentYear;
      yearLabel.classList.add("year-label");

      title.appendChild(yearLabel);
    }
  });
}

function clickSvg(color = "#000000") {
  return `<svg class="hidden" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xml:space="preserve">
<g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
  <path d="M 69.416 43.298 H 68.97 c -0.983 0 -1.917 0.216 -2.756 0.603 c -0.644 -2.975 -3.295 -5.21 -6.459 -5.21 h -0.447 c -1.128 0 -2.19 0.284 -3.12 0.784 c -1 -2.379 -3.355 -4.054 -6.094 -4.054 h -0.447 c -0.925 0 -1.807 0.191 -2.606 0.536 v -9.458 c 0 -3.644 -2.964 -6.607 -6.608 -6.607 h -0.447 c -3.643 0 -6.607 2.964 -6.607 6.607 v 24.261 l -3.005 2.281 c -2.394 1.817 -3.911 4.461 -4.273 7.444 c -0.362 2.984 0.479 5.914 2.37 8.251 l 9.378 11.594 v 4.608 c 0 2.791 2.271 5.063 5.062 5.063 h 23.411 c 2.791 0 5.063 -2.271 5.063 -5.063 l 0.001 -4.375 c 2.996 -3.766 4.639 -8.438 4.639 -13.242 V 49.905 C 76.023 46.262 73.06 43.298 69.416 43.298 z M 72.023 67.32 c 0 4.102 -1.478 8.088 -4.159 11.224 c -0.311 0.362 -0.48 0.823 -0.48 1.3 v 5.094 c 0 0.586 -0.477 1.063 -1.063 1.063 H 42.911 c -0.585 0 -1.062 -0.477 -1.062 -1.063 v -5.316 c 0 -0.458 -0.157 -0.902 -0.445 -1.258 L 31.581 66.22 c -1.204 -1.488 -1.74 -3.354 -1.509 -5.254 c 0.23 -1.899 1.197 -3.583 2.721 -4.74 l 0.586 -0.444 v 5.495 c 0 1.104 0.896 2 2 2 s 2 -0.896 2 -2 v -9.506 c 0 -0.014 0 -0.026 0 -0.04 V 26.498 c 0 -1.438 1.169 -2.607 2.607 -2.607 h 0.447 c 1.438 0 2.607 1.17 2.607 2.607 v 15.53 s 0 0 0 0.001 s 0 0 0 0.001 l 0.01 12.917 c 0.001 1.104 0.896 1.998 2 1.998 c 1.104 -0.001 1.999 -0.896 1.998 -2.002 L 47.04 42.028 c 0 -1.438 1.169 -2.607 2.606 -2.607 h 0.447 c 1.438 0 2.607 1.17 2.607 2.607 v 3.27 l 0.009 9.647 c 0.001 1.104 0.896 1.998 2 1.998 c 1.104 -0.001 1.999 -0.897 1.998 -2.002 l -0.009 -9.646 c 0 -1.438 1.169 -2.607 2.606 -2.607 h 0.447 c 1.438 0 2.607 1.17 2.607 2.607 v 4.088 c -0.006 0.066 -0.02 0.13 -0.02 0.197 l 0.01 5.366 c 0.002 1.104 0.897 1.996 2 1.996 c 1.104 -0.002 1.998 -0.899 1.996 -2.004 l -0.009 -4.852 c 0.006 -0.062 0.019 -0.121 0.019 -0.184 c 0 -1.438 1.17 -2.607 2.607 -2.607 h 0.446 c 1.438 0 2.607 1.17 2.607 2.607 V 67.32 z" style="fill: ${color};"/>
  <path d="M 63.994 25.511 H 51.79 c -1.104 0 -2 -0.896 -2 -2 s 0.896 -2 2 -2 h 12.204 c 1.104 0 2 0.896 2 2 S 65.099 25.511 63.994 25.511 z" style="fill: ${color};"/>
  <path d="M 39.985 16.204 c -1.104 0 -2 -0.896 -2 -2 V 2 c 0 -1.104 0.896 -2 2 -2 s 2 0.896 2 2 v 12.204 C 41.985 15.309 41.09 16.204 39.985 16.204 z" style="fill: ${color};"/>
  <path d="M 48.558 18.441 c -0.512 0 -1.023 -0.195 -1.414 -0.586 c -0.781 -0.781 -0.781 -2.047 0 -2.828 l 8.63 -8.629 c 0.781 -0.781 2.047 -0.781 2.828 0 c 0.781 0.781 0.781 2.047 0 2.828 l -8.63 8.629 C 49.581 18.246 49.069 18.441 48.558 18.441 z" style="fill: ${color};"/>
  <path d="M 28.181 25.511 H 15.977 c -1.104 0 -2 -0.896 -2 -2 s 0.896 -2 2 -2 h 12.204 c 1.104 0 2 0.896 2 2 S 29.285 25.511 28.181 25.511 z" style="fill: ${color};"/>
  <path d="M 31.413 18.441 c -0.512 0 -1.024 -0.195 -1.414 -0.586 L 21.37 9.226 c -0.781 -0.781 -0.781 -2.047 0 -2.828 c 0.78 -0.781 2.048 -0.781 2.828 0 l 8.629 8.629 c 0.781 0.781 0.781 2.047 0 2.828 C 32.437 18.246 31.925 18.441 31.413 18.441 z" style="fill: ${color};"/>
</g>
</svg>`;
}
