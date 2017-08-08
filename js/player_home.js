var home_sub_page = "queue";

function displayEntries(parentElement, entries) {
  "use strict";

  while (parentElement.firstChild) {
    if (parentElement.firstChild.id !== "entry_template") {
      parentElement.removeChild(parentElement.firstChild);
    }
  }

  var entry_template = document.getElementById("entry_template").cloneNode(true);

  entry_template.removeAttribute("id");
  entry_template.removeAttribute("style");

  var index = 1;

  for (var entry of entries) {
    var entry_element = entry_template.cloneNode(true);

    entry_element.getElementsByClassName("index")[0].innerHTML = index;
    entry_element.getElementsByClassName("title")[0].innerHTML = entry.title;

    if (entry.album && entry.artist) {
      entry_element.getElementsByClassName("album")[0].innerHTML = entry.album;
      entry_element.getElementsByClassName("artist")[0].innerHTML = entry.artist;
    } else {
      entry_element.getElementsByClassName("name")[0].removeChild(entry_element.getElementsByClassName("origin")[0]);
    }

    entry_element.getElementsByClassName("duration")[0].innerHTML = formatSeconds(entry.duration);

    parentElement.appendChild(entry_element);
    index++;
  }
}

function showLyrics(answer) {
  "use strict";

  var lyrics_display = document.getElementById("lyrics_display");

  var lyrics = answer["lyrics"];
  if (lyrics) {
      lyrics_display.innerHTML = lyrics["lyrics"];
  } else {
    lyrics_display.innerHTML = "Couldn't find any lyrics!";
  }
}

function showHistory() {
  "use strict";

  if (queue) {
    var history_display = document.getElementById("history_display");

    displayEntries(history_display, queue.history);
  }
}

function showQueue() {
  "use strict";

  if (queue) {
    console.log("Showing queue: ", queue);
    var queue_display = document.getElementById("queue_display");

    displayEntries(queue_display, queue.entries)
  }
}

function handleQueue() {
  "use strict";

  if (home_sub_page === "queue") {
    showQueue();
  } else if (home_sub_page === "history") {
    showHistory();
  }
}

function switchHomePage(new_page) {
  "use strict";

  var queue_display = document.getElementById("queue_display");
  var history_display = document.getElementById("history_display");
  var lyrics_display = document.getElementById("lyrics_display");

  var queue_selector = document.getElementById("queue_selector");
  var history_selector = document.getElementById("history_selector");
  var lyrics_selector = document.getElementById("lyrics_selector");

  queue_display.style.display = "none";
  history_display.style.display = "none";
  lyrics_display.style.display = "none";

  queue_selector.classList.remove("selected");
  history_selector.classList.remove("selected");
  lyrics_selector.classList.remove("selected");


  switch (new_page) {
    case "queue":
      queue_display.style.display = "";
      queue_selector.classList.add("selected");
      home_sub_page = "queue"

      showQueue();

      break;
    case "history":
      history_display.style.display = "";
      history_selector.classList.add("selected");
      home_sub_page = "history"

      showHistory();

      break;
    case "lyrics":
      lyrics_selector.style.display = "";
      lyrics_selector.classList.add("selected");
      home_sub_page = "lyrics"

      waitForAnswer({"request": "send_lyrics"}, showLyrics());

      break;
  }
}
