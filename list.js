let overviewOpened = false;
let transitioning = false;

const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");

let lastClickedThumbnail = null;

async function fillMovieList() {
  const response = await fetch("titles.json");
  const movies = await response.json();

  const list = document.querySelector(".list");

  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <img class="poster" src="posters/${movie.poster}" alt="" />
      `;

    const img = li.querySelector(".poster");
    img.addEventListener("click", () => {
      if (overviewOpened || transitioning) return;

      // 1. Get position of clicked image
      const thumbRect = img.getBoundingClientRect();

      lastClickedThumbnail = img;
      toggleOverview();

      overviewContainer.innerHTML = `
            <img class="poster big" src="/posters/${movie.poster}" alt="" />
            <div class="info">
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
        e.stopPropagation(); // ✅ Prevent click from bubbling to parent
      });

      requestAnimationFrame(() => {
        const bigImg = overviewContainer.querySelector(".poster.big");
        const bigRect = bigImg.getBoundingClientRect();

        // 4. Clone the small image
        const clone = img.cloneNode(true);
        Object.assign(clone.style, {
          position: "fixed",
          top: `${thumbRect.top}px`,
          left: `${thumbRect.left}px`,
          width: `${thumbRect.width}px`,
          height: `${thumbRect.height}px`,
          margin: 0,
          zIndex: 9999,
          transition: "all 0.3s ease",
          pointerEvents: "none",
        });
        document.body.appendChild(clone);

        // 5. Force reflow, then animate
        clone.getBoundingClientRect(); // force reflow

        requestAnimationFrame(() => {
          Object.assign(clone.style, {
            top: `${bigRect.top}px`,
            left: `${bigRect.left}px`,
            width: `${bigRect.width}px`,
            height: `${bigRect.height}px`,
          });
        });

        // 6. After animation ends, reveal real big image
        clone.addEventListener(
          "transitionend",
          () => {
            bigImg.style.visibility = "visible";
            clone.remove();
            transitioning = false;
            overview.classList.remove("noscroll");
          },
          { once: true }
        );

        overview.classList.add("noscroll");

        img.style.visibility = "hidden";
        bigImg.style.visibility = "hidden";
        transitioning = true;
      });
    });

    list.appendChild(li);
  });
}

overview.addEventListener("click", () => toggleOverview());

function toggleOverview() {
  if (transitioning) return;
  overviewOpened = !overviewOpened;

  if (overviewOpened) {
    const scrollBarWidth = getScrollbarWidth();
    // document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    document.body.classList.add("noscroll");
    overview.classList.remove("hidden");
  } else {
    const bigImg = overview.querySelector(".poster.big");

    // const scrollOffset = overview.scro;

    // console.log(scrollOffset);

    if (bigImg && lastClickedThumbnail) {
      const fromRect = bigImg.getBoundingClientRect();
      const toRect = lastClickedThumbnail.getBoundingClientRect();

      const clone = bigImg.cloneNode(true);
      Object.assign(clone.style, {
        position: "fixed",
        top: `${fromRect.top}px`,
        left: `${fromRect.left}px`,
        width: `${fromRect.width}px`,
        height: `${fromRect.height}px`,
        margin: 0,
        zIndex: 9999,
        transition: "all 0.3s ease",
        pointerEvents: "none",
      });

      document.body.appendChild(clone);
      overview.classList.add("hidden"); // hide the overlay immediately

      // Wait one frame before animating
      requestAnimationFrame(() => {
        Object.assign(clone.style, {
          top: `${toRect.top}px`,
          left: `${toRect.left}px`,
          width: `${toRect.width}px`,
          height: `${toRect.height}px`,
        });
      });

      clone.addEventListener(
        "transitionend",
        () => {
          clone.remove();
          transitioning = false;
          lastClickedThumbnail.style.visibility = "visible";
          overview.scrollTop = 0;
          document.body.classList.remove("noscroll");
          document.body.style.paddingRight = "";
        },
        { once: true }
      );
    } else {
      overview.classList.add("hidden");
    }

    transitioning = true;
    bigImg.style.visibility = "hidden";

    overview.classList.add("hidden");
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
