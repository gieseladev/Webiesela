const searchDelay = 500;

let currentResults;
let searchTimeout;


function searchEntryContextMenu() {

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


function searchQuery(query) {
  browser.search(query).then(displayItems);
}


function displayItems(items) {
  getContextMenu("#search-context-menu", "entry", searchEntryContextMenu);

  currentResults = items;

  let resultDisplay = document.getElementById("result_display");

  while (resultDisplay.firstChild) {
    resultDisplay.removeChild(resultDisplay.firstChild);
  }

  let entryPrefab = document.getElementById("entry_template").cloneNode(true);

  entryPrefab.removeAttribute("id");
  entryPrefab.removeAttribute("style");

  for (var i = 0; i < items.length; i++) {
    let item = items[i];
    let entryElement = entryPrefab.cloneNode(true);

    entryElement.getElementsByClassName("index")[0].innerHTML = i + 1;
    entryElement.getElementsByClassName("title")[0].innerHTML = item.title;
    entryElement.getElementsByClassName("artist")[0].innerHTML = item.artist;

    resultDisplay.appendChild(entryElement);
  }
}


function showFeatured() {
  browser.featured().then(displayItems);
}
