const UITroopDivider = (() => {
    const troops = new Map();

    const NUMBER_LOCALE = "en-GB";
    const COPY_FEEDBACK_DURATION = 700;

    let closeCallback = null;

    let container;
    let btnClose;
    let queueSelect;
    let typeSelect;
    let levelSelect;
    let amountInput;
    let btnAdd;
    let totalFirst;
    let totalOthers;
    let totalOthersLabel;
    let results;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();

        renderTroopLevels(Config.getTroopLevels());

        render();
    }

    function cacheDOM() {
        container = document.getElementById("troopDivider");
        btnClose = document.getElementById("btnTroopDividerClose");
        queueSelect = document.getElementById("troopQueues");
        typeSelect = document.getElementById("troopType");
        levelSelect = document.getElementById("troopLevel");
        amountInput = document.getElementById("troopAmount");
        btnAdd = document.getElementById("btnTroopAdd");
        totalFirst = document.getElementById("troopTotalFirst");
        totalOthers = document.getElementById("troopTotalOthers");
        totalOthersLabel = document.getElementById("troopTotalOthersLabel");
        results = document.getElementById("troopResults");
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);
        btnAdd.addEventListener("click", addTroop);
        queueSelect.addEventListener("change", render);

        amountInput.addEventListener("input", handleAmountInput);

        amountInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                addTroop();
            }
        });

        Config.onTroopLevelsChanged(renderTroopLevels);
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));
        btnAdd.replaceChildren(Icons.create(Icons.ADD));
    }

    function onClose(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Close callback must be a function.");
        }

        closeCallback = callback;
    }

    function open() {
        applyDefaultLevel();

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

    function applyDefaultLevel() {
        const levels = Config.getTroopLevels();

        if (levels.length === 0) {
            levelSelect.value = "";
            return;
        }

        const defaultLevel = Config.getDefaultTroopLevel();

        const defaultExists = levels.some(level => level.value === defaultLevel);

        levelSelect.value = defaultExists ? defaultLevel : levels[0].value;
    }

    function addTroop() {
        const type = readSelectValue(typeSelect);
        const level = readSelectValue(levelSelect);
        const amount = readAmount();

        const validLevel = level !== null;
        const validAmount = amount !== null && Number.isInteger(amount) && amount > 0;

        amountInput.classList.toggle("invalid", !validAmount);

        if (!validLevel || !validAmount) {
            return;
        }

        const key = createKey(type, level);

        troops.set(key, {
            type,
            level,
            amount
        });

        amountInput.value = "";
        amountInput.classList.remove("invalid");

        render();
    }

    function removeTroop(key) {
        troops.delete(key);

        render();
    }

    function renderTroopLevels(levels) {
        const currentValue = readSelectValue(levelSelect);

        levelSelect.replaceChildren();

        levels.forEach(level => {
            const option = document.createElement("option");

            option.value = level.value;
            option.textContent = level.label;

            levelSelect.appendChild(option);
        });

        if (levels.length === 0) {
            return;
        }

        const currentExists = currentValue !== null && levels.some(level => level.value === currentValue);

        levelSelect.value = currentExists ? currentValue : levels[0].value;
    }

    function handleAmountInput() {
        amountInput.classList.remove("invalid");

        const digits = getDigits(amountInput.value);

        if (digits === "") {
            amountInput.value = "";
            return;
        }

        const amount = Number(digits);

        amountInput.value = formatNumber(amount);
    }

    function readAmount() {
        const digits = getDigits(amountInput.value);

        if (digits === "") {
            return null;
        }

        const amount = Number(digits);

        return Number.isFinite(amount) ? amount : null;
    }

    function readSelectValue(select) {
        return select.value === "" ? null : select.value;
    }

    function getDigits(value) {
        return value.replace(/\D/g, "");
    }

    function render() {
        const queues = Number(queueSelect.value);

        results.replaceChildren();

        let firstTotal = 0;
        let othersTotal = 0;

        if (troops.size === 0) {
            renderEmpty();
        } else {
            troops.forEach((troop, key) => {
                const division = TroopDivider.divide(troop.amount, queues);

                firstTotal += division.first;
                othersTotal += division.others;

                results.appendChild(createResult(key, troop, division, queues));
            });
        }

        renderTotals(firstTotal, othersTotal, queues);
    }

    function renderTotals(firstTotal, othersTotal, queues) {
        totalFirst.textContent = formatNumber(firstTotal);

        if (queues > 1) {
            totalOthersLabel.textContent = `Each Q2–Q${queues}`;

            totalOthers.textContent = formatNumber(othersTotal);
        } else {
            totalOthersLabel.textContent = "Other queues";

            totalOthers.textContent = "—";
        }
    }

    function createResult(key, troop, division, queues) {
        const card = document.createElement("div");

        card.className = "troop-result";

        const name = document.createElement("div");

        name.className = "troop-result-name";
        name.textContent = `${formatType(troop.type)} ` + Config.getTroopLevelLabel(troop.level);

        const btnDelete = document.createElement("button");

        btnDelete.type = "button";
        btnDelete.className = "troop-result-delete";
        btnDelete.title = "Delete";

        btnDelete.appendChild(Icons.create(Icons.DELETE));

        btnDelete.addEventListener("click", () => {
            removeTroop(key);
        });

        const values = document.createElement("div");

        values.className = "troop-result-values";

        values.appendChild(createValue("Queue 1", division.first));

        values.appendChild(createValue(queues > 1 ? `Each Q2–Q${queues}` : "Other queues", queues > 1 ? division.others : null));

        card.append(name, btnDelete, values);

        return card;
    }

    function createValue(label, value) {
        const container = document.createElement("div");

        container.className = "troop-result-value";

        const labelElement = document.createElement("span");

        labelElement.className = "troop-result-label";

        labelElement.textContent = label;

        const number = document.createElement("span");

        number.className = "troop-result-number";

        const feedback = document.createElement("span");

        feedback.className = "troop-copy-feedback";

        feedback.textContent = "Copied";

        if (value === null) {
            number.textContent = "—";
        } else {
            number.textContent = formatNumber(value);

            number.title = "Copy";
            number.tabIndex = 0;

            number.addEventListener("click", () => {
                copyResult(number, feedback, value);
            });

            number.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();

                    copyResult(number, feedback, value);
                }
            });
        }

        container.append(labelElement, number, feedback);

        return container;
    }

    async function copyResult(number, feedback, value) {
        const copied = await copyText(String(value));

        if (!copied) {
            return;
        }

        showCopyFeedback(number, feedback);
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);

                return true;
            } catch (error) {
                ErrorHandler.handle(error, "Copying with Clipboard API");
            }
        }

        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        try {
            textarea.select();

            return document.execCommand("copy");
        } catch (error) {
            ErrorHandler.handle(error, "Copying with fallback");

            return false;
        } finally {
            textarea.remove();
        }
    }

    function showCopyFeedback(number, feedback) {
        number.classList.add("copied");
        feedback.classList.add("visible");

        setTimeout(() => {
            number.classList.remove("copied");

            feedback.classList.remove("visible");
        }, COPY_FEEDBACK_DURATION);
    }

    function renderEmpty() {
        const empty = document.createElement("div");

        empty.className = "troop-results-empty";

        empty.textContent = "Add troops to calculate the split.";

        results.appendChild(empty);
    }

    function createKey(type, level) {
        return `${type}:${level}`;
    }

    function formatType(type) {
        switch (type) {
            case "infantry":
                return "Infantry";

            case "cavalry":
                return "Cavalry";

            case "archer":
                return "Archers";

            default:
                throw new RangeError(`Unsupported troop type: ${type}`);
        }
    }

    function formatNumber(value) {
        return value.toLocaleString(NUMBER_LOCALE);
    }

    return {
        start,
        onClose,
        open,
        close
    };
})();
