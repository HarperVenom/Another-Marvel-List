let titles = [];
let titlesLoaded = false;
let allTags = [];

loadAllTitles();

async function loadAllTitles() {
  const response = await fetch("titles.json");
  titles = await response.json();
  titlesLoaded = true;

  allTags = [
    ...new Set(
      titles.flatMap((item) => item.tags).filter((tag) => tag !== undefined)
    ),
  ];

  setFilterButtons();

  fillMovieList();
}

let currentActiveTitles = null;

function getAllTitlesReleaseOrder() {
  if (!titlesLoaded) return null;

  const flattened = [];

  const filters = getTagsFromURL();

  // Step 1: Flatten all entries
  for (const title of titles) {
    if (!(title.tags && title.tags.some((tag) => filters.includes(tag))))
      continue;
    if (title.episodes) {
      let completeSeasons = true;

      if (completeSeasons) {
        // To keep all season episodes together
        let episodes = [];
        for (let i = 0; i < title.episodes.length; i++) {
          let ep = title.episodes[i];
          episodes.push({
            seasonId: title.id,
            episodeIndex: i,
            name: ep.name,
            date: ep.date,
            duration: ep.duration,
          });
        }
        flattened.push({
          type: "episodeBlock",
          id: title.id,
          name: title.name,
          date: episodes[episodes.length - 1].date,
          commonData: {
            description: title.description,
            colors: title.colors,
            links: title.links,
          },
          episodes: episodes,
          lastEpisodeIndex: 0,
        });
      } else {
        for (let i = 0; i < title.episodes.length; i++) {
          const ep = title.episodes[i];
          flattened.push({
            type: "episode",
            seasonId: title.id,
            seasonName: title.name,
            commonData: {
              description: title.description,
              colors: title.colors,
              links: title.links,
            },
            episodeIndex: i,
            name: ep.name,
            date: ep.date,
            duration: ep.duration,
          });
        }
      }
    } else {
      flattened.push({
        type: "title",
        id: title.id,
        name: title.name,
        date: title.date,
        duration: title.duration,
        description: title.description,
        colors: title.colors,
        links: title.links,
      });
    }
  }

  totalDuration = 0;
  for (const item of flattened) {
    if (item.type === "episodeBlock") {
      totalDuration += item.episodes.reduce(
        (sum, ep) => sum + (ep.duration || 0),
        0
      );
    } else {
      totalDuration += item.duration || 0;
    }
  }

  // Step 2: Sort all entries by date
  flattened.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Step 3: Group consecutive episodes if from same season and not interrupted
  const grouped = [];
  let currentEpisodeBlock = null;

  for (const item of flattened) {
    if (item.type === "episode") {
      if (
        currentEpisodeBlock &&
        currentEpisodeBlock.id === item.seasonId &&
        currentEpisodeBlock.lastEpisodeIndex + 1 === item.episodeIndex
      ) {
        currentEpisodeBlock.episodes.push(item);
        currentEpisodeBlock.lastEpisodeIndex = item.episodeIndex;
      } else {
        // Start a new episode block
        currentEpisodeBlock = {
          type: "episodeBlock",
          id: item.seasonId,
          name: item.seasonName,
          commonData: item.commonData,
          episodes: [item],
          lastEpisodeIndex: item.episodeIndex,
        };
        grouped.push(currentEpisodeBlock);
      }
    } else {
      // Push any current block before standalone item
      currentEpisodeBlock = null;
      grouped.push(item);
    }
  }

  currentActiveTitles = grouped;
  return grouped;
}

function setFilterButtons() {
  const filtersSection = document.querySelector("#filters");
  filtersSection.innerHTML = "";

  const activeTags = getTagsFromURL();

  allTags.forEach((tag) => {
    if (!tag) return;

    const filter = document.createElement("div");
    filter.className = "filter" + (!activeTags.includes(tag) ? " off" : "");
    filter.textContent = tag;
    filtersSection.appendChild(filter);

    filter.addEventListener("click", () => {
      filter.classList.toggle("off");

      let activeFilters = Array.from(
        filtersSection.querySelectorAll(".filter:not(.off)")
      ).map((el) => el.textContent);

      if (activeFilters.length === 0) {
        filtersSection
          .querySelectorAll(".filter")
          .forEach((el) => el.classList.remove("off"));
        activeFilters = [...allTags]; // All active
      }

      updateURL(activeFilters);
    });
  });
}

function getTagsFromURL() {
  const params = new URLSearchParams(window.location.search);
  const tags = params.get("tags");

  return tags ? tags.split(",") : [...allTags]; // blank means "all active"
}

function updateURL(activeTags) {
  const params = new URLSearchParams();

  const allActive = activeTags.length === allTags.length;

  if (!allActive) {
    params.set("tags", activeTags.join(","));
  }

  const newUrl =
    window.location.pathname +
    (params.toString() ? "?" + params.toString() : "");

  history.replaceState(null, "", newUrl);

  fillMovieList();
}

let totalDuration = 0;
let progress = 0;

function updateListInfo() {
  menu.querySelector("#duration").innerHTML = formatDuration(totalDuration);

  const completedDuration = getCompletedDuration();
  const progressPercent =
    totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0;

  menu.querySelector("#progress").innerHTML = progressPercent.toFixed(1) + "%";
}

function getCompletedDuration() {
  let completedDuration = 0;

  for (const item of currentActiveTitles) {
    if (item.type === "episodeBlock") {
      completedDuration += item.episodes.reduce(
        (sum, ep) =>
          storage.hasCompletedEpisode(ep) ? sum + (ep.duration || 0) : sum,
        0
      );
    } else if (item.type === "episode") {
      if (storage.hasCompletedEpisode(item))
        completedDuration += item.duration || 0;
    } else if (item.type === "title") {
      if (storage.hasCompletedTitle(item.id))
        completedDuration += item.duration || 0;
    }
  }

  return completedDuration;
}
