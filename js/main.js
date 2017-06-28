var timeout_ms = 2000;
var websocket = null;
var token = getCookie("token");

var user = null;

function init() {
    "use strict";
    doConnect();
}

function loadPage(page_name, on_ready) {
	"use strict";
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			document.getElementById("window").innerHTML = this.responseText;
			on_ready();
		}
	};
	xhttp.open("GET", page_name + ".html", true);
	xhttp.send();
}

function doConnect() {
    "use strict";
    console.log("[WEBSOCKET] trying to connect");
    websocket = new WebSocket("ws://localhost:8000/");
    websocket.onopen = function(evt) {
        onOpen(evt);
    };
    websocket.onclose = function(evt) {
        onClose(evt);
    };
    websocket.onmessage = function(evt) {
        onMessage(evt);
    };
    websocket.onerror = function(evt) {
        onError(evt);
    };
}

function onOpen( /*evt*/ ) {
    "use strict";
    console.log("[WEBSOCKET] connected to Giesela");
	timeout_ms = 2000; //set timeout back to default value

    if (token !== "") {
        console.log("[WEBSOCKET] found token in cookies, asking for init information");
        getInformation();
    } else {
        console.log("[WEBSOCKET] no token, requesting registration");
		loadPage("register_screen", function() {
			doSend(JSON.stringify({
				"request": "register"
			}));
		});
    }
}

function onClose( /*evt*/ ) {
    "use strict";
    console.log("[WEBSOCKET] disconnected");
}

function onMessage(evt) {
    "use strict";
    var data = JSON.parse(evt.data);
    console.log("[WEBSOCKET] got message:");
    console.log(data);
    if (data.error) {
        if (data.error[0] === 1000) {
            console.log("[WEBSOCKET] faulty token, requesting registration");
            doSend(JSON.stringify({
                "request": "register"
            }));
            return;
        }
        console.log("[WEBSOCKET] I ducked up:");
        console.log(data.error);
    }
	if (data.registration_token) {
		var registration_token = data.registration_token;
		console.log("[WEBSOCKET] received my very own registration token: " + registration_token);
		document.getElementById("register_screen_token").innerHTML = registration_token;
		document.getElementById("register_screen_token_tutorial").innerHTML = registration_token;
	}
    if (data.token) {
        console.log("[WEBSOCKET] received token");
        setCookie("token", data.token, 120);
    }
    if (data.info) {
        console.log("[WEBSOCKET] got some information");
        parseInformation(data.info);
    }
}

function getInformation() {
    "use strict";
    doSend(JSON.stringify({
        "token": token,
        "request": "send_information"
    }));
}

function parseInformation(info) {
    "use strict";
    if (info.user) {
        console.log("[WEBSOCKET] got information about user:");
        user = info.user;
        console.log(user);
    }
    if (info.player) {
        console.log("[WEBSOCKET] got me some nice player information");
        var player = info.player;
        if (player.current_entry) {
            var current_entry = player.current_entry;
            if (current_entry.spotify_track) {
                var spotify_track = current_entry.spotify_track;
                var title = spotify_track.name;
                var artist = spotify_track.artists.slice(0, 2).map(function(artist) {
                    return artist.name;
                }).join(" & ");
                var cover_url = spotify_track.album.images[0].url;
                var thumbnail = player.current_entry.thumbnail;

                document.getElementById("thumbnail").src = thumbnail;
                document.getElementById("artist").innerHTML = artist;
                document.getElementById("title").innerHTML = title;
                document.getElementById("cover").src = cover_url;
                document.getElementById("paused").style.visibility = (player.state === 1) ? "hidden" : "visible";

            } else {
                console.log("Not a spotify entry, so nothing to display hehe");
            }
        } else {
            console.log("There's currently nothing playing");
        }
    }
}

function onError(evt) {
    "use strict";
    console.log("[WEBSOCKET] Error " + evt + ". Reconnecting in " + timeout_ms / 1000 + " seconds");
    websocket.close();
    setTimeout(doConnect, timeout_ms);
    timeout_ms *= 2;
}

function doSend(message) {
    "use strict";
    websocket.send(message);
}
window.addEventListener("load", init, false);