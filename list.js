let titles = [];

let overviewOpened = false;
let transitioning = false;

const postersPath = "new-posters";

const main = document.querySelector("main");
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
        <img class="poster" 
        
        src = "${getPosterPath() + "/" + movie.poster}";
        loading="lazy" 
        alt=""
        onerror="
         this.onerror = null;
         this.src = '${postersPath}/${movie.poster}';
         this.onerror = () => {
           this.onerror = null;
           this.src = '';
         };" 
        />
      `;

    const img = li.querySelector(".poster");
    img.addEventListener("click", () => {
      if (overviewOpened || transitioning) return;

      lastClickedThumbnail = img;
      toggleOverview();

      const glow = document.querySelector("#glow");
      const [color1, color2] = movie.colors.split(" ");

      glow.style.background = `linear-gradient(
      45deg,
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
            bigImg.src = `${postersPath + "/" + movie.poster}`;

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
}

overview.addEventListener("click", () => {
  toggleOverview();
});

function toggleOverview() {
  if (transitioning) return;
  overviewOpened = !overviewOpened;

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
  return "new-posters";
}

let currentPostersPath = "";

function updatePostersOnResize() {
  const newPostersPath = getPosterPath();
  if (newPostersPath === currentPostersPath) return;

  console.log(newPostersPath);

  currentPostersPath = newPostersPath;

  titles.forEach((li) => {
    const movie = li.movie; // store the movie on each <li> when created
    const img = li.querySelector(".poster");

    // Update src manually instead of setting innerHTML again
    img.src = `${newPostersPath}/${movie.poster}`;
    img.onerror = function () {
      this.onerror = null;
      this.src = `fallback-folder/${movie.poster}`;
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
