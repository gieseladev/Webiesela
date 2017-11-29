let currentPage = "loading_screen";

let webiesela;
let notificationBar;
let config;

let timeoutMs = 2000;


function onPopState(event) {
  "use strict";

  var state = event.state;
  console.log("[HISTORY] going back to ", state);

  if (state) {
    var site_id = state.id;

    if (site_id) {
      switch (site_id) {
        case "main-search":
          loadPage("main_screen", function() {
            switchToSearch(true);
          });
          break;
        case "main-home":
          loadPage("main_screen", function() {
            _disableAllActive();
            document.getElementById("navbar_home").classList.add("active");

            loadSubPage("home", function() {
              getInformation();
              switchHomePage("queue");
            });
          });
          break;
        case "main-playlists":
          var playlistId = state.focus;

          if (playlistId) {
            loadPage("main_screen", function() {
              _disableAllActive();
              document.getElementById("navbar_playlists").classList.add("active");

              loadSubPage("playlists", function() {
                waitForAnswer({
                  request: "send_playlists"
                }, function(answer) {
                  receivePlaylist(answer);
                  showPlaylist(playlistId, true);
                });
              });
            });
          } else {
            loadSubPage("playlists", function() {
              switchToPlaylists(true);
            });
          }
          break;
        case "main-radio_stations":
          loadPage("main_screen", function() {
            switchToRadio(true);
          });
          break;
      }

    } else {
      console.log("[HISTORY] didin't provide an id");
    }
  } else {
    console.log("[HISTORY] Can't go back there");
  }
}

function _init() {
  Raven.config("https://3b40b56e8ae541aabbdd449223228f77@sentry.io/229538").install();
  Raven.context(function() {
    init();
  });
}

function init() {
  window.onpopstate = onPopState;
  notificationBar = new NotificationBar();

  Searcher.get("config.json").then(JSON.parse).then(data => {
    config = data;

    webiesela = new Webiesela(config.websocket_address);

    if (webiesela.tokenValid) {
      webiesela.authorise()
        .then(authorised)
        .catch(register);
    } else {
      register();
    }
  });
}

async function register() {
  console.log("registering!");

  let showToken = async token => {
    await loadPage("register_screen");
    console.log("showing token", token);

    document.getElementById("register_screen_token").innerHTML = token.token;
    document.getElementById("register_screen_token_tutorial").innerHTML = token.token;

    let cb = new Clipboard(".click_copy");
    cb.on("success", () => notificationBar.show("Comand copied to Clipboard", 3000));
  }

  webiesela.register(showToken, authorised);
}

function authorised() {
  console.log("authorised, hey!");
}

async function loadPage(name) {
  if (currentPage === name) { // no need to reload current site
    return;
  }

  console.log("[PAGE] switching from " + currentPage + " to " + name);

  let html = await http("GET", name + ".html");

  // TODO do I still need this?
  if (currentPage === "main_screen") {
    breakDown();
  }
  if (currentPage === "main_screen") {
    setup();
  }
  // end

  document.getElementById("window").innerHTML = html;
  currentPage = name;

  console.log("[PAGE] successfully loaded " + name);
  return;
}


function onOpen( /*evt*/ ) {
  "use strict";
  console.log("[WEBSOCKET] connected to Giesela");
  timeout_ms = 2000; //set timeout back to default value
  if (token !== "") {
    console.log("[WEBSOCKET] found token in cookies, asking for init information");
    loadPage("main_screen", function() {
      getInformation();
    });
  } else {
    console.log("[WEBSOCKET] no token, requesting registration");
    loadPage("register_screen", function() {
      doSend(JSON.stringify({
        "request": "register"
      }));
    });
  }
}

function onClose(evt) {
  "use strict";
  console.log("[WEBSOCKET] disconnected");

  // if (!evt.wasClean) {
  //   return;
  // }

  doReconnect(evt);
}

function onMessage(evt) {
  "use strict";
  var data = JSON.parse(evt.data);
  console.log("[WEBSOCKET] got message ", data);

  if (data.request_id) {
    var handler = waitingForAnswer[data.request_id];
    if (handler) {
      delete waitingForAnswer[data.request_id];

      console.log("[WEBSOCKET] found handler for", data.request_id, ":", handler);

      handler(data);
    } else {
      console.log("[WEBSOCKET] Couldn't find a handler for this request id");
    }
    return;
  }

  if (data.error) {
    if (data.error[0] === 1000) {
      console.log("[WEBSOCKET] faulty token, requesting registration");
      loadPage("register_screen", function() {
        doSend(JSON.stringify({
          "request": "register"
        }));
        notificationBar.show("Token was rejected", 5000);
      });
      return;
    }
    console.log("[WEBSOCKET] I ducked up", data.error);
  }

  if (data.registration_token) {
    var registration_token = data.registration_token;
    var command_prefix = data.command_prefix;

    console.log("[WEBSOCKET] received my very own registration token: " + registration_token, "with command prefix", command_prefix);

    document.getElementById("register_screen_command").innerHTML = command_prefix + "register";
    document.getElementById("register_screen_token").innerHTML = registration_token;
    document.getElementById("register_screen_token_tutorial").innerHTML = registration_token;

    let cb = new Clipboard(".click_copy");
    cb.on("success", function(e) {
      notificationBar.show("Comand copied to Clipboard", 3000);
    });
  }

  if (data.token) {
    console.log("[WEBSOCKET] received token");
    token = data.token;
    setCookie("token", token, 120);
    loadPage("main_screen", function() {
      getInformation();
    });
  }

  if (data.info) {
    console.log("[WEBSOCKET] got some information");
    parseInformation(data.info);
  }

  if (data.update) {
    console.log("[Websocket] received an update");

    if (currentPage === "main_screen") {
      playerHandleUpdate(data.update);
    }
  }
}

function waitForAnswer(message_object, handler) {
  "use strict";

  var request_id = uniqueNumber();

  waitingForAnswer[request_id] = handler;

  message_object.id = request_id;
  message_object.token = token;
  doSend(JSON.stringify(message_object));
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
    console.log("[WEBSOCKET] got information about user ", info.user);
    user = info.user;

    if (currentPage === "main_screen") {
      setUser();
    }
  }
  var player = info.player;
  switch (currentPage) {
    case "main_screen":
      playerHandlePlayerInformation(player);
      break;
  }
}

function onError(evt) {
  "use strict";
  console.log("[WEBSOCKET] Error ", evt);
  websocket.close();

  // doReconnect(evt);
}

function doReconnect() {
  "use strict";

  console.log("[Websocket] reconnecting in", formatSeconds(timeout_ms / 1000));

  loadPage("loading_screen", function() { //switch back to the loading screen and connect again
    setTimeout(doConnect, timeout_ms);
    timeout_ms = Math.min(1.5 * timeout_ms, (config.max_timeout_ms || 180000));
  });
}

function doSend(message) {
  "use strict";
  websocket.send(message);
}

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

document.addEventListener("DOMContentLoaded", _init);
