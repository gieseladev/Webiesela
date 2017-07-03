function pictureFrameHandlePlayerInformation(player) {
	"use strict";
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		var entry = player.entry;
		document.getElementById("thumbnail").src = entry.thumbnail;
		document.getElementById("paused").style.visibility = (player.state === 1) ? "hidden" : "visible";

		switch (entry.type) {
			case "spotify_entry":
				document.getElementById("artist").innerHTML = entry.artist;
				document.getElementById("title").innerHTML = entry.name;
				document.getElementById("cover").src = entry.cover_url;
				break;
		}
	}
	else {
		//display "nothing playing" or something
	}
}