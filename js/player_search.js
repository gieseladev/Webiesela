const searchDelay = 500;

let currentResults;
let searchTimeout;


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


function displayItems(items) {
  //TODO everything
  if (items.length < 1) {
    alert("This is the wip message for when there are no results. k?");
  }

  getContextMenu("#search-context-menu", "entry", searchEntryContextMenu);

  currentResults = items;

  let resultDisplay = document.getElementById("result_display");

  while (resultDisplay.firstChild) {
    resultDisplay.removeChild(resultDisplay.firstChild);
  }

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let entryElement = HTMLTemplate.get("entry");

    entryElement.getElementsByClassName("index")[0].innerHTML = i + 1;
    entryElement.getElementsByClassName("title")[0].innerHTML = item.title;
    entryElement.getElementsByClassName("artist")[0].innerHTML = item.artist;

    resultDisplay.appendChild(entryElement);
  }
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
}
