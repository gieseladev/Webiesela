const WebieselaErrorCodes = {
  GENERAL: 0,
  MISSINGPARAMS: 1000,
  PARAMERROR: 1001,

  AUTHREQUIRED: 2001,
  TOKENUNKNOWN: 2002,
  TOKENEXPIRED: 2003,
};


class WebieselaRequest {
  constructor(request) {
    this.request = request;
  }
}


class WebieselaCommand {
  constructor(command, extra) {
    this.command = command;
  }
}


class WebieselaEndpoints {
  // COMMANDS!

  volume(value) {
    let data = {
      command: "volume",
      value: value
    };

    return this._sendCommand(data);
  }

  shuffle() {
    let data = {
      command: "shuffle"
    };

    return this._sendCommand(data);
  }

  clear() {
    let data = {
      command: "clear"
    };

    return this._sendCommand(data);
  }

  move(from_index, to_index) {
    let data = {
      command: "move",
      from_index: from_index,
      to_index: to_index
    };

    return this._sendCommand(data);
  }

  replay(index) {
    let data = {
      command: "replay",
      index: index
    };

    return this._sendCommand(data);
  }

  // REQUESTS!

  getQueue() {
    let data = {
      request: "get_queue"
    };

    return this._sendCommand(data);
  }

  _sendCommand(data) {
    return new Promise((resolve, reject) => {
      this.waitForAnswer(data)
        .then(msg => {
          if (msg.success) {
            resolve(msg);
          } else {
            reject(msg.error);
          }
        });
    });
  }
}



class Webiesela extends WebieselaEndpoints {
  static _log(logger, ...msg) {
    let prefix = "[Webiesela]";
    logger(prefix, ...msg);
  }

  static debug(...msg) {
    Webiesela._log(console.debug, ...msg);
  }

  static info(...msg) {
    Webiesela._log(console.info, ...msg);
  }

  static log(...msg) {
    Webiesela._log(console.log, ...msg);
  }

  static warn(...msg) {
    Webiesela._log(console.warn, ...msg);
  }

  constructor(address) {
    super();

    this.websocket = null;
    this._authorised = false;
    this.address = address;

    this._token = JSON.parse(localStorage.getItem("webiesela_token"));

    this.listeners = {
      connect: [],
      disconnect: [],
      error: [],
      anymessage: [],
      message: [],
      authorised: []
    };

    this.once_listeners = Object.assign({}, this.listeners);

    this.waitingForAnswer = {};
  }

  get token() {
    return this._token;
  }

  set token(value) {
    this._token = value;
    localStorage.setItem("webiesela_token", JSON.stringify(value));
  }

  get hasToken() {
    return Boolean(this.token);
  }

  get tokenValid() {
    return this.hasToken && this.token.expires_at > (Date.now() / 1000);
  }

  get connected() {
    return Boolean(this.websocket) && this.websocket.readyState == 1;
  }

  get authorised() {
    return this._authorised;
  }

  set authorised(value) {
    this._authorised = value;

    if (value) {
      this._emit("authorised");
    }
  }

  get user() {
    return this.authorised ? this.token.webiesela_user : null;
  }

  _connect() {
    return new Promise((resolve, reject) => {
      Webiesela.debug("trying to connect");
      this.websocket = new WebSocket(this.address);

      this.websocket.onopen = evt => {
        resolve();
        this._onOpen(evt);
      };

      this.websocket.onclose = evt => {
        reject();
        this._onClose(evt);
      };

      this.websocket.onerror = evt => {
        reject();
        this._onError(evt);
      };
    });
  }

  _onOpen(evt) {
    this.websocket.onopen = evt => this._onOpen(evt);
    this.websocket.onclose = evt => this._onClose(evt);
    this.websocket.onerror = evt => this._onError(evt);
    this.websocket.onmessage = evt => this._onMessage(evt);

    Webiesela.info("connected!");
    this._emit("connect", evt);
  }

  _onClose(evt) {
    Webiesela.info("disconnected");
    this._emit("disconnect", evt);
  }

  _onError(evt) {
    Webiesela.warn("error", evt);
    this._emit("error", evt);
  }

  _onMessage(evt) {
    let rawMessage = evt.data;

    let msg = JSON.parse(rawMessage);
    Webiesela.debug("received message", msg);
    this._emit("anymessage", msg);

    if (msg.id) {
      let handler = this.waitingForAnswer[msg.id];

      if (handler) {
        delete this.waitingForAnswer[msg.id];

        handler(msg);
      } else {
        Webiesela.warn("Message has id, but no handler found", msg);
      }

      return;
    }

    this._emit("message", msg);
  }

  send(data) {
    if (this.connected) {
      Webiesela.debug("sending message", data);
      let serData = JSON.stringify(data);
      this.websocket.send(serData);

      return true;
    }

    throw new Error("Can't send messages when not connected");
  }

  _emit(evt, ...data) {
    let evtName = evt.toLowerCase();
    let listeners = this.listeners[evtName];

    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        try {
          listeners[i](...data);
        } catch (e) {
          Webiesela.warn("Error while emitting \"" + evt + "\" (", listeners[i], ")\n", e);
        }
      }

      return true;
    }

    throw new Error("Can't emit event \"" + evt + "\"");
  }

  on(evt, listener) {
    let evtName = evt.toLowerCase();
    let listeners = this.listeners[evtName];

    if (listeners) {
      listeners.push(listener);
      return this;
    }

    throw new Error("Can't add a listener to event \"" + evt + "\"");
  }

  once(evt) {
    return new Promise(resolve => {
      let evtName = evt.toLowerCase();

      let method = (...args) => {
        let index = this.once_listeners[evtName].indexOf(resolve);
        this.once_listeners[evtName].splice(index, 1);

        resolve(...args);
      };

      let listeners = this.once_listeners[evtName];

      if (listeners) {
        listeners.push(method);
        return this;
      }

      throw new Error("Can't add a one-time listener to event \"" + evt + "\"");
    });
  }

  waitForId(uid) {
    return new Promise(resolve => {
      this.waitingForAnswer[uid] = msg => resolve(msg);
    });
  }

  waitForAnswer(msg) {
    return new Promise(resolve => {
      // TODO write new uniqueNum gen
      let uid = uniqueNumber();
      msg.id = uid;

      this.waitForId(uid).then(resolve);
      this.send(msg);
    });
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  register(gotRegistrationToken, gotToken) {
    this._connect()
      .then(() => {
        this.waitForAnswer({
            request: "register"
          })
          .then(msg => {
            let registrationToken = msg.registration_token;

            this.waitForId(msg.id).then(msg => {
              let token = msg.token;
              Webiesela.info("got token", token);

              this.token = token;
              this.authorised = true;

              gotToken(token);
            });

            gotRegistrationToken(registrationToken);
          });
      });
  }

  authorise() {
    return new Promise((resolve, reject) => {
      this._connect()
        .then(() => {
          this.waitForAnswer({
              request: "authorise",
              token: this.token.token
            })
            .then(msg => {
              if (msg.success) {
                Webiesela.info("authorised!");
                this.token = msg.token;
                this.authorised = true;
                resolve();
              } else {
                let error = msg.error;
                Webiesela.warn("couldn't authorise!", error);
                reject(error);
              }
            });
        })
        .catch(reject);
    });
  }
}
