var sub_page = "home";

var queue;

var current_entry;
var current_progress = 0;
var song_duration = 0;
var volume = 1;
var muted = false;

var show_time_left = false;

var user_sliding_progress_bar = false;
var ticker;

var progress_bar_slider;
var volume_slider;

let currentPrompt;


function onNotificationClick(element) {
  "use strict";

  if (!element.getAttribute("data-closing")) {
    element.setAttribute("data-closing", true);
    element.style.opacity = 0;
    setTimeout(function() {
      element.parentElement.removeChild(element);
    }, 500);
  }
}

function displayPushNotification(msg, waitTime) {
  "use strict";

  var waitTime = waitTime || 2000;

  let newNotification = HTMLTemplate.get("push_notification");

  newNotification.getElementsByClassName("message")[0].innerHTML = msg;

  var parentElement = document.getElementById("notifications");

  parentElement.insertBefore(newNotification, parentElement.firstChild);

  setTimeout(function(element) {
    function removeElement() {
      if (element) {
        onNotificationClick(element);
      }
    };
    return removeElement;
  }(newNotification), waitTime);
}

function loadSubPage(page_name, on_ready) {
  "use strict";
  if (sub_page === page_name) { // no need to reload current site
    console.log("[Main] not loading page because its already loaded");
    on_ready();
    return;
  }

  console.log("[MAIN] switching from " + sub_page + " to " + page_name + "...");
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {

      document.getElementById("main_container_flex").innerHTML = this.responseText;
      sub_page = page_name;
      console.log("[MAIN] successfully loaded " + page_name);

      on_ready();
    }
  };
  xhttp.open("GET", "main_panels/" + page_name + ".html", true);
  xhttp.send();
}

function preventSelection(event) {
  "use strict";

  event.preventDefault();
}

function sendCommand(cmd, data, onSuccess, onError) {
  "use strict";

  console.log("Sending command \"", cmd, "\" with data: ", data);

  var msgObj = {
    "token": token,
    "command": cmd,
    "command_data": data
  };

  if (onSuccess || onError) {
    var onSuccessFunction = function() {
      function handler(answer) {
        if (answer.success) {
          if (typeof onSuccess === "function") {
            onSuccess(answer);
          } else if (typeof onSuccess === "string") {
            displayPushNotification(onSuccess);
          }
        } else {
          if (typeof onSuccess === "function") {
            onError(answer);
          } else if (typeof onError === "string") {
            displayPushNotification(onError);
          }
        }
      };
      return handler;
    }();

    waitForAnswer(msgObj, onSuccessFunction);
  } else {
    doSend(JSON.stringify(msgObj));
  }
}


function finishVolumeSlide(value) {
  "use strict";

  if (0 <= value <= 1) {
    sendCommand("volume", {
      "value": value
    }, null, "Couldn't change volume");
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
    current_progress = value * song_duration;
    sendCommand("seek", {
      "value": current_progress
    }, null, "Couldn't seek");
  }
}

function cycleRepeat() {
  "use strict";

  sendCommand("cycle_repeat", null, null, "Couldn't change repeat mode");
}

function clear_queue() {
  "use strict";

  let yesCB = function() {
    sendCommand("clear", null, "Cleared the Queue", "Couldn't clear the Queue");
  };

  let prompt = new PromptTrueFalse("Remove all entries from the Queue?", "yes", "no");

  prompt.whenTrue().then(yesCB);

  popupManager.add(prompt);
}

function shuffle() {
  "use strict";

  sendCommand("shuffle", null, "Shuffled the Queue", "Couldn't shuffle the Queue");
}

function skip() {
  "use strict";

  sendCommand("skip", null, null, "Couldn't skip");
}

function revert() {
  "use strict";

  sendCommand("revert", null, null, "Couldn't revert");
}

function mute() {
  if (muted) {
    muted = false;
    setVolume(volume);
    sendCommand("volume", {
      "value": volume
    }, null, "Couldn't unmute");
  } else {
    muted = true;
    setVolume(0);
    sendCommand("volume", {
      "value": 0
    }, null, "Couldn't mute");
  }
}

function _entryRightClick(event) {
  "use strict";

  var element = (event.srcElement || event.target);
  var parent = element.parentElement

  if (parent.classList.contains("special_container")) {
    var parent = parent.parentElement;
  }

  var rect = element.getBoundingClientRect();

  parent.dispatchEvent(new CustomEvent("openContextMenu", {
    "detail": {
      "posX": rect.left,
      "posY": rect.bottom
    }
  }));
}

function playPauseClick() {
  "use strict";

  sendCommand("play_pause", null, null, "Something went wrong");
}

function switchDurationDisplay() {
  "use strict";

  show_time_left = !show_time_left;
  setProgress(current_progress / song_duration);
}

function _disableAllActive() {
  "use strict";

  document.getElementById("navbar_search").classList.remove("active");
  document.getElementById("navbar_home").classList.remove("active");
  document.getElementById("navbar_playlists").classList.remove("active");
  document.getElementById("navbar_radio_stations").classList.remove("active");

  window.removeEventListener("scroll", scrollWaiterFunc, true);
}

function switchToSearch(noHistory) {
  "use strict";

  _disableAllActive();
  document.getElementById("navbar_search").classList.add("active");

  if (!noHistory) {
    history.pushState({
      "id": "main-search"
    }, "search", "#search");
  }

  loadSubPage("search", () => {
    setupSearch();
  });
}

function switchToHome(noHistory) {
  "use strict";

  _disableAllActive();
  document.getElementById("navbar_home").classList.add("active");

  if (!noHistory) {
    history.pushState({
      "id": "main-home"
    }, "home", "#home");
  }

  loadSubPage("home", function() {
    getInformation();
    switchHomePage("queue");
  });
}

function switchToPlaylists(noHistory) {
  "use strict";

  _disableAllActive();
  document.getElementById("navbar_playlists").classList.add("active");

  if (!noHistory) {
    history.pushState({
      "id": "main-playlists"
    }, "all playlists", "#playlists");
  }

  loadSubPage("playlists", function() {
    waitForAnswer({
      request: "send_playlists"
    }, receivePlaylist);
  });
}

function switchToRadio(noHistory) {
  "use strict";

  _disableAllActive();
  document.getElementById("navbar_radio_stations").classList.add("active");

  if (!noHistory) {
    history.pushState({
      "id": "main-radio_stations"
    }, "radio stations", "#radio");
  }

  loadSubPage("radio", function() {
    waitForAnswer({
      request: "send_radio_stations"
    }, receiveRadioStations);
  });
}

function switchToPictureFrame() {
  "use strict";

  history.pushState({
    "id": "picture_frame"
  }, "picture_frame", "#picture_frame");

  loadPage("picture_frame", function() {
    getInformation();
  });
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

function setVolume(newVal) {
  "use strict";

  if (newVal === 0) {
    muted = true;
  } else {
    muted = false;
    volume = newVal;
  }

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
  var button_repeat = document.getElementById("button_repeat");

  queue = player.queue;

  switch (player.repeat_state) {
    case 1:
      button_repeat.className = "repeat_all";
      break;
    case 2:
      button_repeat.className = "repeat_single";
      break;
    default:
      button_repeat.className = "";
  }

  if ([1, 2].indexOf(player.state) >= 0 && player.entry) { //is the player either paused or playing
    footer.style.display = "";

    current_entry = player.entry;

    transitionBackground(current_entry.thumbnail);

    current_progress = current_entry.progress;
    song_duration = current_entry.duration;

    setProgress(current_progress / song_duration);

    if (!song_duration) {
      player_progress_bar.style.display = "none";
    } else {
      player_progress_bar.style.display = "";
    }

    clearInterval(ticker);

    if (player.state === 2) {
      play_pause.classList.add("paused");
    } else {
      play_pause.classList.remove("paused");
      ticker = setInterval(updateProgress, 1000);
    }

    setVolume(player.volume);

    song_title.innerHTML = current_entry.title;
    song_artist.innerHTML = current_entry.artist || "";
    cover_image.style.backgroundImage = "url('" + (current_entry.cover || current_entry.thumbnail) + "')";
    player_progress_bar_duration.innerHTML = formatSeconds(song_duration);
  } else {
    clearInterval(ticker);

    footer.style.display = "none";
  }

  if (sub_page === "home") {
    handleQueue();
  }
}

function playerHandleUpdate(update) {
  "use strict";

  if (update.state !== undefined) {
    var footer = document.getElementById("player");
    var play_pause = document.getElementById("button_play_pause");

    clearInterval(ticker);

    if ([1, 2].indexOf(update.state) >= 0) {
      footer.style.display = "";
    } else {
      footer.style.display = "none";
    }

    if (update.state === 2) {
      play_pause.classList.add("paused");
    } else {
      play_pause.classList.remove("paused");
      ticker = setInterval(updateProgress, 1000);
    }
  }

  if (update.volume !== undefined) {
    setVolume(update.volume);
  }

  if (update.repeat_state !== undefined) {
    var button_repeat = document.getElementById("button_repeat");

    switch (update.repeat_state) {
      case 1:
        button_repeat.className = "repeat_all";
        break;
      case 2:
        button_repeat.className = "repeat_single";
        break;
      default:
        button_repeat.className = "";
    }
  }

  if (update.progress !== undefined) {
    var player_progress_bar = document.getElementById("player_progress_bar");

    current_progress = update.progress;
    setProgress(current_progress / song_duration);

    if (!song_duration) {
      player_progress_bar.style.display = "none";
    } else {
      player_progress_bar.style.display = "";
    }
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

function breakDown_main_screen() {
  "use strict";

  if (ticker) {
    clearInterval(ticker);
  }

  window.removeEventListener("selectstart", preventSelection);
}

function setup_main_screen() {
  "use strict";

  history.replaceState({
    "id": "main-home"
  }, "home", "#home");

  switchHomePage("queue");
  sub_page = "home";

  var progress_bar = document.getElementById("progress_bar");
  progress_bar_slider = new slider(progress_bar, setProgress, startProgressSlide, finishProgressSlide);
  progress_bar_slider.setupHooks();


  var volume_bar = document.getElementById("volume_bar_target");
  volume_slider = new slider(volume_bar, setVolume, function() {}, finishVolumeSlide);
  volume_slider.setupHooks();
}
