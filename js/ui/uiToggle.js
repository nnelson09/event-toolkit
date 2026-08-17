const UIToggle = (() => {
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    function render(button, icon, title) {
        if (!(button instanceof HTMLElement)) {
            throw new TypeError("Toggle button must be an HTML element.");
        }

        if (typeof title !== "string") {
            throw new TypeError("Toggle title must be a string.");
        }

        const shape = createShape();
        const iconElement = Icons.create(icon);

        iconElement.classList.add("toggle-tab-icon");

        button.replaceChildren(shape, iconElement);
        button.title = title;
    }

    function createShape() {
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");

        svg.classList.add("toggle-tab-shape");
        svg.setAttribute("viewBox", "0 0 80 20");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");

        const fill = document.createElementNS(SVG_NAMESPACE, "path");

        fill.classList.add("toggle-tab-shape-fill");
        fill.setAttribute("d", "M0 0 H80 C66 0 61 1 56 5 C51 9 51 15 45 18 C42 19.5 38 19.5 35 18 C29 15 29 9 24 5 C19 1 14 0 0 0 Z");

        const border = document.createElementNS(SVG_NAMESPACE, "path");

        border.classList.add("toggle-tab-shape-border");
        border.setAttribute("d", "M0 0 C14 0 19 1 24 5 C29 9 29 15 35 18 C38 19.5 42 19.5 45 18 C51 15 51 9 56 5 C61 1 66 0 80 0");

        svg.append(fill, border);

        return svg;
    }

    return {
        render
    };
})();
