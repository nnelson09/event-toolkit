const Icons = (() => {
    const ADD = "add";
    const SUBTRACT = "subtract";
    const DELETE = "delete";
    const ADJUST = "adjust";
    const EDIT = "edit";
    const SETTINGS = "settings";
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

        [EDIT]: [
            ["path", { d: "M12 20h9" }],
            ["path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" }]
        ],

        [SETTINGS]: [
            ["circle", { cx: "12", cy: "12", r: "3" }],
            [
                "path",
                {
                    d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20h-3v-.09a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15.4a1.7 1.7 0 0 0-1.55-1.03H5v-3h.09A1.7 1.7 0 0 0 6.64 10.3a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.3 6.64 1.7 1.7 0 0 0 11.33 5.1V5h3v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03H20v3h-.09A1.7 1.7 0 0 0 18.36 15.4z"
                }
            ]
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
        EDIT,
        SETTINGS,
        ACCEPT,
        CANCEL,
        UP,
        DOWN,
        create
    };
})();
