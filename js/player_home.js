var home_sub_page = "queue";

var current_lyrics_title;


function queueEntryContextMenuClick(entryIndex, action) {
  "use strict";

  if (["promote", "remove"].indexOf(action) < 0) {
    console.log("[QUEUE] Don't recognise this action", action);
    return;
  }

  console.log("[QUEUE] action", action, "on entry", entryIndex);

  var msg;
  var failMsg;

  switch (action) {
    case "promote":
      msg = "Promoted entry to the top of the Queue";
      failMsg = "Couldn't promote entry";
      break;
    case "remove":
      failMsg = "Couldn't remove entry from Queue";
      break;
  }

  sendCommand(action, {
    "index": parseInt(entryIndex)
  }, msg, failMsg);
}

function historyEntryContextMenuClick(entryIndex, action) {
  "use strict";

  if (["replay"].indexOf(action) < 0) {
    console.log("[HISTORY] Don't recognise this action", action);
    return;
  }

  console.log("[HISTORY] action", action, "on entry", entryIndex);

  sendCommand(action, {
    "index": parseInt(entryIndex)
  }, "Replaying " + queue.history[entryIndex].title.bold(), "Can't replay " + queue.history[entryIndex].title.bold());
}

function onEntryMove(evt, origEvt) {
  "use strict";

  evt.dragged.style.backgroundColor = "rgba(0, 0, 0, .3)";

  setTimeout(function() {
    updateIndices(document.getElementById("queue_display"));
  }, 0);
}

function onEntryMoved(evt) {
  "use strict";

  var from = evt.oldIndex;
  var to = evt.newIndex;

  evt.item.style.backgroundColor = "";

  sendCommand("move", {
    "from": from,
    "to": to
  }, null, "Couldn't move entry");
  console.log("[QUEUE] moved entry from", from, "to", to);
  updateIndices(document.getElementById("queue_display"));
}

function updateIndices(parentElement) {
  var index = 1;
  for (var child = parentElement.firstChild; child !== null; child = child.nextSibling) {
    if (child.style.display !== "none") {
      child.getElementsByClassName("index")[0].innerHTML = index;
      index++;
    }
  }
}

function displayEntries(parentElement, entries) {
  "use strict";

  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }

  var entry_template = document.getElementById("entry_template").cloneNode(true);

  entry_template.removeAttribute("id");
  entry_template.removeAttribute("style");

  var index = 1;

  for (var entry of entries) {
    var entry_element = entry_template.cloneNode(true);

    entry_element.getElementsByClassName("index")[0].innerHTML = index;
    entry_element.getElementsByClassName("title")[0].innerHTML = entry.title;

    entry_element.setAttribute("data-id", index - 1);

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

  current_lyrics_title = current_entry.title;

  var lyrics_display_parent = document.getElementById("lyrics_display");
  var lyrics_display = lyrics_display_parent.getElementsByClassName("text")[0];
  var source_display = lyrics_display_parent.getElementsByClassName("source")[0];

  var lyrics = answer.lyrics;

  document.getElementById("lyrics_display_spinner").style.display = "none";

  if (lyrics) {
    var parsed_lyrics = lyrics.lyrics.replace(/^\[(.+)\]$/gm, "<h2>$1<\/h2>");

    lyrics_display.innerHTML = parsed_lyrics;
    lyrics_display.classList.remove("info");

    source_display.innerHTML = lyrics.source;
    source_display.href = lyrics.url;
  } else {
    lyrics_display.innerHTML = "Couldn't find any lyrics!";
    lyrics_display.classList.add("info");

    source_display.innerHTML = "";
  }
}

function showHistory() {
  "use strict";

  if (queue) {
    var history_display = document.getElementById("history_display");

    displayEntries(history_display, queue.history);
    getContextMenu("#history-context-menu", "entry", historyEntryContextMenuClick);
  }
}

function showQueue() {
  "use strict";

  if (queue) {
    console.log("Showing queue: ", queue);
    var queue_display = document.getElementById("queue_display");

    displayEntries(queue_display, queue.entries);

    getContextMenu("#queue-context-menu", "entry", queueEntryContextMenuClick);

    Sortable.create(queue_display, {
      "onMove": onEntryMove,
      "onEnd": onEntryMoved
    });
  } else {
    document.getElementById("queue_display").innerHTML = "";
  }
}

function handleQueue() {
  "use strict";

  if (home_sub_page === "queue") {
    showQueue();
  } else if (home_sub_page === "history") {
    showHistory();
  } else if (home_sub_page === "lyrics") {
    if (current_entry.title !== current_lyrics_title) {

      document.querySelector("#lyrics_display .text").innerHTML = "";
      document.querySelector("#lyrics_display .source").innerHTML = "";
      document.getElementById("lyrics_display_spinner").style.display = "";

      waitForAnswer({
        "request": "send_lyrics"
      }, showLyrics);
    } else {
      console.log("[LYRICS] already showing these lyrics", current_lyrics_title);
    }
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
      lyrics_display.style.display = "";
      lyrics_selector.classList.add("selected");
      home_sub_page = "lyrics"

      document.querySelector("#lyrics_display .text").innerHTML = "";
      document.querySelector("#lyrics_display .source").innerHTML = "";
      document.getElementById("lyrics_display_spinner").style.display = "";

      waitForAnswer({
        "request": "send_lyrics"
      }, showLyrics);

      break;
  }
}
