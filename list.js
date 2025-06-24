let titles = [];

let overviewOpened = false;
let transitioning = false;

const postersPath = "new-posters";
const smallPostersPath = "posters-200-300";

const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");

const blur = document.querySelector("#blur");
const glowContainer = document.querySelector("#glow-container");

let lastClickedThumbnail = null;

let currentClone;

async function fillMovieList() {
  const response = await fetch("titles.json");
  const movies = await response.json();

  const list = document.querySelector(".list");
  list.innerHTML = "";

  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <img class="poster" 
        
        src = "${smallPostersPath + "/" + movie.poster}";
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
      to left,
      ${color1} 25%,
      ${color2} 100%
      )`;

      const bigImg = new Image();
      const titleEl = overviewContainer.querySelector(".title");
      const dateEl = overviewContainer.querySelector(".date-value");
      const durationEl = overviewContainer.querySelector(".duration-value");
      const descEl = overviewContainer.querySelector(".description-value");

      // Replace the old poster
      bigImg.classList.add("poster");
      bigImg.classList.add("hidden");

      const oldImg = overviewContainer.querySelector(".poster");
      if (oldImg) oldImg.remove();
      overviewContainer.prepend(bigImg);

      titleEl.innerHTML = movie.title;
      dateEl.textContent = formatDate(movie.date);
      durationEl.textContent = formatDuration(movie.duration);
      descEl.textContent = movie.description;

      const info = overviewContainer.querySelector(".info");
      info.addEventListener("click", (e) => {
        e.stopPropagation();
      });

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
            // console.log(bigImg.getBoundingClientRect().width);
            bigImg.src = `${postersPath + "/" + movie.poster}`;

            const finishTransition = () => {
              requestAnimationFrame(() => {
                // console.log(bigImg.getBoundingClientRect().width);
                clone.classList.add("hidden");
                clone.addEventListener("transitionend", () => clone.remove(), {
                  once: true,
                });

                bigImg.classList.remove("hidden");
              });
            };

            if (bigImg.complete) {
              finishTransition();
            } else {
              bigImg.onload = finishTransition;
            }

            transitioning = false;
            // overview.classList.remove("noscroll");
            // overview.style.paddingRight = `unset`;
            info.classList.remove("hidden");
          }
        );

        if (overviewContainer.scrollHeight > window.innerHeight) {
          // overview.style.paddingRight = `6px`;
        }

        // overview.classList.add("noscroll");
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
    const scrollBarWidth = getScrollbarWidth();
    // document.body.style.paddingRight = `${scrollBarWidth}px`;

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
          overview.classList.add("hidden");
          overview.querySelector(".info").classList.add("hidden");
        },
        // on transition end
        (clone) => {
          clone.style.transition = "";
          // clone.classList.add("hidden");
          clone.remove();
          document.body.classList.remove("noscroll");
          document.body.style.paddingRight = "";

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

  const dx = toRect.left - fromRect.left;
  const dy = toRect.top - fromRect.top;
  const scaleX = toRect.width / fromRect.width;
  const scaleY = toRect.height / fromRect.height;

  const clone = fromEl.cloneNode(true);
  Object.assign(clone.style, {
    position: "fixed",
    top: `${fromRect.top}px`,
    left: `${fromRect.left}px`,
    width: `${fromRect.width}px`,
    height: `${fromRect.height}px`,
    borderRadius: `10px`,
    margin: 0,
    zIndex: 9999,
    transform: "translate(0px, 0px) scale(1, 1)",
    transformOrigin: "top left",
    transition: "transform 0.3s ease, border-radius 0.3s ease",
    pointerEvents: "none",
    willChange: "transform",
    objectFit: "cover",
  });

  document.body.appendChild(clone);
  currentClone = clone;

  function onCloneLoad() {
    onCloneLoadCallback();
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
      clone.style.borderRadius = `${10 / scaleX}px`;
    });

    clone.addEventListener(
      "transitionend",
      () => {
        // clone.remove();
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
    blur.classList.remove("hidden");
  } else {
    glowContainer.classList.add("hidden");
    blur.classList.add("hidden");
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

  if (width < 800) return "posters-200-300";
  return "small-posters";
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
