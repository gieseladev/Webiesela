let currentPage = "loading_screen";

let webiesela;
let notificationBar;
let config;

let timeoutMs = 2000;


function onPopState(event) {
  "use strict";

  let state = event.state;
  console.log("[HISTORY] going back to ", state);

  if (state) {
    let site_id = state.id;

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
          let playlistId = state.focus;

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

    connect();
  });
}

function connect() {
  webiesela = new Webiesela(config.websocket_address)
  .on("disconnect", reconnect)
  .on("error", onError);

  if (webiesela.tokenValid) {
    webiesela.authorise()
      .then(authorised)
      .catch(register);
  } else {
    register();
  }
}

function reconnect() {
  console.warn("[Main] reconnecting in " + formatSeconds(timeoutMs / 1000) + " seconds!");

  setTimeout(connect, timeoutMs);
  timeoutMs = Math.min(2 * timeoutMs, config.max_timeout_ms);
}

async function register() {
  if (!webiesela.connected) {
    console.error("[Main] Couldn't reach Giesela!");
    reconnect();
    return;
  }

  console.debug("[Main] registering");

  let showToken = async token => {
    await loadPage("register_screen");
    console.debug("[Main] got token", token);

    document.getElementById("register_screen_token").innerHTML = token.token;
    document.getElementById("register_screen_token_tutorial").innerHTML = token.token;

    let cb = new Clipboard(".click_copy");
    cb.on("success", () => notificationBar.show("Comand copied to Clipboard", 3000));
  }

  webiesela.register(showToken, authorised);
}

async function authorised() {
  console.info("[Main] Authorised!");

  await loadPage("main_screen");
  // TODO setup!
}

function _callFunc(...name) {
  let func = window[name.join("_")];

  if (func) {
    console.debug("Calling", name);
    func();
  }
}

async function loadPage(name) {
  // no need to reload current site
  if (currentPage === name) {
    return;
  }

  console.debug("[Main] switching from " + currentPage + " to " + name);

  await _callFunc("preLoad", name);

  let html = await http("GET", name + ".html");

  _callFunc("close", currentPage);

  document.getElementById("window").innerHTML = html;
  currentPage = name;

  _callFunc("open", currentPage);

  console.info("[Main] successfully loaded " + name);
  return;
}


function onError(evt) {
  webiesela.disconnect();
}



function onMessage(evt) {
  "use strict";
  let data = JSON.parse(evt.data);
  console.log("[WEBSOCKET] got message ", data);

  if (data.request_id) {
    let handler = waitingForAnswer[data.request_id];
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
    let registration_token = data.registration_token;
    let command_prefix = data.command_prefix;

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

function parseInformation(info) {
  "use strict";
  if (info.user) {
    console.log("[WEBSOCKET] got information about user ", info.user);
    user = info.user;

    if (currentPage === "main_screen") {
      setUser();
    }
  }
  let player = info.player;
  switch (currentPage) {
    case "main_screen":
      playerHandlePlayerInformation(player);
      break;
  }
}

function doReconnect() {
  "use strict";

  console.log("[Websocket] reconnecting in", formatSeconds(timeout_ms / 1000));

  loadPage("loading_screen", function() { //switch back to the loading screen and connect again
    setTimeout(doConnect, timeout_ms);
    timeout_ms = Math.min(1.5 * timeout_ms, (config.max_timeout_ms || 180000));
  });
}





function transitionBackground(new_background_url) {
  let bg_parent = document.getElementById("bg");
  let old_thumbnail = document.getElementById("thumbnail_old");
  let thumbnail = document.getElementById("thumbnail");

  if (new_background_url === thumbnail.src) {
    console.log("[BACKGROUND] Background image is the same as before, not transitioning!");
    return;
  }

  old_thumbnail.src = thumbnail.src;
  thumbnail.src = new_background_url;
  bg_parent.classList.add("transition");

  let callfunction = function() {
    bg_parent.classList.remove("transition");
  };

  bg_parent.addEventListener("webkitAnimationEnd", callfunction, false);
  bg_parent.addEventListener("animationend", callfunction, false);
  bg_parent.addEventListener("oanimationend", callfunction, false);
}


document.addEventListener("DOMContentLoaded", _init);
