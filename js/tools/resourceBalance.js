const ResourceBalance = (() => {
    const RESOURCES = {
        bread: {
            label: "Bread",
            ratio: 14000000
        },

        wood: {
            label: "Wood",
            ratio: 14000000
        },

        stone: {
            label: "Stone",
            ratio: 2800000
        },

        iron: {
            label: "Iron",
            ratio: 700000
        }
    };

    const SUFFIX_K = 1000;
    const SUFFIX_M = 1000000;

    function calculate(amounts, itemAmounts = {}) {
        validateAmounts(amounts);

        const totals = {};
        const normalized = {};

        Object.entries(RESOURCES).forEach(([resource, config]) => {
            const itemAmount = normalizeOptionalAmount(itemAmounts[resource]);

            totals[resource] = amounts[resource] + itemAmount;

            normalized[resource] = totals[resource] / config.ratio;
        });

        const maxNormalized = Math.max(...Object.values(normalized));

        const results = {};

        Object.entries(RESOURCES).forEach(([resource, config]) => {
            const value = normalized[resource];

            const percentage = maxNormalized === 0 ? 0 : (value / maxNormalized) * 100;

            const missing = maxNormalized === 0 ? 0 : (maxNormalized - value) * config.ratio;

            results[resource] = {
                amount: amounts[resource],
                itemAmount: normalizeOptionalAmount(itemAmounts[resource]),
                total: totals[resource],
                percentage,
                missing
            };
        });

        return results;
    }

    function parseAmount(value) {
        if (typeof value !== "string") {
            throw new TypeError("Resource amount must be a string.");
        }

        const normalizedValue = normalizeAmountInput(value);

        if (normalizedValue === "") {
            return null;
        }

        const match = normalizedValue.match(/^(\d+(?:\.\d+)?)([KM])?$/);

        if (!match) {
            throw new TypeError("Invalid resource amount.");
        }

        const number = Number(match[1]);
        const suffix = match[2] ?? null;

        if (!Number.isFinite(number)) {
            throw new TypeError("Resource amount must be finite.");
        }

        let multiplier = 1;

        if (suffix === "K") {
            multiplier = SUFFIX_K;
        } else if (suffix === "M") {
            multiplier = SUFFIX_M;
        }

        const amount = number * multiplier;

        validateAmount(amount);

        return amount;
    }

    function formatAmount(amount) {
        validateAmount(amount);

        if (amount >= SUFFIX_M) {
            return `${formatCompactNumber(amount / SUFFIX_M)}M`;
        }

        if (amount >= SUFFIX_K) {
            return `${formatCompactNumber(amount / SUFFIX_K)}K`;
        }

        return String(Math.round(amount));
    }

    function formatPercentage(percentage) {
        if (typeof percentage !== "number" || !Number.isFinite(percentage)) {
            throw new TypeError("Percentage must be a finite number.");
        }

        if (percentage < 0 || percentage > 100) {
            throw new RangeError("Percentage must be between 0 and 100.");
        }

        return `${Math.round(percentage)}%`;
    }

    function getResources() {
        return Object.entries(RESOURCES).map(([value, config]) => ({
            value,
            label: config.label,
            ratio: config.ratio
        }));
    }

    function normalizeAmountInput(value) {
        return value.trim().toUpperCase().replace(",", ".");
    }

    function normalizeOptionalAmount(amount) {
        if (amount === null || amount === undefined) {
            return 0;
        }

        validateAmount(amount);

        return amount;
    }

    function formatCompactNumber(value) {
        const rounded = Math.round(value * 100) / 100;

        return String(rounded);
    }

    function validateAmounts(amounts) {
        if (typeof amounts !== "object" || amounts === null || Array.isArray(amounts)) {
            throw new TypeError("Resource amounts must be an object.");
        }

        Object.keys(RESOURCES).forEach(resource => {
            validateAmount(amounts[resource]);
        });
    }

    function validateAmount(amount) {
        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            throw new TypeError("Resource amount must be a finite number.");
        }

        if (amount < 0) {
            throw new RangeError("Resource amount must be non-negative.");
        }
    }

    return {
        calculate,
        parseAmount,
        formatAmount,
        formatPercentage,
        getResources
    };
})();
