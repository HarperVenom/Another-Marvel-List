let titles = [];
let titlesLoaded = false;

loadAllTitles();

async function loadAllTitles() {
  const response = await fetch("titles.json");
  titles = await response.json();
  titlesLoaded = true;

  fillMovieList();
}

function getAllTitlesReleaseOrder() {
  if (!titlesLoaded) return null;

  const flattened = [];

  // Step 1: Flatten all entries
  for (const title of titles) {
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

  return grouped;
}
