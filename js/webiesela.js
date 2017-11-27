let Webiesela = (function() {
  let eventListeners = {};
  let websocke = null;

  let log = (msg, level) => {
    let prefix = "[Webiesela]";
    if (level) {
      prefix += " " + level;
    }

    console.log(prefix, msg);
  };

  let connect = addr => {
    websocket = new WebSocket(addr)

    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
    websocket.onerror = onOpen;
  };

  let onOpen = evt => {

  };

  let onClose = evt => {

  };

  let onMessage = evt => {

  };

  let onError = evt => {

  };

  return {
    authorise: function(token) {
      return new Promise((resolve, reject) => {

      });
    },

    register: () => {
      return new Promise((resolve, reject) => {

      });
    }
  };
})();
