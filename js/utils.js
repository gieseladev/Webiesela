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

function transitionBackground(new_background_url) {
	"use strict";
	var bg_parent = document.getElementById("bg");
	var old_thumbnail = document.getElementById("thumbnail_old");
	var thumbnail = document.getElementById("thumbnail");
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