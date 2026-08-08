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

    function onAccept(callback) {
        acceptCallback = callback;
    }

    function open(id) {
        currentId = id;

        clear();

        overlay.hidden = false;
    }

    function close() {
        overlay.hidden = true;
        currentId = null;
    }

    function read() {
        const milliseconds = Time.duration({
            days: Number(inputDays.value) || 0,
            hours: Number(inputHours.value) || 0,
            minutes: Number(inputMinutes.value) || 0
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

        updateMode();
    }

    function notifyAccept() {
        const data = read();

        if (data.milliseconds === 0) {
            return;
        }

        if (acceptCallback) {
            acceptCallback(data);
        }

        close();
    }

    function toggleMode() {
        direction *= -1;

        updateMode();
    }

    function updateMode() {
        btnMode.textContent = direction < 0 ? "+" : "−";
    }

    return {
        start,
        onAccept,
        open,
        close
    };
})();
