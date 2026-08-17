const Event = {
    create(name, targetTime, interval = null) {
        validateData(name, targetTime, interval);

        return {
            id: crypto.randomUUID(),
            name,
            targetTime,
            interval
        };
    },

    clone(event) {
        validate(event);

        return { ...event };
    },

    validate(event) {
        validate(event);

        return true;
    }
};

function validate(event) {
    if (typeof event !== "object" || event === null || Array.isArray(event)) {
        throw new TypeError("Event must be an object.");
    }

    if (typeof event.id !== "string" || event.id === "") {
        throw new TypeError("Event id must be a non-empty string.");
    }

    validateData(event.name, event.targetTime, event.interval);
}

function validateData(name, targetTime, interval) {
    if (typeof name !== "string") {
        throw new TypeError("Event name must be a string.");
    }

    if (typeof targetTime !== "number" || !Number.isFinite(targetTime)) {
        throw new TypeError("Event target time must be a finite number.");
    }

    if (interval !== null && (typeof interval !== "number" || !Number.isFinite(interval) || interval <= 0)) {
        throw new TypeError("Event interval must be a positive finite number or null.");
    }
}
