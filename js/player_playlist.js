var playlists;


function showPlaylist(playlist_id) {
  "use strict";

  console.log("Showing playlist", playlist_id);
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

    playlist_element.getElementsByClassName("hover_target")[0].addEventListener("click", hoverClick(playlist.id));
    playlist_element.getElementsByClassName("play_button")[0].addEventListener("click", playClick(playlist.id));

    parentElement.appendChild(playlist_element);
  }
}

function receivePlaylist(answer) {
	"use strict";
	
	playlists = answer.playlists;
	displayPlaylists();
}