const searchDelay = 500;

let currentResults;
let searchTimeout;

let resultDisplayTracks;
let resultDisplayPlaylists;
let resultSelectorTracks;
let resultSelectorPlaylists;

function searchEntryContextMenu() {
  console.log("context menu");
}

function searchInputOnChange(evt) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => onInput(evt.target.value), searchDelay);
}

function onInput(query) {
  if (query) {
    searchQuery(query);
  } else {
    showFeatured();
  }
}

function openSearcherDropDown() {
  document.addEventListener("click", closeSearcherDropDown);

  let searcherDM = document.getElementById("searcher_dropdown_menu");
  searcherDM.style.visibility = "visible";
  searcherDM.style.opacity = 1;
}

function closeSearcherDropDown(evt) {
  if (evt.target.id !== "searcher_icon") {
    document.removeEventListener("click", closeSearcherDropDown);
    document.getElementById("searcher_dropdown_menu").style.opacity = 0;
  }
}

function clickSearcher(searcher) {
  browser.switchSearcher(searcher.handler);
  localStorage.setItem("searcher", searcher.serviceName);

  showCurrentSearcher();
  onInput(document.getElementById("input_bar").value);
}

function clearResults() {
  let resultDisplayTracks = document.getElementById("result_display_tracks");
  let resultDisplayPlaylists = document.getElementById("result_display_playlists");

  while (resultDisplayTracks.firstChild) {
    resultDisplayTracks.removeChild(resultDisplayTracks.firstChild);
  }

  while (resultDisplayPlaylists.firstChild) {
    resultDisplayPlaylists.removeChild(resultDisplayPlaylists.firstChild);
  }
}

function hideSelectors() {
  resultSelectorTracks.classList.remove("selected");
  resultSelectorPlaylists.classList.remove("selected");

  resultDisplayTracks.classList.remove("active");
  resultDisplayPlaylists.classList.remove("active");
}

function showPlaylists() {
  hideSelectors();

  resultDisplayPlaylists.classList.add("active");
  resultSelectorPlaylists.classList.add("selected");
}

function showTracks() {
  hideSelectors();

  resultDisplayTracks.classList.add("active");
  resultSelectorTracks.classList.add("selected");
}

function showAppropriate() {
  if (resultDisplayTracks.firstChild) {
    resultSelectorTracks.classList.add("possible");
  } else {
    resultSelectorTracks.classList.remove("possible");
  }

  if (resultDisplayPlaylists.firstChild) {
    resultSelectorPlaylists.classList.add("possible");
  } else {
    resultSelectorPlaylists.classList.remove("possible");
  }

  const target = document.querySelector(".result_type_selector .possible");

  if (target) {
    target.onclick();
  } else {
    hideSelectors();
    alert("no results found bruh");
  }

}

function displayItems(items) {
  clearResults();

  resultDisplayTracks = document.getElementById("result_display_tracks");
  resultDisplayPlaylists = document.getElementById("result_display_playlists");

  resultSelectorTracks = document.getElementById("result_type_selector_tracks");
  resultSelectorPlaylists = document.getElementById("result_type_selector_playlists");

  getContextMenu("#search-context-menu", "entry", searchEntryContextMenu);
  getContextMenu("#search-context-menu", "playlist", searchEntryContextMenu);

  currentResults = items;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let element;

    switch (item.constructor.name) {
      case "Playlist":
        let element = HTMLTemplate.build("playlist", {
          ".title": item.title,
          ".author": item.artist,
          ".cover": element => element.setAttribute("style", "background-image: url(\"" + item.image + "\");")
        });

        element.classList.add(browser.searcherInformation.serviceName);

        resultDisplayPlaylists.appendChild(element);
        break;

      case "Entry":
        resultDisplayTracks.appendChild(HTMLTemplate.build("entry", {
          ".index": i + 1,
          ".title": item.title,
          ".artist": item.artist,
          ".album, .seperator, .duration": false,
        }));
        break;
    }
  }

  showAppropriate();
}

function showCurrentSearcher() {
  let searcherIcon = document.getElementById("searcher_icon");
  let currentSearcher = browser.searcherInformation;

  searcherIcon.style.backgroundImage = "url('" + currentSearcher.icon + "')";
}

function buildSearcherDropDown() {
  let elementHolder = document.getElementById("searcher_dropdown_menu");

  while (elementHolder.firstChild) {
    elementHolder.removeChild(elementHolder.firstChild);
  }

  for (let i = 0; i < browser.searchers.length; i++) {
    let searcher = browser.searchers[i];
    let searcherEl = HTMLTemplate.get("searcher");

    searcherEl.getElementsByClassName("icon")[0].style.backgroundImage = "url('" + searcher.icon + "')";
    searcherEl.getElementsByClassName("name")[0].innerHTML = searcher.serviceName;

    searcherEl.addEventListener("click", () => clickSearcher(searcher));

    elementHolder.appendChild(searcherEl);
  }
}

function searchQuery(query) {
  browser.search(query).then(displayItems);
}

function showFeatured() {
  browser.featured().then(displayItems);
}

function setupSearch() {
  let preferredSearcher = localStorage.getItem("searcher");

  if (preferredSearcher) {
    console.log("[Search] found searcher in localStorage, switching to it");
    browser.switchSearcher(preferredSearcher);
  }

  buildSearcherDropDown();
  showCurrentSearcher();

  showFeatured();
  document.getElementById("input_bar").value = "";
}
