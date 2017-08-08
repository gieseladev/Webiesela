var timeout_ms = 2000;
var websocket = null;
var token = getCookie("token");
var user = null;
var current_page = "loading_screen";

var waitingForAnswer = {};

var config;

function init() {
  "use strict";
  //window.removeEventListener("load", init, false);

  var request = new XMLHttpRequest();
  request.open("GET", "config.json", false);
  request.send(null);

  config = JSON.parse(request.responseText);

  doConnect();
}

function loadPage(page_name, on_ready) {
  "use strict";
  if (current_page === page_name) { // no need to reload current site
    return false;
  }
  console.log("[PAGE] switching from " + current_page + " to " + page_name + "...");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      if (current_page === "main_screen") {
        breakDown();
      }

      document.getElementById("window").innerHTML = this.responseText;
      current_page = page_name;

      if (current_page === "main_screen") {
        setup();
      } else if (current_page === "picture_frame") {
        setupPictureFrame();
      }

      console.log("[PAGE] successfully loaded " + page_name);

      on_ready();
    }
  };
  xhttp.open("GET", page_name + ".html", true);
  xhttp.send();
}

function doConnect() {
  "use strict";
  console.log("[WEBSOCKET] trying to connect");
  websocket = new WebSocket(config.websocket_address);
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

function onClose( /*evt*/ ) {
  "use strict";
  console.log("[WEBSOCKET] disconnected");
}

function onMessage(evt) {
  "use strict";
  var data = JSON.parse(evt.data);
  console.log("[WEBSOCKET] got message ", data);

  if (data.request_id) {
    console.log("[WEBSOCKET] This isn't a general message id", data.request_id);
    var handler = waitForAnswer[data.request_id];
    if (handler) {
      delete waitForAnswer[data.request_id];

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
      });
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
    token = data.token;
    setCookie("token", token, 120);
    loadPage("picture_frame", function() {
      getInformation();
    });
  }
  if (data.info) {
    console.log("[WEBSOCKET] got some information");
    parseInformation(data.info);
  }
}

function waitForAnswer(message_object, handler) {
  "use strict";

  var request_id = uniqueNumber();

  waitingForAnswer[request_id] = handler;

  message_object.id = request_id;
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

    if (current_page === "main_screen") {
      setUser();
    }
  }
  var player = info.player;
  switch (current_page) {
    case "picture_frame":
      pictureFrameHandlePlayerInformation(player);
      break;
    case "main_screen":
      playerHandlePlayerInformation(player);
      break;
  }
}

function onError(evt) {
  "use strict";
  console.log("[WEBSOCKET] Error ", evt, ". Reconnecting in " + timeout_ms / 1000 + " seconds");
  websocket.close();

  if (current_page === "main_screen") {
    breakDown();
  }

  loadPage("loading_screen", function() { //switch back to the loading screen and connect again
    setTimeout(doConnect, timeout_ms);
    timeout_ms *= 1.5;
  });
}

function doSend(message) {
  "use strict";
  websocket.send(message);
}

init();
