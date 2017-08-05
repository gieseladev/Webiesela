var queue;

var current_progress = 0;
var song_duration = 0;

var show_time_left = false;

var user_sliding_progress_bar = false;
var ticker;

var progress_bar_slider;
var volume_slider;


function preventSelection(event) {
	"use strict";
	
	event.preventDefault();
}

function sendCommand(cmd, data) {
	"use strict";
	
	console.log("Sending command \"", cmd, "\" with data: ", data);
	
	doSend(JSON.stringify({
		"token": token,
		"command": cmd,
		"command_data": data
	}));
}

function finishVolumeSlide(value) {
	"use strict";
	
	if (0 <= value <= 1) {
		sendCommand("volume", {"value": value});
	}
}

function startProgressSlide() { 
	"use strict";
	
	user_sliding_progress_bar = true;
}

function finishProgressSlide(value) {
	"use strict";
	
	if (0 <= value <= song_duration) {
		user_sliding_progress_bar = false;
		current_progress = value * song_duration
		sendCommand("seek", {"value": current_progress});
	}
}

function skip() {
	"use strict";
	
	sendCommand("skip");
}

function revert() {
	"use strict";
	
	sendCommand("revert");
}

function playPauseClick() {
	"use strict";
	
	sendCommand("play_pause");
}

function switchDurationDisplay() {
	"use strict";
	
	show_time_left = !show_time_left;
	setProgress(current_progress / song_duration);
}

function slider(element, on_slide, on_start, on_finish) {
	"use strict";

	this.el = element;
	this.isSliding = false;
	this.current_percentage = null;
	
	this.on_slide = on_slide;
	this.on_start = on_start;
	this.on_finish = on_finish;
	
	
	this.sliding = function(evt) {
		if (this.isSliding) {
			var percentage = Math.max(Math.min((evt.pageX - this.el.getBoundingClientRect().left) / this.el.offsetWidth, 1), 0);
			
			this.on_slide(percentage);
			this.current_percentage = percentage;
		}
	};
	
	this.slideStart = function(evt) {
		var percentage = Math.max(Math.min((evt.pageX - this.el.getBoundingClientRect().left) / this.el.offsetWidth, 1), 0);
		this.on_slide(percentage);
		this.current_percentage = percentage;
		
		this.isSliding = true;
		window.addEventListener("selectstart", preventSelection);
		
		this.on_start();
	};
	
	this.slideEnd = function(evt) {
		if (this.isSliding) {
			this.isSliding = false;
			window.removeEventListener("selectstart", preventSelection);

			this.on_finish(this.current_percentage);
		}
	};

	this.setupHooks = function() {
		this.el.addEventListener("mousedown", this.slideStart.bind(this), false);
		window.addEventListener("mousemove", this.sliding.bind(this), false);
		window.addEventListener("mouseup", this.slideEnd.bind(this), false);
	};
}

function showQueue() {
	"use strict";
	
	var queue_display = document.getElementById("queue_display");
	
	while (queue_display.firstChild) {
		if (queue_display.firstChild.id != "entry_template") {
    		queue_display.removeChild(queue_display.firstChild);
		}
	}
	
	console.log("Showing queue: ", queue);
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
	var player_progress_bar_duration = document.getElementById("player_progress_bar_duration");

	progress_bar.style.width = 100 * progress_ratio + "%";

	player_progress_bar_progress.innerHTML = formatSeconds(Math.min(progress_ratio * song_duration, song_duration));
	if (show_time_left) {
		player_progress_bar_duration.innerHTML = "-" + formatSeconds(Math.min(song_duration * (1 - progress_ratio), song_duration));
	} else {
		player_progress_bar_duration.innerHTML = formatSeconds(song_duration);
	}
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
	var player_progress_bar = document.getElementById("player_progress_bar");
	
	var play_pause = document.getElementById("button_play_pause");
	
	if ([1, 2].indexOf(player.state) >= 0) { //is the player either paused or playing
		footer.style.display = "";
		
		var entry = player.entry;
		
		current_progress = entry.progress;
		song_duration = entry.duration;
		
		if (!song_duration) {
			player_progress_bar.style.display = "none";
		}
		else {
			player_progress_bar.style.display = "";
		}
		
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
	
	window.removeEventListener("selectstart", preventSelection);
}

function setup() { 
	"use strict";
	
	var progress_bar = document.getElementById("progress_bar");
	progress_bar_slider = new slider(progress_bar, setProgress, startProgressSlide, finishProgressSlide);
	progress_bar_slider.setupHooks();
	
	
	var volume_bar = document.getElementById("volume_bar_target");
	volume_slider = new slider(volume_bar, setVolume, function() {}, finishVolumeSlide);
	volume_slider.setupHooks();
}