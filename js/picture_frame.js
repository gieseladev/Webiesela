var default_background = "images/default_background.jpg";

function switchCover(new_cover_url) {
	"use strict";
	var flip_container = document.getElementById("cover_flip_container");
	var back_cover_element = document.getElementById("back_cover");
	var cover_element = document.getElementById("cover");
	if (new_cover_url === cover_element.src) {
		console.log("[PICTURE FRAME] Cover image is the same as before, not transitioning!");
		return;
	}
	back_cover_element.src = cover_element.src;
	cover_element.src = new_cover_url;
	flip_container.classList.add("flip");
	var callfunction = function() {
		flip_container.classList.remove("flip");
	};
	flip_container.addEventListener("webkitAnimationEnd", callfunction, false);
	flip_container.addEventListener("animationend", callfunction, false);
	flip_container.addEventListener("oanimationend", callfunction, false);
}

function pictureFrameHandlePlayerInformation(player) {
	"use strict";
	var title_element = document.getElementById("title");
	var artist_element = document.getElementById("artist");
	var cover_element = document.getElementById("cover_disable_target");
	var pause_indicator = document.getElementById("paused");
	
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
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
		//display "nothing playing" or something
		artist_element.style.display = "none";
		title_element.style.display = "";
		cover_element.style.display = "none";
		pause_indicator.style.display = "";
		title_element.innerHTML = "Nothing playing";
		transitionBackground(default_background);
	}
}