var queue;

var current_progress = 0;
var song_duration = 0;
var run_tick = true;
var ticker;


function showQueue() {
	"use strict";
	
	var queue_display = document.getElementById("queue_display");
	
	while (queue_display.firstChild) {
		if (queue_display.firstChild.id != "entry_template") {
    		queue_display.removeChild(queue_display.firstChild);
		}
	}
	
	console.log(queue);
	if (queue) {
		var entry_template = document.getElementById("entry_template").cloneNode(true);

		entry_template.removeAttribute("id");
		entry_template.removeAttribute("style");

		var index = 1;

		for (var entry of queue.entries) {
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

			queue_display.appendChild(entry_element);
			index++;
		}
	}
}

function setVolume(newVal) {
	"use strict";
	
	var volume_slider = document.getElementById("volume_bar_bar_full");
	var volume_icon = document.getElementById("speaker_symbol");
	
	volume_slider.style.width = 100 * newVal + "%";
	
	var icon = "icon-" + Math.ceil(3 * newVal);
	volume_icon.className = icon;
}

function updateProgress() {
	"use strict";
	
	if (run_tick) {
		current_progress += 1;
		
		var progress_bar = document.getElementById("progress_bar_filled");
		var player_progress_bar_progress = document.getElementById("player_progress_bar_progress");

		var progress_ratio = current_progress / song_duration;
		progress_bar.style.width = 100 * progress_ratio + "%";
		
		player_progress_bar_progress.innerHTML = formatSeconds(Math.min(current_progress, song_duration));
	}
}

function playerHandlePlayerInformation(player) {
	"use strict";
	
	var footer = document.getElementById("player");
	var song_title = document.getElementById("song_title");
	var song_artist = document.getElementById("song_artist");
	var cover_image = document.getElementById("cover_image");
	var player_progress_bar_duration = document.getElementById("player_progress_bar_duration");
	
	var play_pause = document.getElementById("button_play_pause");
	
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		footer.style.display = "";
		
		var entry = player.entry;
		
		current_progress = entry.progress;
		song_duration = entry.duration;
		
		if (ticker) {
			clearInterval(ticker);
		}
		
		ticker = setInterval(updateProgress, 1000);
		
		if (player.state === 2) {
			play_pause.classList.add("paused");
			run_tick = false;
		} else {
			play_pause.classList.remove("paused");
			run_tick = true;
		}
		
		setVolume(player.volume);
		
		song_title.innerHTML = entry.title;
		song_artist.innerHTML = entry.artist || "";
		cover_image.style.backgroundImage = "url(\"" + (entry.cover || entry.thumbnail) + "\")";
		player_progress_bar_duration.innerHTML = formatSeconds(song_duration);
		
		queue = player.queue;
		showQueue();
		
	} else {
		run_tick = false;
		
		if (ticker) {
			clearInterval(ticker);
		}
		
		footer.style.display = "none";
	}
}

function setUser() {
	"use strict";
	
	console.log("[PLAYER] Setting user");
	
	var user_name = document.getElementById("user_name");
	var user_avatar = document.getElementById("user_avatar");
	
	user_name.innerHTML = user.display_name;
	user_avatar.style.backgroundImage = "url(\"" + user.avatar_url + "\")";
}

function breakDown() {
	"use strict";
	
	if (ticker) {
		clearInterval(ticker);
	}
	
	run_tick = false;
}