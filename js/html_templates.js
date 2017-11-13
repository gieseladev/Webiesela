let HTMLTemplate = (function() {
  let cachedTemplates = {};

  let loadTemplate = function(name) {
    let templateName = name + "_template";

    let template = document.getElementById(templateName);

    if (!template) {
      throw "Couldn't find template " + templateName;
    }

    let cloned = template.cloneNode(true);

    cloned.removeAttribute("id");

    cachedTemplates[name] = cloned;

    return cloned;
  };

  return {
    get: function(name) {
      let template = cachedTemplates[name];

      if (!template) {
        template = loadTemplate(name);
      }

      return template.cloneNode(true);
    },

    build: function(template, options) {
      let element = (typeof template === "string" || template instanceof String) ? this.get(template) : template;

      let keys = Object.keys(options);

      for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = options[key];

        let targets = element.querySelectorAll(key);

        if (targets.length > 0) {
          for (var j = 0; j < targets.length; j++) {
            let target = targets[j];

            if (value) {
              if (typeof value === "function") {
                value(target);
              } else {
                target.innerHTML = value;
              }
            } else {
              target.parentElement.removeChild(target);
            }
          }
        } else {
          console.warn("Couldn't match <" + key + "> in template <" + template + ">");
        }
      }

      return element;
    }
  };
})();
