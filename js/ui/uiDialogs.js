const UIDialogs = (() => {
    let currentId = null;
    let direction = -1;
    let acceptCallback = null;

    let overlay;
    let btnMode;
    let btnCancel;
    let btnAccept;
    let inputDays;
    let inputHours;
    let inputMinutes;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();
    }

    function cacheDOM() {
        overlay = document.getElementById("adjustDialog");
        btnMode = document.getElementById("btnAdjustMode");
        btnCancel = document.getElementById("btnAdjustCancel");
        btnAccept = document.getElementById("btnAdjustAccept");
        inputDays = document.getElementById("adjustDays");
        inputHours = document.getElementById("adjustHours");
        inputMinutes = document.getElementById("adjustMinutes");
    }

    function bindEvents() {
        btnMode.addEventListener("click", toggleMode);
        btnCancel.addEventListener("click", close);
        btnAccept.addEventListener("click", notifyAccept);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                close();
            }
        });
    }

    function renderIcons() {
        btnCancel.replaceChildren(Icons.create(Icons.CANCEL));

        btnAccept.replaceChildren(Icons.create(Icons.ACCEPT));

        updateModeIcon();
    }

    function onAccept(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Accept callback must be a function.");
        }

        acceptCallback = callback;
    }

    function open(id) {
        if (typeof id !== "string" || id === "") {
            throw new TypeError("Event id must be a non-empty string.");
        }

        currentId = id;

        clear();

        overlay.hidden = false;
    }

    function close() {
        overlay.hidden = true;
        currentId = null;
    }

    function read() {
        const days = readDurationNumber(inputDays);
        const hours = readDurationNumber(inputHours);
        const minutes = readDurationNumber(inputMinutes);

        if (days === null || hours === null || minutes === null) {
            return null;
        }

        const milliseconds = Time.duration({
            days,
            hours,
            minutes
        });

        return {
            id: currentId,
            milliseconds: milliseconds * direction
        };
    }

    function clear() {
        inputDays.value = "";
        inputHours.value = "";
        inputMinutes.value = "";

        direction = -1;

        updateModeIcon();
    }

    function notifyAccept() {
        const data = read();

        if (data === null || data.id === null || data.milliseconds === 0) {
            return;
        }

        if (acceptCallback) {
            acceptCallback(data);
        }

        close();
    }

    function toggleMode() {
        direction *= -1;

        updateModeIcon();
    }

    function updateModeIcon() {
        const icon = direction < 0 ? Icons.ADD : Icons.SUBTRACT;

        btnMode.replaceChildren(Icons.create(icon));

        btnMode.title = direction < 0 ? "Switch to add" : "Switch to subtract";
    }

    function readDurationNumber(input) {
        if (input.value === "") {
            return 0;
        }

        const value = Number(input.value);

        return Number.isFinite(value) ? value : null;
    }

    return {
        start,
        onAccept,
        open,
        close
    };
})();
