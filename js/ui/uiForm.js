const UIForm = (() => {
    const MODE_DURATION = "duration";
    const MODE_TARGET = "target";

    let mode = null;
    let createCallback = null;
    let transitioning = false;
    let collapseTimer = null;

    let card;
    let btnToggle;
    let btnModeDuration;
    let btnModeTarget;
    let rowDuration;
    let rowTarget;
    let inputName;
    let inputDays;
    let inputHours;
    let inputMinutes;
    let inputSeconds;
    let inputTargetDay;
    let inputTargetHour;
    let inputTargetMinute;
    let btnAdd;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();

        populateTargetDays();
        setMode(MODE_DURATION);
    }

    function cacheDOM() {
        card = document.getElementById("addCard");
        btnToggle = document.getElementById("btnToggle");
        btnModeDuration = document.getElementById("btnModeDur");
        btnModeTarget = document.getElementById("btnModeTarget");
        rowDuration = document.getElementById("rowDuration");
        rowTarget = document.getElementById("rowTarget");
        inputName = document.getElementById("newName");
        inputDays = document.getElementById("newD");
        inputHours = document.getElementById("newH");
        inputMinutes = document.getElementById("newM");
        inputSeconds = document.getElementById("newS");
        inputTargetDay = document.getElementById("targetDay");
        inputTargetHour = document.getElementById("targetHour");
        inputTargetMinute = document.getElementById("targetMinute");
        btnAdd = document.getElementById("btnAdd");
    }

    function bindEvents() {
        btnModeDuration.addEventListener("click", () => {
            setMode(MODE_DURATION);
        });

        btnModeTarget.addEventListener("click", () => {
            setMode(MODE_TARGET);
        });

        btnToggle.addEventListener("click", togglePanel);
        btnAdd.addEventListener("click", notifyCreate);
    }

    function renderIcons() {
        btnAdd.replaceChildren(Icons.create(Icons.ADD));

        updateToggle();
    }

    function onCreate(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Create callback must be a function.");
        }

        createCallback = callback;
    }

    function read() {
        return {
            mode,
            name: inputName.value.trim(),

            duration: {
                days: readDurationNumber(inputDays),
                hours: readDurationNumber(inputHours),
                minutes: readDurationNumber(inputMinutes),
                seconds: readDurationNumber(inputSeconds)
            },

            target: {
                day: readNumber(inputTargetDay),
                hour: readNumber(inputTargetHour),
                minute: readNumber(inputTargetMinute)
            }
        };
    }

    function clear() {
        inputName.value = "";

        clearDuration();
        clearTarget();
    }

    function clearDuration() {
        inputDays.value = "";
        inputHours.value = "";
        inputMinutes.value = "";
        inputSeconds.value = "";
    }

    function clearTarget() {
        inputTargetDay.value = "0";
        inputTargetHour.value = "";
        inputTargetMinute.value = "";
    }

    function reset() {
        clear();
        setMode(MODE_DURATION);

        transitioning = false;

        clearTimeout(collapseTimer);
        collapseTimer = null;

        card.classList.remove("collapsing", "expanding");

        card.classList.add("collapsed", "hidden");

        updateToggle();
        populateTargetDays();
    }

    function getMode() {
        return mode;
    }

    function setMode(newMode) {
        if (newMode !== MODE_DURATION && newMode !== MODE_TARGET) {
            throw new RangeError(`Unsupported form mode: ${newMode}`);
        }

        if (newMode === mode) {
            return;
        }

        if (mode === MODE_DURATION) {
            clearDuration();
        } else if (mode === MODE_TARGET) {
            clearTarget();
        }

        mode = newMode;

        const isDuration = mode === MODE_DURATION;

        rowDuration.style.display = isDuration ? "flex" : "none";

        rowTarget.style.display = isDuration ? "none" : "flex";

        btnModeDuration.classList.toggle("active", isDuration);

        btnModeTarget.classList.toggle("active", !isDuration);
    }

    function notifyCreate() {
        if (createCallback) {
            createCallback(read());
        }
    }

    function populateTargetDays() {
        inputTargetDay.replaceChildren();

        for (let offset = 0; offset < 7; offset++) {
            const option = document.createElement("option");

            option.value = String(offset);
            option.textContent = Time.formatTargetDay(offset);

            inputTargetDay.appendChild(option);
        }
    }

    function togglePanel() {
        if (transitioning) {
            return;
        }

        if (card.classList.contains("collapsed")) {
            expandPanel();
        } else {
            collapsePanel();
        }
    }

    function collapsePanel() {
        transitioning = true;

        card.classList.add("collapsing");

        collapseTimer = setTimeout(() => {
            card.classList.add("collapsed");

            updateToggle();
        }, 180);

        card.addEventListener(
            "animationend",
            () => {
                clearTimeout(collapseTimer);
                collapseTimer = null;

                card.classList.remove("collapsing");
                card.classList.add("collapsed", "hidden");

                transitioning = false;

                updateToggle();
            },
            { once: true }
        );
    }

    function expandPanel() {
        transitioning = true;

        card.classList.remove("hidden");
        card.classList.add("expanding");

        requestAnimationFrame(() => {
            card.classList.remove("collapsed");

            updateToggle();
        });

        card.addEventListener(
            "animationend",
            () => {
                card.classList.remove("expanding");

                transitioning = false;
            },
            { once: true }
        );
    }

    function updateToggle() {
        const collapsed = card.classList.contains("collapsed");

        UIToggle.render(btnToggle, collapsed ? Icons.DOWN : Icons.UP, collapsed ? "Show form" : "Hide form");
    }

    function readDurationNumber(input) {
        if (input.value === "") {
            return 0;
        }

        return parseNumber(input.value);
    }

    function readNumber(input) {
        if (input.value === "") {
            return null;
        }

        return parseNumber(input.value);
    }

    function parseNumber(value) {
        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    return {
        start,
        onCreate,
        read,
        clear,
        reset,
        getMode,
        setMode
    };
})();
