var default_background = "images/default_backgrouns.jpg";

function switchCover(new_cover_url) {
	"use strict";
	var flip_container = document.getElementById("cover_flip_container");
	var back_cover_element = document.getElementById("back_cover");
	var cover_element = document.getElementById("cover");
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
	var cover_element = document.getElementById("cover");
	var pause_indicator = document.getElementById("paused");
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		var entry = player.entry;
		transitionBackground(entry.thumbnail ? entry.thumbnail : default_background);
		pause_indicator.style.visibility = (player.state === 1) ? "hidden" : "visible";
		pause_indicator.className = "";
		switch (entry.type) {
			case "spotify_entry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "";
				artist_element.innerHTML = entry.artist;
				title_element.innerHTML = entry.name;
				switchCover(entry.cover_url);
				break;
			case "radio_entry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "";
				artist_element.innerHTML = entry.artist;
				title_element.innerHTML = entry.title;
				switchCover(entry.cover);
				break;
			case "radio_entry":
				artist_element.style.display = "none";
				title_element.style.display = "";
				cover_element.style.display = "";
				title_element.innerHTML = entry.name;
				switchCover(entry.cover);
				break;
			case "timestamp_entry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "none";
				pause_indicator.className = "absolute";
				artist_element.innerHTML = "From " + entry.title;
				title_element.innerHTML = entry.sub_title;
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
		pause_indicator.style.display = "none";
		title_element.innerHTML = "Nothing playing";
		transitionBackground(default_background);
	}
}