const apiKey = "AIzaSyBiX_qsY5BjHcb42_u9nfhR0du4ZkZMKdo";

let titleElements = [];
const storage = new TitlesStorage();

const postersPath = "posters/big";

const main = document.querySelector("main");
const titleListContainer = document.querySelector(".title-list-container");
const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");

const glowContainer = document.querySelector("#glow-container");

const linksContainer = overviewContainer.querySelector(".additional");
const episodesContainer = document.querySelector(".episodes");

let lastClickedThumbnail = null;

let currentClone;

async function fillMovieList() {
  const list = document.querySelector(".list");
  list.innerHTML = "";

  const titles = getAllTitlesReleaseOrder();

  console.log(titles);

  titles.forEach((title, index) => {
    const name = title.name;
    if (name == "") return;

    const li = document.createElement("li");
    li.innerHTML = `
     <div class="highlight hidden"></div>
     <div class="poster-wrapper">
      <img class="poster" 
          src = "${getPosterPath() + "/" + title.id + ".webp"}";
          loading="lazy" 
          alt=""
          onerror="
          this.onerror = null;
          this.src = '${postersPath}/${title.id + ".webp"}';
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

    const img = li.querySelector(".poster");
    img.addEventListener("click", () => {
      onPosterClick(img, li);
    });

    list.appendChild(li);
    li.titleData = title;
    titleElements.push(li);
  });

  fillYears();

  updateTitles();
  restoreScroll();

  document.body.classList.remove("hidden");
}

function getPosterPath() {
  const width = window.innerWidth;

  // return "new-posters";

  // if (width < 600) return "posters-100-150";
  if (width < 900) return "posters/small";
  return "posters/big";
}

let currentPostersPath = "";

function updatePostersOnResize() {
  const newPostersPath = getPosterPath();
  if (newPostersPath === currentPostersPath) return;

  currentPostersPath = newPostersPath;

  titleElements.forEach((li) => {
    const title = li.titleData; // store the movie on each <li> when created
    const img = li.querySelector(".poster");

    // Update src manually instead of setting innerHTML again
    img.src = `${newPostersPath}/${title.id + ".webp"}`;
    img.onerror = function () {
      this.onerror = null;
      this.src = `fallback-folder/${title.id + ".webp"}`;
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
  titleElements.forEach((titleElement) => {
    const date =
      titleElement.titleData.type === "title"
        ? titleElement.titleData.date
        : titleElement.titleData.episodes[0].date;

    const currentYear = getYear(date);
    if (currentYear > lastYear) {
      lastYear = currentYear;

      const yearLabel = document.createElement("div");
      yearLabel.textContent = currentYear;
      yearLabel.classList.add("year-label");

      titleElement.appendChild(yearLabel);
    }
  });
}

async function loadVideos(links) {
  const titles = await Promise.all(
    links.map(async (link) => {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${link}&key=${apiKey}`
      );
      const data = await response.json();
      const snippet = data.items[0]?.snippet;

      const thumbnails = snippet?.thumbnails ?? {};
      const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        null;

      return {
        link: link,
        title: snippet?.title ?? "Unknown Title",
        thumbnailUrl: thumbnailUrl,
      };
    })
  );

  return titles;
}

function makeYoutubeBlock(video) {
  return `<div class="video-container content">
            
            <a class="screen" target="_blank" href="https://www.youtube.com/watch?v=${
              video.link
            }">
              <img src="${video.thumbnailUrl}"/>
              ${youtubeSvg()}
            </a>
            <h3>${video.title}</h3>
          </div>`;
}

async function loadAndRenderLinks(links) {
  try {
    const videos = await loadVideos(links);

    videos.forEach((video) => {
      const html = makeYoutubeBlock(video);
      linksContainer.insertAdjacentHTML("beforeend", html);

      const insertedElement = linksContainer.querySelector(
        ".video-container:last-child"
      );
      insertedElement.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    });
  } catch (error) {
    console.error("Failed to load videos:", error);
  }
}

function updateLinks(links, isFirstBlock) {
  if (links !== undefined && isFirstBlock) {
    linksContainer.classList.remove("inactive");
    linksContainer.innerHTML = "";
    loadAndRenderLinks(links);
    return true;
  } else {
    linksContainer.classList.add("inactive");
    return false;
  }
}

function makeEpisodeBlock(episode, color) {
  return `
    <div class="episode" style="background-color: ${color};">
      <div class="info">
        <h4 class="name"> <span>${episode.episodeIndex + 1 + "."}</span> ${
    episode.name
  }</h4>
        <div class="details">
          <span class="date">${formatDate(episode.date)}</span>
          <span class="dot"></span>
          <span class="duration">${formatDuration(episode.duration)}</span>
        </div>
      </div>
      <button class="check">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            width="256"
            height="256"
            viewBox="0 0 256 256"
            xml:space="preserve"
          >
            <g
              style="
                stroke: none;
                stroke-width: 0;
                stroke-dasharray: none;
                stroke-linecap: butt;
                stroke-linejoin: miter;
                stroke-miterlimit: 10;
                fill: none;
                fill-rule: nonzero;
                opacity: 1;
              "
              transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
            >
              <path
                d="M 32 77 c -1.536 0 -3.071 -0.586 -4.243 -1.758 l -26 -26 c -2.343 -2.343 -2.343 -6.142 0 -8.485 c 2.343 -2.343 6.143 -2.343 8.485 0 L 32 62.515 l 47.758 -47.757 c 2.342 -2.343 6.143 -2.343 8.484 0 c 2.344 2.343 2.344 6.142 0 8.485 l -52 52 C 35.071 76.414 33.536 77 32 77 z"
                style="
                  stroke: none;
                  stroke-width: 1;
                  stroke-dasharray: none;
                  stroke-linecap: butt;
                  stroke-linejoin: miter;
                  stroke-miterlimit: 10;
                  fill-rule: nonzero;
                  opacity: 1;
                "
                transform=" matrix(1 0 0 1 0 0) "
                stroke-linecap="round"
              />
            </g>
          </svg>
      </button>
    </div>
  `;
}

function updateEpisodes(titleElement, colors) {
  const title = titleElement.titleData;
  const episodes = title.episodes;

  episodesContainer.innerHTML = "";

  if (!episodes) {
    episodesContainer.classList.add("inactive");
    return;
  }

  episodesContainer.classList.remove("inactive");

  const [color1, color2] = colors.split(" ");

  const color = adjustColorHSV(color1, 10, -5);

  episodes.forEach((episode) => {
    const html = makeEpisodeBlock(episode, color);
    episodesContainer.insertAdjacentHTML("beforeend", html);
  });
}

function getShadow(colors) {
  const [color1, color2] = colors.split(" ");
  const color = adjustColorHSV(adjustColor(color1), 10, -5);
  const windowWidth = window.innerWidth;
  if (windowWidth < 700) return `0 -15px 30px ${color}`;
  return `-15px 15px 30px ${color}`;
}
