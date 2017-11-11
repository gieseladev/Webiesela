let HTMLTemplate = (function() {
  let cachedTemplates = {};

  let loadTemplate = function(name) {
    let templateName = name + "_template";

    let template = document.getElementById(templateName);

    if (!template) {
      throw "Couldn't find template " +  templateName;
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
  };
})();
