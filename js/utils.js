function http(method, url, headers) {
  return new Promise(function(resolve, reject) {
    let request = new XMLHttpRequest();

    function resHandler() {
      resolve(this.response);
    }

    function rejHandler() {
      reject(this.response);
    }

    request.addEventListener("load", resHandler);
    request.addEventListener("error", rejHandler);

    request.open(method.toUpperCase(), url);

    if (headers) {
      for (let i = 0; i < headers.length; i++) {
        request.setRequestHeader(headers[i][0], headers[i][1]);
      }
    }

    request.send();
  });
}

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

  if (!secs) {
    return "";
  }

  secs = Math.round(secs);

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
