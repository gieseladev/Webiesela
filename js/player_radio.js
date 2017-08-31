var radioStations;

function radioStationContextClick(radioId, action) {
  "use strict";

  if (["now", "append"].indexOf(action) < 0) {
    console.log("[Radio] Don't recognise this action", action);
    return;
  }

  console.log("[Radio] action", action, "on radio station", radioId);

  var msg = (action === "now") ? "Now listening to " + radioId.bold() : "Added " + radioId.bold() + " to the queue";
  var failMsg = (action === "now") ? "Can't stream " + radioId.bold() : "Couldn't add " + radioId.bold() + " to the queue";

  sendCommand("play_radio", {
    "mode": action,
    "id": radioId
  }, msg, failMsg);
}

function playRadio(radioId) {
  "use strict";

  console.log("Playing radio station", radioId);

  var station = radioStations.find(function(station) {
    return station.id === radioId;
  });

  sendCommand("play_radio", {
    "id": radioId
  }, "Streaming " + station.name.bold(), "Can't stream " + station.name.bold());
}

function displayRadioStations() {
  "use strict";

  var parentElement = document.getElementById("radio_display");

  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }

  var radioStationTemplate = document.getElementById("radio_station_template").cloneNode(true);

  radioStationTemplate.removeAttribute("id");
  radioStationTemplate.removeAttribute("style");

  var playClick = function(radioId) {
    return function() {
      playRadio(radioId);
    };
  };

  for (var radioStation of radioStations) {
    var radioStationElement = radioStationTemplate.cloneNode(true);

    radioStationElement.setAttribute("data-id", radioStation.id);

    radioStationElement.getElementsByClassName("cover")[0].style.backgroundImage = "url('" + radioStation.cover + "')";
    radioStationElement.getElementsByClassName("title")[0].innerHTML = radioStation.name;

    radioStationElement.getElementsByClassName("play_button")[0].addEventListener("click", playClick(radioStation.id));

    parentElement.appendChild(radioStationElement);
  }

  getContextMenu("#radio-context-menu", "radio_station", radioStationContextClick);
}

function receiveRadioStations(answer) {
  "use strict";

  radioStations = answer.radio_stations;

  console.log("[Radio] displaying radio stations", radioStations);

  displayRadioStations();
}
