const UIEternitysReach = (() => {
    const DURATION = Time.MINUTE;
    const TICK_INTERVAL = 100;

    let running = false;
    let targetTime = null;
    let intervalId = null;
    let closeCallback = null;

    let container;
    let display;
    let btnClose;
    let btnStart;
    let btnReset;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();
        renderTime(DURATION);
        render();
    }

    function cacheDOM() {
        container = document.getElementById("eternitysReach");
        display = document.getElementById("eternitysReachTime");
        btnClose = document.getElementById("btnEternitysReachClose");
        btnStart = document.getElementById("btnEternitysReachStart");
        btnReset = document.getElementById("btnEternitysReachReset");
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);
        btnStart.addEventListener("click", startTimer);
        btnReset.addEventListener("click", reset);
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));
    }

    function onClose(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Close callback must be a function.");
        }

        closeCallback = callback;
    }

    function open() {
        container.hidden = false;
    }

    function close() {
        if (container.hidden) {
            return;
        }

        container.hidden = true;

        if (closeCallback) {
            closeCallback();
        }
    }

    function startTimer() {
        if (running) {
            return;
        }

        running = true;
        targetTime = Date.now() + DURATION;

        clearInterval(intervalId);

        intervalId = setInterval(update, TICK_INTERVAL);

        update();
        render();
    }

    function update() {
        if (!running) {
            return;
        }

        const remaining = Math.max(0, targetTime - Date.now());

        renderTime(remaining);

        if (remaining <= 0) {
            finish();
        }
    }

    function finish() {
        clearInterval(intervalId);

        intervalId = null;
        targetTime = null;
        running = false;

        renderTime(0);
        render();
    }

    function reset() {
        clearInterval(intervalId);

        intervalId = null;
        targetTime = null;
        running = false;

        renderTime(DURATION);
        render();
    }

    function render() {
        btnStart.disabled = running;
    }

    function renderTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / Time.SECOND);

        const minutes = Math.floor(totalSeconds / 60);

        const seconds = totalSeconds % 60;

        display.textContent = `${pad(minutes)}:${pad(seconds)}`;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    return {
        start,
        onClose,
        open,
        close,
        reset
    };
})();
