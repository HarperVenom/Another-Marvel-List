var overviewOpened = false;

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
      // Check if the extra content already exists to avoid duplicates
      // if (!li.querySelector(".extra-info")) {

      if (overviewOpened) return;
      overviewOpened = true;

      document.body.classList.add("noscroll");

      const overview = document.querySelector("#overview");
      overview.classList.remove("hidden");

      const overviewContainer = document.querySelector("#overview-container");
      overviewContainer.innerHTML = `
            <img class="poster" src="/posters/${movie.poster}" alt="" />
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
    });

    list.appendChild(li);
  });
}

// <div class="info">
//           <h2 class="title">${index + 1}. ${movie.title}</h2>
//           <div class="details">
//             <h3 class="date"><span class="section">Date: </span>${formatDate(
//               movie.date
//             )}</h3>
//             <h3 class="duration"><span class="section">Duration: </span>${formatDuration(
//               movie.duration
//             )}</h3>
//             <p class="description"><span class="section">Description: </span>${
//               movie.description
//             }</p>
//           </div>

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
