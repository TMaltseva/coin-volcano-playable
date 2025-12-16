export const DOMUtils = {
  createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = options.className;
    }

    if (options.textContent !== undefined) {
      element.textContent = options.textContent;
    }

    if (options.src) {
      element.src = options.src;
    }

    if (options.alt) {
      element.alt = options.alt;
    }

    if (options.id) {
      element.id = options.id;
    }

    if (options.style) {
      if (typeof options.style === "string") {
        element.style.cssText = options.style;
      } else {
        Object.assign(element.style, options.style);
      }
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.children) {
      options.children.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }

    return element;
  },

  createImage(options = {}) {
    return this.createElement("img", {
      ...options,
      src: options.src || "",
      alt: options.alt || "",
    });
  },

  createTextElement(tag, text, className = "") {
    return this.createElement(tag, {
      className,
      textContent: text,
    });
  },
};
