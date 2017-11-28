class Webiesela {
  static log(...msg) {
    let prefix = "[Webiesela]";
    console.log(prefix, ...msg);
  }

  constructor(address) {
    this.websocket = null;
    this._authorised = false;
    this.address = address;

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

  get connected() {
    return Boolean(this.websocket && this.readyState == 1);
  }

  get authorised() {
    return this._authorised;
  }

  _connect() {
    return new Promise((resolve, reject) => {
      Webiesela.log("trying to connect");
      this.websocket = new WebSocket(this.address);

      this.websocket.onopen = evt => {
        resolve();
        this._onOpen(evt);
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

    Webiesela.log("connected!");
    this._emit("connect", evt);
  }

  _onClose(evt) {
    Webiesela.log("disconnected");
    this._emit("disconnect", evt);
  }

  _onError(evt) {
    Webiesela.log("error", evt);
    this._emit("error", evt);
  }

  _onMessage(evt) {
    let rawMessage = evt.data;

    let msg = JSON.parse(rawMessage);
    Webiesela.log("received message", msg);
    this._emit("anymessage", msg);

    if (msg.id) {
      let handler = this.waitingForAnswer[msg.id];

      if (handler) {
        delete this.waitingForAnswer[msg.id];

        handler(msg);
      } else {
        Webiesela.log("Message has id, but no handler found", msg);
      }

      return;
    }

    this._emit("message", msg);
  }

  _send(data) {
    console.log(this.connected, "connected");
    if (this.connected) {
      Webiesela.log("sending message", data);
      let serData = JSON.stringify(data);
      this.websocket.send(serData);

      return true;
    }

    throw "Can't send messages when not connected";
  }

  _emit(evt, ...data) {
    let evtName = evt.toLowerCase();
    let listeners = this.listeners[evtName];

    if (listeners) {
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i](...data);
        } catch (e) {
          Webiesela.log("Error while emitting \"" + evt + "\" (", listeners[i], ")\n", e);
        }
      }
      return true;
    }

    throw "Can't emit event \"" + evt + "\"";
  }

  on(evt, listener) {
    let evtName = evt.toLowerCase();
    let listeners = this.listeners[evtName];

    if (listeners) {
      listeners.push(listener);
      return this;
    }

    throw "Can't add a listener to event \"" + evt + "\"";
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

      throw "Can't add a one-time listener to event \"" + evt + "\"";
    });
  }

  waitForAnswer(msg) {
    return new Promise(resolve => {
      // TODO write new uniqueNum gen
      let uid = uniqueNumber();
      msg.id = uid;

      this.waitingForAnswer[uid] = msg => resolve(msg);
      this._send(msg);
    });
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  register() {
    return new Promise(resolve => {
      this._connect().then(() => {

      });
    });
  }

  authorise(token) {
    return new Promise((resolve, reject) => {
      this._connect().then(
        () => {
          this.waitForAnswer({
            request: "authorise"
          }).then(resolve);
        }
      )
    });
  }
}
