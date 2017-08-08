function selectText(containerid) {
  "use strict";
  if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(document.getElementById(containerid));
    range.select();
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNode(document.getElementById(containerid));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

function str_pad_left(string, pad, length) {
  "use strict";

  return (new Array(length + 1).join(pad) + string).slice(-length);
}

function formatSeconds(secs) {
  "use strict";

  var hours = Math.floor(secs / 3600);
  var minutes = Math.floor((secs - hours * 3600) / 60);
  var seconds = Math.floor(secs - hours * 3600 - minutes * 60);

  if (hours > 0) {
    return hours + ":" + str_pad_left(minutes, "0", 2) + ":" + str_pad_left(seconds, "0", 2);
  } else {
    return minutes + ":" + str_pad_left(seconds, "0", 2);
  }
}

function uniqueNumber() {
  "use strict";

  var date = Date.now();

  if (date <= uniqueNumber.previous) {
    date = ++uniqueNumber.previous;
  } else {
    uniqueNumber.previous = date;
  }

  return date;
}

uniqueNumber.previous = 0;

function transitionBackground(new_background_url) {
  "use strict";
  var bg_parent = document.getElementById("bg");
  var old_thumbnail = document.getElementById("thumbnail_old");
  var thumbnail = document.getElementById("thumbnail");
  if (new_background_url === thumbnail.src) {
    console.log("[BACKGROUND] Background image is the same as before, not transitioning!");
    return;
  }
  old_thumbnail.src = thumbnail.src;
  thumbnail.src = new_background_url;
  bg_parent.classList.add("transition");
  var callfunction = function() {
    bg_parent.classList.remove("transition");
  };
  bg_parent.addEventListener("webkitAnimationEnd", callfunction, false);
  bg_parent.addEventListener("animationend", callfunction, false);
  bg_parent.addEventListener("oanimationend", callfunction, false);
}
