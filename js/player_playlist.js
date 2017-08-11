var playlists;


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

function showPlaylist(playlist_id) {
  "use strict";

  var playlist = playlists.find(function(playlist) {
    return playlist.id === playlist_id
  });
  console.log("Showing playlist", playlist);
  document.getElementById("playlist_display").style.display = "none";

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
  document.getElementById("playlist_playtime").innerHTML = "wip";

  document.getElementById("focused_display").style.display = "";
}

function loadPlaylist(playlist_id) {
  "use strict";

  console.log("Loading playlist", playlist_id);
}

function displayPlaylists() {
  "use strict";

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

    playlist_element.getElementsByClassName("cover")[0].style.backgroundImage = "url('" + playlist.cover + "')";
    playlist_element.getElementsByClassName("title")[0].innerHTML = playlist.name;

    playlist_element.getElementsByClassName("author")[0].innerHTML = "by " + playlist.author.display_name;

    playlist_element.addEventListener("click", hoverClick(playlist.id));
    playlist_element.getElementsByClassName("play_button")[0].addEventListener("click", playClick(playlist.id));

    parentElement.appendChild(playlist_element);
  }
}

function receivePlaylist(answer) {
  "use strict";

  playlists = answer.playlists;
  displayPlaylists();
}
