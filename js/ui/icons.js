const Icons = (() => {
    const ADD = "add";
    const SUBTRACT = "subtract";
    const DELETE = "delete";
    const ADJUST = "adjust";
    const ACCEPT = "accept";
    const CANCEL = "cancel";
    const UP = "up";
    const DOWN = "down";

    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    const definitions = {
        [ADD]: [
            ["path", { d: "M12 5v14" }],
            ["path", { d: "M5 12h14" }]
        ],

        [SUBTRACT]: [["path", { d: "M5 12h14" }]],

        [DELETE]: [
            ["path", { d: "M4 7h16" }],
            ["path", { d: "M10 11v6" }],
            ["path", { d: "M14 11v6" }],
            ["path", { d: "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" }],
            ["path", { d: "M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" }]
        ],

        [ADJUST]: [
            ["path", { d: "M12 7v5l3 3" }],
            ["path", { d: "M12 21a9 9 0 1 1 8.5-6" }],
            ["path", { d: "M16 19l2-2 3 3-2 2h-3v-3" }]
        ],

        [ACCEPT]: [["path", { d: "M5 12l5 5L20 7" }]],

        [CANCEL]: [
            ["path", { d: "M6 6l12 12" }],
            ["path", { d: "M18 6L6 18" }]
        ],

        [UP]: [["path", { d: "M6 15l6-6 6 6" }]],

        [DOWN]: [["path", { d: "M6 9l6 6 6-6" }]]
    };

    function create(icon) {
        const definition = definitions[icon];

        if (!definition) {
            throw new RangeError(`Unsupported icon: ${icon}`);
        }

        const svg = document.createElementNS(SVG_NAMESPACE, "svg");

        svg.classList.add("icon");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");

        definition.forEach(([tag, attributes]) => {
            const element = document.createElementNS(SVG_NAMESPACE, tag);

            Object.entries(attributes).forEach(([name, value]) => {
                element.setAttribute(name, value);
            });

            svg.appendChild(element);
        });

        return svg;
    }

    return {
        ADD,
        SUBTRACT,
        DELETE,
        ADJUST,
        ACCEPT,
        CANCEL,
        UP,
        DOWN,
        create
    };
})();
