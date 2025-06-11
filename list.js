async function fillMovieList() {
  const response = await fetch("titles.json");
  const movies = await response.json();

  const list = document.querySelector(".list");

  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <img class="poster" src="${movie.poster}" alt="" />
        <div class="info">
          <h2 class="title">${index + 1}. ${movie.title}</h2>
          <div class="details">
            <h3 class="date"><span class="section">Date: </span>${formatDate(
              movie.date
            )}</h3>
            <h3 class="duration"><span class="section">Duration: </span>${formatDuration(
              movie.duration
            )}</h3>
            <p class="description"><span class="section">Description: </span>${
              movie.description
            }</p>
          </div>
        </div>
      `;
    list.appendChild(li);
  });
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
