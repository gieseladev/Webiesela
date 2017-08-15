var contextMenus = {};

function getContextMenu(menuSelector, itemClass, onMenuClick) {
  "use strict";

  var existingContext = contextMenus[itemClass];

  if (existingContext) {
    existingContext.menu = document.querySelector(menuSelector);
    existingContext.onMenuClick = onMenuClick;
  } else {
    contextMenus[itemClass] = new newContextMenu(menuSelector, itemClass);
  }
}

function newContextMenu(menuSelector, itemClass, onMenuClick) {
  "use strict";

  /**
   * Function to check if we clicked inside an element with a particular class
   * name.
   *
   * @param {Object} e The event
   * @param {String} className The class name to check against
   * @return {Boolean}
   */
  this.clickInsideElement = function(e, className) {
    var el = e.srcElement || e.target;

    if (el.classList.contains(className)) {
      return el;
    } else {
      while (el = el.parentNode) {
        if (el.classList && el.classList.contains(className)) {
          return el;
        }
      }
    }

    return false;
  }

  /**
   * Get's exact position of event.
   *
   * @param {Object} e The event passed in
   * @return {Object} Returns the x and y position
   */
  this.getPosition = function(e) {
    var posx = 0;
    var posy = 0;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    } else if (e.detail) {
      posx = e.detail.posX;
      posy = e.detail.posY;
    }

    return {
      x: posx,
      y: posy
    }
  }

  /**
   * Variables.
   */
  this.contextMenuClassName = "context-menu";
  this.contextMenuItemClassName = "context-menu__item";
  this.contextMenuLinkClassName = "context-menu__link";
  this.contextMenuActive = "context-menu--active";

  this.taskItemClassName = itemClass;
  this.taskItemInContext;

  this.onMenuClick = onMenuClick;

  this.clickCoords;
  this.clickCoordsX;
  this.clickCoordsY;

  this.menu = document.querySelector(menuSelector);
  this.menuItems = this.menu.querySelectorAll(".context-menu__item");
  this.menuState = 0;
  this.menuWidth;
  this.menuHeight;
  this.menuPosition;
  this.menuPositionX;
  this.menuPositionY;

  this.windowWidth;
  this.windowHeight;

  /**
   * Initialise our application's code.
   */
  this.init = function() {
    contextListener(this);
    clickListener(this);
    keyupListener(this);
    resizeListener(this);
    scrollListener(this);
  }

  /**
   * Listens for contextmenu events.
   */
  function contextListener(that) {
    var contextFunc = function(e) {
      that.taskItemInContext = that.clickInsideElement(e, that.taskItemClassName);

      if (that.taskItemInContext) {
        e.preventDefault();
        that.toggleMenuOn();
        that.positionMenu(e);
      } else {
        that.taskItemInContext = null;
        that.toggleMenuOff();
      }
    };

    document.addEventListener("contextmenu", contextFunc);
    document.addEventListener("openContextMenu", contextFunc, true);
  }

  /**
   * Listens for click events.
   */
  function clickListener(that) {
    document.addEventListener("click", function(e) {
      var clickeElIsLink = that.clickInsideElement(e, that.contextMenuLinkClassName);

      if (clickeElIsLink) {
        e.preventDefault();
        that.menuItemListener(clickeElIsLink);
      } else {
        var button = e.which || e.button;
        if (button === 1) {
          that.toggleMenuOff();
        }
      }
    }, true);
  }

  /**
   * Listens for scroll events.
   */
  function scrollListener(that) {
    window.addEventListener("scroll", function(e) {
      that.toggleMenuOff();
    }, true);
  }

  /**
   * Listens for keyup events.
   */
  function keyupListener(that) {
    window.onkeyup = function(e) {
      if (e.keyCode === 27) {
        that.toggleMenuOff();
      }
    }
  }

  /**
   * Window resize event listener
   */
  function resizeListener(that) {
    window.onresize = function(e) {
      that.toggleMenuOff();
    };
  }

  /**
   * Turns the custom context menu on.
   */
  this.toggleMenuOn = function() {
    if (this.menuState !== 1) {
      this.menuState = 1;
      this.menu.classList.add(this.contextMenuActive);
    }
  }

  /**
   * Turns the custom context menu off.
   */
  this.toggleMenuOff = function() {
    if (this.menuState !== 0) {
      this.menuState = 0;
      this.menu.classList.remove(this.contextMenuActive);
    }
  }

  /**
   * Positions the menu properly.
   *
   * @param {Object} e The event
   */
  this.positionMenu = function(e) {
    this.clickCoords = this.getPosition(e);
    this.clickCoordsX = this.clickCoords.x;
    this.clickCoordsY = this.clickCoords.y;

    this.menuWidth = this.menu.offsetWidth + 4;
    this.menuHeight = this.menu.offsetHeight + 4;

    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    if ((this.windowWidth - this.clickCoordsX) < this.menuWidth) {
      this.menu.style.left = this.windowWidth - this.menuWidth + "px";
    } else {
      this.menu.style.left = this.clickCoordsX + "px";
    }

    if ((this.windowHeight - this.clickCoordsY) < this.menuHeight) {
      this.menu.style.top = this.windowHeight - this.menuHeight + "px";
    } else {
      this.menu.style.top = this.clickCoordsY + "px";
    }
  }

  /**
   * Dummy action function that logs an action when a menu item link is clicked
   *
   * @param {HTMLElement} link The link that was clicked
   */
  this.menuItemListener = function(link) {
    this.onMenuClick(this.taskItemInContext.getAttribute("data-id"), link.getAttribute("data-action"));
    this.toggleMenuOff();
  }

  /**
   * Run the app.
   */
  this.init();
  return this;
}
