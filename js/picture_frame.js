function pictureFrameHandlePlayerInformation(player) {
	"use strict";
	
	var title_element = document.getElementById("title");
	var artist_element = document.getElementById("artist");
	var cover_element = document.getElementById("cover");
	var pause_indicator = document.getElementById("paused");
	
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		var entry = player.entry;
		document.getElementById("thumbnail").src = entry.thumbnail ? entry.thumbnail : "";
		pause_indicator.style.visibility = (player.state === 1) ? "hidden" : "visible";
		pause_indicator.className = "";

		switch (entry.type) {
			case "spotify_entry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "";
				
				artist_element.innerHTML = entry.artist;
				title_element.innerHTML = entry.name;
				cover_element.src = entry.cover_url;
				break;
			case "radio_entry":
				artist_element.style.display = "";
				title_element.style.display = "";
				cover_element.style.display = "";
				
				artist_element.innerHTML = entry.artist;
				title_element.innerHTML = entry.title;
				cover_element.src = entry.cover;
				break;
			case "radio_entry":
				artist_element.style.display = "none";
				title_element.style.display = "";
				cover_element.style.display = "";
				
				title_element.innerHTML = entry.name;
				cover_element.src = entry.cover;
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
	}
	else {
		//display "nothing playing" or something
		artist_element.style.display = "none";
		title_element.style.display = "";
		cover_element.style.display = "none";
		pause_indicator.style.display = "none";

		title_element.innerHTML = "Nothing playing";
	}
}