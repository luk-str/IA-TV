const reloadButton = document.getElementById("reloadButton");

const okButton = document.getElementById("okButton");
const welcomeContainer = document.getElementById("welcomeContainer");

const titleText = document.getElementById("titleText");
const sourceText = document.getElementById("sourceText");
const yearMetadata = document.getElementById("yearMetadata");
const descriptionMetadata = document.getElementById("descriptionMetadata");

// Search Options
let searchPagesRange = 100;
const resultsAmount = 10;

const collections = [
  "short_films",
  "feature_films",
  "prelinger",
  "classic_tv",
  "classic_tv_commercials",
  "movie_trailers",
  "FedFlix",
  "open_mind",
  "openmediaproject",
  "bliptv",
  "educationalfilms",
  "avgeeks",
  "vhsvault",
  "musicvideobin",
];

const randomCollectionName = () => {
  const randomCollection =
    collections[Math.floor(Math.random() * collections.length)];

  console.log("Collection: " + randomCollection);

  return randomCollection;
};

const randomPageNumber = () => {
  return Math.floor(Math.random() * searchPagesRange);
};

const getSearchUrl = () => {
  const searchUrl = `https://archive.org/advancedsearch.php?q=collection:(${randomCollectionName()})+AND+mediatype:(movies)&sort[]=__random+desc&sort[]=&sort[]=&rows=${resultsAmount}&page=${randomPageNumber()}&output=json`;

  return searchUrl;
};

// Player Options
const playerOptions = {
  controls: true,
  preload: "auto",
  aspectRatio: "16:9",
  language: "en",
  userActions: {
    hotkeys: true,
  },
};

okButton.onclick = () => {
  welcomeContainer.classList.add("hidden");
  loadVideo();
  document.querySelector("nav").classList.add("visible");
  document.querySelector("footer").classList.add("visible");
  document.querySelector("main").classList.add("visible");
};

// Define Player Window
const player = videojs(document.querySelector(".video-js"), playerOptions);

// Trigger Video Reload on Error
player.on("error", (err) => {
  console.log(err);
  loadVideo();
});

// Trigger Video Reload on Video End
player.on("ended", () => {
  loadVideo();
});

// Handle Button Clicks
reloadButton.onclick = () => {
  loadVideo();
};

// Load Video
async function loadVideo() {
  document.querySelector("main").classList.add("hidden");
  reloadButton.classList.add("hidden");
  document.querySelector(".loading__container").classList.add("visible");
  
  player.pause();
  const response = await fetch(getSearchUrl());
  const data = await response.json();
  const filmMetadata = data.response.docs[0];
  const filmId = filmMetadata.identifier;

  const fileList = await getFileList(filmId);
  const sourceList = await getSourceList(fileList, filmId);

  player.src(sourceList);
  document.querySelector(".loading__container").classList.remove("visible");
  document.querySelector("main").classList.remove("hidden");
  reloadButton.classList.remove("hidden");

  player
    .play()
    .then(fillMetaData(filmMetadata))
    .catch((err) => console.log(err));
}

function fillMetaData(film) {
  yearMetadata.innerHTML = "";
  descriptionMetadata.innerHTML = "";

  const title = film.title;
  const year = film.year;
  const description = film.description;
  const id = film.identifier;
  const sourceUrl = `https://archive.org/details/${id}`;

  titleText.textContent = title;
  sourceText.textContent = sourceUrl;
  sourceText.setAttribute("href", sourceUrl);

  if (year !== undefined) {
    yearMetadata.innerHTML = `<p class="metadata__header" id="yearHeader">year:</p>
    <span id="yearText" class="metadata__text">${year}</span>`;
  }
  if (description !== undefined) {
    descriptionMetadata.innerHTML = `<p class="metadata__header" id="descriptionHeader">description:</p>
    <span id="descriptionText" class="metadata__text">${description}</span>`;
  }
}

async function getFileList(filmId) {
  const response = await fetch(`https://archive.org/metadata/${filmId}/files`);
  const data = await response.json();
  const fileList = data.result;

  return fileList;
}

async function getSourceList(fileList, filmId) {
  let sourcesArray = [];

  fileList.forEach((file) => {
    if (file.format === "h.264" || file.format === "MPEG4") {
      sourcesArray.push({
        src: `https://archive.org/download/${filmId}/${file.name}`,
        type: "video/mp4",
      });
    } else if (file.format === "Ogg Video") {
      sourcesArray.push({
        src: `https://archive.org/download/${filmId}/${file.name}`,
        type: "video/ogg",
      });
    }
  });

  if (sourcesArray.length === 0) {
    loadVideo();
    console.log("No playable files found. Loading new video...");
  } else {
    return sourcesArray;
  }
}
