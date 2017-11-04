class NotificationBar {
  constructor() {
    this.elem = document.getElementById("notification_bar");
    this.notificationText = this.elem.getElementsByClassName("text")[0];
    this.notificationClose = this.elem.getElementsByClassName("close_notification")[0];

    this.notificationClose.addEventListener("click", function(that) {
      return function() {
        that.hide();
      };
    }(this));
  }

  hide() {
    "use strict";

    this.elem.style.transform = "translateY(-100%)";
  }

  show(text, closeDelay) {
    "use strict";

    this.notificationText.innerHTML = text;

    this.elem.style.transform = "translateY(-0%)";

    if (closeDelay) {
      let that = this;

      setTimeout(function() {
        that.hide();
      }, closeDelay);
    }
  }
}
