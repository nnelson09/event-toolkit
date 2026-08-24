const UIResourceBalance = (() => {
    const currentInputs = new Map();
    const itemInputs = new Map();
    const results = new Map();

    let closeCallback = null;

    let container;
    let btnClose;
    let btnClear;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();
        clearResults();
    }

    function cacheDOM() {
        container = document.getElementById("resourceBalance");

        btnClose = document.getElementById("btnResourceBalanceClose");
        btnClear = document.getElementById("btnResourceBalanceClear");

        ResourceBalance.getResources().forEach(resource => {
            currentInputs.set(resource.value, document.getElementById(`resourceBalance-${resource.value}`));

            itemInputs.set(resource.value, document.getElementById(`resourceBalance-${resource.value}-items`));

            results.set(resource.value, {
                percentage: document.getElementById(`resourceBalance-${resource.value}-percentage`),

                missing: document.getElementById(`resourceBalance-${resource.value}-missing`),

                row: document.getElementById(`resourceBalance-${resource.value}-result`)
            });
        });
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);
        btnClear.addEventListener("click", clear);

        bindInputs(currentInputs);
        bindInputs(itemInputs);
    }

    function bindInputs(inputs) {
        inputs.forEach(input => {
            input.addEventListener("input", handleInput);

            input.addEventListener("blur", () => {
                normalizeInput(input);
                calculate();
            });
        });
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));
        btnClear.replaceChildren(Icons.create(Icons.DELETE));
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

    function calculate() {
        const amounts = readCurrentAmounts();

        if (amounts === null) {
            clearResults();
            return;
        }

        const items = readItemAmounts();

        if (items === null) {
            clearResults();
            return;
        }

        try {
            const balance = ResourceBalance.calculate(amounts, items);

            renderResults(balance);
        } catch (error) {
            ErrorHandler.handle(error, "Calculating resource balance");
        }
    }

    function readCurrentAmounts() {
        const amounts = {};

        for (const [resource, input] of currentInputs) {
            if (input.value.trim() === "") {
                return null;
            }

            try {
                const amount = ResourceBalance.parseAmount(input.value);

                if (amount === null) {
                    return null;
                }

                amounts[resource] = amount;
            } catch {
                return null;
            }
        }

        return amounts;
    }

    function readItemAmounts() {
        const amounts = {};

        for (const [resource, input] of itemInputs) {
            if (input.value.trim() === "") {
                amounts[resource] = null;
                continue;
            }

            try {
                amounts[resource] = ResourceBalance.parseAmount(input.value);
            } catch {
                return null;
            }
        }

        return amounts;
    }

    function normalizeInput(input) {
        if (input.value.trim() === "") {
            input.classList.remove("invalid");
            return;
        }

        try {
            const amount = ResourceBalance.parseAmount(input.value);

            input.value = ResourceBalance.formatAmount(amount);

            input.classList.remove("invalid");
        } catch (error) {
            input.classList.add("invalid");

            ErrorHandler.handle(error, "Normalizing resource amount");
        }
    }

    function handleInput(event) {
        validateInput(event.target);
        calculate();
    }

    function validateInput(input) {
        if (input.value.trim() === "") {
            input.classList.remove("invalid");
            return;
        }

        try {
            ResourceBalance.parseAmount(input.value);

            input.classList.remove("invalid");
        } catch {
            input.classList.add("invalid");
        }
    }

    function renderResults(balance) {
        const percentages = Object.values(balance).map(result => result.percentage);

        const minimumPercentage = Math.min(...percentages);

        Object.entries(balance).forEach(([resource, result]) => {
            const elements = results.get(resource);

            elements.percentage.textContent = ResourceBalance.formatPercentage(result.percentage);

            elements.missing.textContent = result.missing === 0 ? "—" : `+${ResourceBalance.formatAmount(result.missing)}`;

            const isPriority = minimumPercentage < 100 && result.percentage === minimumPercentage;

            elements.row.classList.toggle("priority", isPriority);
        });
    }

    function clear() {
        currentInputs.forEach(input => {
            input.value = "";
            input.classList.remove("invalid");
        });

        itemInputs.forEach(input => {
            input.value = "";
            input.classList.remove("invalid");
        });

        clearResults();
    }

    function clearResults() {
        results.forEach(elements => {
            elements.percentage.textContent = "—";
            elements.missing.textContent = "—";

            elements.row.classList.remove("priority");
        });
    }

    return {
        start,
        onClose,
        open,
        close,
        clear
    };
})();
