const EventFactory = (() => {
    function create(data) {
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            throw new TypeError("Event data must be an object.");
        }

        if (typeof data.mode !== "string") {
            throw new TypeError("Event mode must be a string.");
        }

        switch (data.mode) {
            case "duration":
                return createFromDuration(data);

            case "target":
                return createFromTarget(data);

            default:
                throw new RangeError(`Unsupported event mode: ${data.mode}`);
        }
    }

    function createFromDuration(data) {
        if (typeof data.duration !== "object" || data.duration === null || Array.isArray(data.duration)) {
            throw new TypeError("Event duration must be an object.");
        }

        const duration = Time.duration(data.duration);
        const targetTime = Timer.now() + duration;

        return Event.create(data.name, roundToSecond(targetTime));
    }

    function createFromTarget(data) {
        if (typeof data.target !== "object" || data.target === null || Array.isArray(data.target)) {
            throw new TypeError("Event target must be an object.");
        }

        const { day, hour, minute } = data.target;

        validateTarget(day, hour, minute);

        const resolvedMinute = minute === null ? 0 : minute;

        const date = new Date();

        date.setDate(date.getDate() + day);
        date.setHours(hour, resolvedMinute, 0, 0);

        const targetTime = date.getTime();
        const minimumTarget = Timer.now() + Time.duration({ minutes: 1 });

        if (targetTime < minimumTarget) {
            throw new RangeError("Target must be at least one minute in the future.");
        }

        return Event.create(data.name, roundToSecond(targetTime));
    }

    function validateTarget(day, hour, minute) {
        if (!Number.isInteger(day)) {
            throw new TypeError("Target day must be an integer.");
        }

        if (day < 0 || day > 6) {
            throw new RangeError("Target day must be between 0 and 6.");
        }

        if (!Number.isInteger(hour)) {
            throw new TypeError("Target hour must be an integer.");
        }

        if (hour < 0 || hour > 23) {
            throw new RangeError("Target hour must be between 0 and 23.");
        }

        if (minute !== null && !Number.isInteger(minute)) {
            throw new TypeError("Target minute must be an integer or null.");
        }

        if (minute !== null && (minute < 0 || minute > 59)) {
            throw new RangeError("Target minute must be between 0 and 59.");
        }
    }

    function roundToSecond(milliseconds) {
        return milliseconds - (milliseconds % 1000);
    }

    return {
        create
    };
})();
