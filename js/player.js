var queue;

var current_progress = 0;
var song_duration = 0;
var user_sliding_progress_bar = false;
var ticker;

var progress_bar_slider;


function sendCommand(cmd) {
	"use strict";
	
	doSend(JSON.stringify({
		"token": token,
		"command": cmd
	}));
}

function slider(element) {
	"use strict";

	var el = element;
	var isSliding = false;
	var current_percentage = null;
	
	this.sliding = function(evt) {
		if (isSliding) {
			var percentage = Math.max(Math.min((evt.pageX - el.getBoundingClientRect().left) / el.offsetWidth, 1), 0);
			setProgress(percentage);
			current_percentage = percentage;
		}
	};
	
	this.slideStart = function(evt) {
		var percentage = Math.max(Math.min((evt.pageX - el.getBoundingClientRect().left) / el.offsetWidth, 1), 0);
		setProgress(percentage);
		current_percentage = percentage;
		
		isSliding = true;
		user_sliding_progress_bar = true;
		window.addEventListener("selectstart", function(event) {event.preventDefault();});
	};
	
	this.slideEnd = function(evt) {		
		isSliding = false;
		user_sliding_progress_bar = false;
		window.removeEventListener("selectstart", function(event) {event.preventDefault();});
		console.log(current_percentage);
	};
}

function playPauseClick() {
	"use strict";
	
	sendCommand("play_pause");
}

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

function setProgress(progress_ratio) {
	"use strict";
	
	var progress_bar = document.getElementById("progress_bar_filled");
	var player_progress_bar_progress = document.getElementById("player_progress_bar_progress");

	progress_bar.style.width = 100 * progress_ratio + "%";

	player_progress_bar_progress.innerHTML = formatSeconds(Math.min(progress_ratio * song_duration, song_duration));
}

function updateProgress() {
	"use strict";
	
	current_progress += 1;
	if (!user_sliding_progress_bar) {
		setProgress(current_progress / song_duration);
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
				
		if (player.state === 2) {
			play_pause.classList.add("paused");
			if (ticker) {
				clearInterval(ticker);
			}
		} else {
			play_pause.classList.remove("paused");
			ticker = setInterval(updateProgress, 1000);
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
	
	window.removeEventListener("mousemove", progress_bar_slider.sliding);
	window.removeEventListener("mouseup", progress_bar_slider.slideEnd);
	window.removeEventListener("selectstart", function(event) {event.preventDefault();});
}

function setup() {
	"use strict";
	
	var progress_bar = document.getElementById("progress_bar");
	progress_bar_slider = new slider(progress_bar);
	
	progress_bar.addEventListener("mousedown", progress_bar_slider.slideStart);
	window.addEventListener("mousemove", progress_bar_slider.sliding);
	window.addEventListener("mouseup", progress_bar_slider.slideEnd);
}