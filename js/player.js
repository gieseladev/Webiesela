function playerHandlePlayerInformation(player) {
	"use strict";
	var footer = document.getElementById("player");
	var song_title = document.getElementById("song_title");
	var song_artist = document.getElementById("song_artist");
	var cover_image = document.getElementById("cover_image");
	
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		footer.style.display = "";
		
		var entry = player.entry;
		transitionBackground(entry.thumbnail ? entry.thumbnail : default_background);
		
		if (entry.thumbnail_brightness && entry.thumbnail_brightness >= 127.5) {
			console.log("[PICTURE FRAME - CONTRAST] Background pretty bright, switching to dark text");
			document.getElementById("song_information").classList.add("dark");
		} else {
			document.getElementById("song_information").classList.remove("dark");
		}
		
		pause_indicator.style.visibility = (player.state === 1) ? "hidden" : "visible";
		pause_indicator.className = "";
		
		switch (entry.type) {
			case "GieselaEntry": //fall-through
			case "SpotifyEntry": //fall-through
			case "RadioSongEntry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "";
				
				artist_element.innerHTML = entry.artist;
				title_element.innerHTML = entry.title;
				switchCover(entry.cover);
				break;
			case "RadioStationEntry":
				artist_element.style.display = "none";
				title_element.style.display = "";
				cover_element.style.display = "";
				
				title_element.innerHTML = entry.title;
				switchCover(entry.cover);
				break;
			case "TimestampEntry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "none";
				pause_indicator.className = "absolute";
				
				artist_element.innerHTML = "From " + entry.whole_title;
				title_element.innerHTML = entry.title;
				break;
			default:
				artist_element.style.display = "none";
				title_element.style.display = "";
				cover_element.style.display = "none";
				pause_indicator.className = "absolute";
				
				title_element.innerHTML = entry.title;
				break;
		}
	} else {
		footer.style.display = "none";
	}
}