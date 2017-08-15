var playlists;
var playlistFocus;

var scrollWaiter;


function adjustInformationPosition() {
  "use strict";

  var scrollOffset = document.getElementById("main_container_flex").scrollTop;

  document.getElementById("playlist_information_float_left").style.marginTop = scrollOffset + "px";
}

function scrollWaiterFunc() {
  "use strict";

  clearTimeout(scrollWaiter);
  scrollWaiter = setTimeout(adjustInformationPosition, 200);
}

function playlistEntryContextMenuClick(entryIndex, action) {
  "use strict";

  if (["playlist_play"].indexOf(action) < 0) {
    console.log("[PLAYLIST] Don't recognise this action", action);
    return;
  }

  console.log("[PLAYLIST] action", action, "on entry", entryIndex);

  sendCommand(action, {
    "index": parseInt(entryIndex),
    "playlist_id": playlistFocus.id
  });
}

function showPlaylist(playlist_id) {
  "use strict";

  var playlist = playlists.find(function(playlist) {
    return playlist.id === playlist_id;
  });

  playlistFocus = playlist;

  console.log("Showing playlist", playlist);
  document.getElementById("playlist_display").style.display = "none";

  history.pushState({
    "id": "main-playlists",
    "focus": playlist_id
  }, "focused_playlist", "#playlists/" + playlist.id);

  displayEntries(document.getElementById("playlist_entries"), playlist.entries);

  document.getElementById("playlist_cover").onclick = function() {
    loadPlaylist(playlist_id);
  };

  document.getElementById("playlist_load_button").onclick = function() {
    loadPlaylist(playlist_id);
  };

  document.getElementById("focused_playlist_cover").style.backgroundImage = "url('" + playlist.cover + "')";
  document.getElementById("playlist_title").innerHTML = playlist.name;
  document.getElementById("playlist_author").innerHTML = "by " + playlist.author.display_name;
  document.getElementById("playlist_description").innerHTML = (playlist.description || "This playlist doesn't have a description").replace(/(\*\*|__)(.+?)\1/, "<b>$2</b>").replace(/(\*|_)(.+?)\1/, "<i>$2</i>").replace(/(`|_)(.+?)\1/, "<code>$2</code>");
  document.getElementById("playlist_entry_amount").innerHTML = playlist.entries.length + " songs";
  document.getElementById("playlist_playtime").innerHTML = playlist.human_dur;

  window.addEventListener("scroll", scrollWaiterFunc, true);

  document.getElementById("focused_display").style.display = "";

  getContextMenu("#playlist_entry-context-menu", "entry", playlistEntryContextMenuClick);
}

function loadPlaylist(playlist_id) {
  "use strict";

  console.log("Loading playlist", playlist_id);

  sendCommand("load_playlist", {
    "id": playlist_id
  });
}

function menuItemClick(playlistId, loadMode) {
  "use strict";

  console.log("[PLAYLIST] Loading playlist", playlistId, "with mode [" + loadMode + "]");

  sendCommand("load_playlist", {
    "id": playlistId,
    "mode": loadMode
  });
}

function displayPlaylists() {
  "use strict";

  document.getElementById("playlist_display").style.display = "";
  document.getElementById("focused_display").style.display = "none";

  var parentElement = document.getElementById("playlist_display");

  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }

  var playlist_template = document.getElementById("playlist_template").cloneNode(true);

  playlist_template.removeAttribute("id");
  playlist_template.removeAttribute("style");

  var hoverClick = function(playlistId) {
    return function(event) {
      if (!event.target.classList.contains("play_button")) {
        showPlaylist(playlistId);
      }
    };
  };

  var playClick = function(playlistId) {
    return function() {
      loadPlaylist(playlistId);
    };
  };

  for (var playlist of playlists) {
    var playlist_element = playlist_template.cloneNode(true);

    playlist_element.setAttribute("data-id", playlist.id);

    playlist_element.getElementsByClassName("cover")[0].style.backgroundImage = "url('" + playlist.cover + "')";
    playlist_element.getElementsByClassName("title")[0].innerHTML = playlist.name;

    playlist_element.getElementsByClassName("author")[0].innerHTML = "by " + playlist.author.display_name;

    playlist_element.addEventListener("click", hoverClick(playlist.id));
    playlist_element.getElementsByClassName("play_button")[0].addEventListener("click", playClick(playlist.id));

    parentElement.appendChild(playlist_element);
  }

  getContextMenu("#playlist-context-menu", "playlist", menuItemClick);
}

function receivePlaylist(answer) {
  "use strict";

  playlists = answer.playlists;

  displayPlaylists();
}
