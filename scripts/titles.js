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
      // To keep all season episodes together
      // let episodes = [];
      // for (let i = 0; i < title.episodes.length; i++) {
      //   let ep = title.episodes[i];
      //   episodes.push({
      //     episodeIndex: i,
      //     name: ep.name,
      //     date: ep.date,
      //     duration: ep.duration,
      //   });
      // }
      // flattened.push({
      //   type: "episodeBlock",
      //   id: title.id,
      //   name: title.name,
      //   date: episodes[0].date,
      //   commonData: {
      //     description: title.description,
      //     colors: title.colors,
      //     links: title.links,
      //   },
      //   episodes: episodes,
      //   lastEpisodeIndex: 0,
      // });

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
        split: title.split,
      });
    }
  }

  // Step 2: Sort all entries by date
  flattened.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Step 3: Group consecutive episodes if from same season and not interrupted
  const grouped = [];
  let currentEpisodeBlock = null;

  let hashedEpisodeBlocks = [];

  for (const item of flattened) {
    if (item.type === "episode") {
      if (
        currentEpisodeBlock
        // && currentEpisodeBlock.lastEpisodeIndex + 1 === item.episodeIndex
      ) {
        if (currentEpisodeBlock.id === item.seasonId) {
          currentEpisodeBlock.episodes.push(item);
          currentEpisodeBlock.lastEpisodeIndex = item.episodeIndex;
        } else {
          // grouped.push(currentEpisodeBlock);

          let isHashed = false;

          hashedEpisodeBlocks.forEach((hashed) => {
            if (item.seasonId === hashed.id) {
              hashed.episodes.push(item);
              hashed.lastEpisodeIndex = item.episodeIndex;
              isHashed = true;
            }
          });

          if (!isHashed) {
            hashedEpisodeBlocks.push(currentEpisodeBlock);

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
        }
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
      if (currentEpisodeBlock != null && item.split) {
        if (item.split === currentEpisodeBlock.id) {
          currentEpisodeBlock = null;
        } else {
          let toRemove = null;

          hashedEpisodeBlocks.forEach((hashed) => {
            if (item.split === hashed.id) toRemove = hashed;
          });

          if (toRemove != null) {
            hashedEpisodeBlocks = hashedEpisodeBlocks.filter(
              (hashed) => hashed.id !== toRemove.id
            );
            console.log(hashedEpisodeBlocks);
          }
        }
      }
      grouped.push(item);
    }
  }

  return grouped;
}
