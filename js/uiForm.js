const UIForm = (() => {
    let mode = null;
    let createCallback = null;

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

        populateTargetDays();
        setMode("duration");
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
            setMode("duration");
        });

        btnModeTarget.addEventListener("click", () => {
            setMode("target");
        });

        btnToggle.addEventListener("click", togglePanel);
        btnAdd.addEventListener("click", notifyCreate);
    }

    function onCreate(callback) {
        createCallback = callback;
    }

    function read() {
        return {
            mode,
            name: inputName.value.trim(),
            duration: {
                days: Number(inputDays.value) || 0,
                hours: Number(inputHours.value) || 0,
                minutes: Number(inputMinutes.value) || 0,
                seconds: Number(inputSeconds.value) || 0
            },
            target: {
                day: Number(inputTargetDay.value),
                hour: readRequiredNumber(inputTargetHour),
                minute: readRequiredNumber(inputTargetMinute)
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
        setMode("duration");

        card.classList.remove("collapsed");
        btnToggle.textContent = "▲ Ocultar";

        populateTargetDays();
    }

    function getMode() {
        return mode;
    }

    function setMode(newMode) {
        if (newMode === mode) {
            return;
        }

        if (mode === "duration") {
            clearDuration();
        } else if (mode === "target") {
            clearTarget();
        }

        mode = newMode;

        const isDuration = mode === "duration";

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
        const collapsed = card.classList.toggle("collapsed");

        btnToggle.textContent = collapsed ? "▼ Mostrar" : "▲ Ocultar";
    }

    function readRequiredNumber(input) {
        return input.value === "" ? null : Number(input.value);
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
