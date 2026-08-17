const UIToolsMenu = (() => {
    let open = false;
    let troopDividerCallback = null;
    let eternitysReachCallback = null;

    let menu;
    let btnToggle;
    let btnTroopDivider;
    let btnEternitysReach;

    function start() {
        cacheDOM();
        bindEvents();
        render();
    }

    function cacheDOM() {
        menu = document.getElementById("toolsMenu");
        btnToggle = document.getElementById("btnToolsMenu");
        btnTroopDivider = document.getElementById("btnTroopDivider");
        btnEternitysReach = document.getElementById("btnEternitysReach");
    }

    function bindEvents() {
        btnToggle.addEventListener("click", toggle);

        btnTroopDivider.addEventListener("click", () => {
            selectTool(troopDividerCallback);
        });

        btnEternitysReach.addEventListener("click", () => {
            selectTool(eternitysReachCallback);
        });

        document.addEventListener("click", handleOutsideClick);
    }

    function onTroopDivider(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Troop Divider callback must be a function.");
        }

        troopDividerCallback = callback;
    }

    function onEternitysReach(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Eternity's Reach callback must be a function.");
        }

        eternitysReachCallback = callback;
    }

    function toggle(event) {
        event.stopPropagation();

        open = !open;

        render();
    }

    function selectTool(callback) {
        close();

        callback();
    }

    function handleOutsideClick(event) {
        if (!open) {
            return;
        }

        if (menu.contains(event.target) || btnToggle.contains(event.target)) {
            return;
        }

        close();
    }

    function close() {
        if (!open) {
            return;
        }

        open = false;

        render();
    }

    function render() {
        menu.hidden = !open;

        btnToggle.setAttribute("aria-expanded", String(open));

        UIToggle.render(btnToggle, open ? Icons.DOWN : Icons.UP, open ? "Hide tools" : "Show tools");
    }

    return {
        start,
        onTroopDivider,
        onEternitysReach,
        close
    };
})();
