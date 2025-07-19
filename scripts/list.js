const apiKey = "AIzaSyBiX_qsY5BjHcb42_u9nfhR0du4ZkZMKdo";

let titleElements = [];
const storage = new TitlesStorage();

const postersPath = "posters/big";

const main = document.querySelector("main");
const titleListContainer = document.querySelector(".title-list-container");
const overview = document.querySelector("#overview");
const overviewContainer = document.querySelector("#overview-container");
const posterContainer = document.querySelector("#poster-container");

const glowContainer = document.querySelector("#glow-container");

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

async function loadAndRenderVideos(container, links) {
  try {
    const videos = await loadVideos(links);

    videos.forEach((video) => {
      const html = makeYoutubeBlock(video);
      container.insertAdjacentHTML("beforeend", html);

      const insertedElement = container.querySelector(
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
