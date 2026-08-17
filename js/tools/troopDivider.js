const TroopDivider = (() => {
    function divide(amount, queues) {
        validate(amount, queues);

        const base = Math.floor(amount / queues);
        const remainder = amount % queues;

        return {
            first: base + remainder,
            others: queues > 1 ? base : 0
        };
    }

    function validate(amount, queues) {
        if (!Number.isInteger(amount)) {
            throw new TypeError("Troop amount must be an integer.");
        }

        if (amount < 0) {
            throw new RangeError("Troop amount must be non-negative.");
        }

        if (!Number.isInteger(queues)) {
            throw new TypeError("Queue count must be an integer.");
        }

        if (queues < 1 || queues > 6) {
            throw new RangeError("Queue count must be between 1 and 6.");
        }
    }

    return {
        divide
    };
})();
