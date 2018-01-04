class WebieselaUtils {
  static http(method, url, headers) {
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

  static padStringLeft(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }

  static formatSeconds(secs) {
    secs = Math.round(secs);

    var hours = Math.floor(secs / 3600);
    var minutes = Math.floor((secs - hours * 3600) / 60);
    var seconds = Math.floor(secs - hours * 3600 - minutes * 60);

    if (hours > 0) {
      return hours + ":" + WebieselaUtils.padStringLeft(minutes, "0", 2) + ":" + WebieselaUtils.padStringLeft(seconds, "0", 2);
    } else {
      return minutes + ":" + WebieselaUtils.padStringLeft(seconds, "0", 2);
    }
  }

  static uniqueNumber() {
    var stamp = Date.now();

    if (stamp <= WebieselaUtils.uniqueNumber.previous) {
      stamp = ++WebieselaUtils.uniqueNumber.previous;
    } else {
      WebieselaUtils.uniqueNumber.previous = stamp;
    }

    return stamp;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
