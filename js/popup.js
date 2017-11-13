class PopupManager {
  constructor() {
    this.openPrompt = null
    this.queue = [];
  }

  closed() {
    this.openPrompt = null;

    if (this.queue.length > 0) {
      this.showNext();
    }
  }

  showNext() {
    console.log("[PopupManager] Showing next Pop-up");
    let next = this.queue.splice(0, 1)[0];

    this.openPrompt = next;

    let nextFunc = () => this.closed();

    next.activate().then(nextFunc);
  }

  add(prompt) {
    this.queue.push(prompt);

    if (this.openPrompt === null) {
      this.showNext();
    }
  }
}

let popupManager = new PopupManager();


class PromptResponse {
  constructor(prompt) {
    this.prompt = prompt;
    this.state = prompt.state;
  }
}

class Prompt {
  constructor() {
    this.toResolve = [];
    this.state = null;
    this.response = null;

    this.resolved = false;
  }

  show() {
    close();
  }

  hide() {}

  waitForResolve(listener) {
    this.toResolve.push(listener);

    if (this.resolved) {
      listener(this.response);
    }
  }

  activate() {
    return new Promise(resolve => {
      this.waitForResolve(resolve);
      this.show();
    });
  }

  result() {
    return new Promise(resolve => {
      this.waitForResolve(resolve);
    });
  }

  close() {
    this.hide();

    this.response = this.response || new PromptResponse(this);
    this.resolved = true;

    for (var i = 0; i < this.toResolve.length; i++) {
      this.toResolve[i](this.response);
    }
  }
}


class PromptTrueFalse extends Prompt {
  constructor(text, trueOption, falseOption) {
    super();
    this.text = text;
    this.trueOption = trueOption || "yes";
    this.falseOption = falseOption || "no";

    this.dom = document.getElementById("tf-prompt");
  }

  show() {
    let textEl = this.dom.getElementsByClassName("question")[0];
    let trueEl = this.dom.getElementsByClassName("true")[0];
    let falseEl = this.dom.getElementsByClassName("false")[0];
    let cancelEl = this.dom.getElementsByClassName("cancel")[0];

    textEl.innerHTML = this.text;
    trueEl.innerHTML = this.trueOption;
    falseEl.innerHTML = this.falseOption;

    trueEl.onclick = () => this.trueClick();
    falseEl.onclick = () => this.falseClick();
    cancelEl.onclick = () => this.cancelClick();

    this.dom.style.display = "";
  }

  whenTrue() {
    return new Promise((resolve, reject) => {
      this.result().then(response => {
        if (response.state) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  hide() {
    this.dom.style.display = "none";
  }

  trueClick() {
    this.state = true;
    this.close();
  }

  falseClick() {
    this.state = false;
    this.close();
  }

  cancelClick() {
    this.state = null;
    this.close();
  }
}
