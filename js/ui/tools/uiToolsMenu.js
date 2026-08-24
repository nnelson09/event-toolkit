const UIToolsMenu = (() => {
    let open = false;

    let troopDividerCallback = null;
    let eternitysReachCallback = null;
    let resourceBalanceCallback = null;

    let menu;
    let btnToggle;
    let btnTroopDivider;
    let btnEternitysReach;
    let btnResourceBalance;

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

        btnResourceBalance = document.getElementById("btnResourceBalance");
    }

    function bindEvents() {
        btnToggle.addEventListener("click", toggle);

        btnTroopDivider.addEventListener("click", () => {
            selectTool(troopDividerCallback);
        });

        btnEternitysReach.addEventListener("click", () => {
            selectTool(eternitysReachCallback);
        });

        btnResourceBalance.addEventListener("click", () => {
            selectTool(resourceBalanceCallback);
        });

        document.addEventListener("click", handleOutsideClick);
    }

    function onTroopDivider(callback) {
        validateCallback(callback, "Troop Divider");

        troopDividerCallback = callback;
    }

    function onEternitysReach(callback) {
        validateCallback(callback, "Eternity's Reach");

        eternitysReachCallback = callback;
    }

    function onResourceBalance(callback) {
        validateCallback(callback, "Resource Balance");

        resourceBalanceCallback = callback;
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

    function validateCallback(callback, name) {
        if (typeof callback !== "function") {
            throw new TypeError(`${name} callback must be a function.`);
        }
    }

    return {
        start,
        onTroopDivider,
        onEternitysReach,
        onResourceBalance,
        close
    };
})();
