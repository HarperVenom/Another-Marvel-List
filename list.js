let overviewOpened = false;
let transitioning = false;

const postersPath = "new-posters";

const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");

const glowContainer = document.querySelector("#glow-container");

let lastClickedThumbnail = null;

async function fillMovieList() {
  const response = await fetch("titles.json");
  const movies = await response.json();

  const list = document.querySelector(".list");
  list.innerHTML = "";

  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <img class="poster" src="${postersPath + "/" + movie.poster}" alt="" />
      `;

    const img = li.querySelector(".poster");
    img.addEventListener("click", () => {
      if (overviewOpened || transitioning) return;

      // 1. Get position of clicked image
      const thumbRect = img.getBoundingClientRect();

      lastClickedThumbnail = img;
      toggleOverview();

      glowContainer.classList.remove("hidden");

      const glow = document.querySelector("#glow");
      const [color1, color2] = movie.colors.split(" ");
      if (color1 == "") {
        glow.style.background = `radial-gradient(circle at 20% 20%, white, black 80%)`;
      } else {
        glow.style.background = `radial-gradient(circle at 20% 20%, ${color2}, ${color1} 80%)`;
      }

      overviewContainer.innerHTML = `
            <img class="poster big" src="${
              postersPath + "/" + movie.poster
            }" alt="" />
            <div class="info hidden">
              <h2 class="title">${movie.title}</h2>

              <div class="details">
                <h3 class="date">
                  <span class="section">Date: </span>${formatDate(movie.date)}
                </h3>
                <h3 class="duration">
                  <span class="section">Duration: </span>${formatDuration(
                    movie.duration
                  )}
                </h3>
                <p class="description">
                  <span class="section">Description: </span>${movie.description}
                </p>
              </div>
            </div>
          `;

      const info = overviewContainer.querySelector(".info");
      info.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      const bigImg = overviewContainer.querySelector(".poster.big");

      const startTransition = () => {
        animateImageTransition(img, bigImg, () => {
          bigImg.style.visibility = "visible";
          transitioning = false;
          overview.classList.remove("noscroll");
          overview.style.paddingRight = `unset`;
          info.classList.remove("hidden");
        });

        if (overviewContainer.scrollHeight > window.innerHeight) {
          overview.style.paddingRight = `6px`;
        }

        overview.classList.add("noscroll");
        setTimeout(() => {
          img.style.visibility = "hidden";
        }, 10);
        bigImg.style.visibility = "hidden";
        transitioning = true;
      };

      if (bigImg.complete) {
        requestAnimationFrame(startTransition);
      } else {
        bigImg.onload = () => requestAnimationFrame(startTransition);
      }
    });

    list.appendChild(li);
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
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    document.body.classList.add("noscroll");
    overview.classList.remove("hidden");
  } else {
    const bigImg = overview.querySelector(".poster.big");
    if (!bigImg || !lastClickedThumbnail) return;

    const closeTransition = () => {
      animateImageTransition(bigImg, lastClickedThumbnail, () => {
        transitioning = false;
        lastClickedThumbnail.style.visibility = "visible";
        overview.scrollTop = 0;
        document.body.classList.remove("noscroll");
        document.body.style.paddingRight = "";
      });

      transitioning = true;
      setTimeout(() => {
        bigImg.style.visibility = "hidden";
      }, 10);

      overview.classList.add("hidden");
      glowContainer.classList.add("hidden");
    };

    if (bigImg.complete) {
      requestAnimationFrame(closeTransition);
    } else {
      bigImg.onload = () => requestAnimationFrame(closeTransition);
    }
  }
}

function animateImageTransition(fromEl, toEl, onEnd) {
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
    margin: 0,
    zIndex: 9999,
    transform: "translate(0px, 0px) scale(1, 1)",
    transformOrigin: "top left",
    transition: "transform 0.3s ease",
    pointerEvents: "none",
    willChange: "transform",
  });

  document.body.appendChild(clone);

  // Trigger transition on next frame
  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
  });

  clone.addEventListener(
    "transitionend",
    () => {
      clone.remove();
      onEnd?.();
    },
    { once: true }
  );
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
