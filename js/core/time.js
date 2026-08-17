const Time = (() => {
    const LOCALE = "en-GB";

    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    function remaining(targetTime) {
        validateFiniteNumber(targetTime, "Target time");

        return targetTime - Timer.now();
    }

    function isExpired(targetTime) {
        return remaining(targetTime) <= 0;
    }

    function duration({ days = 0, hours = 0, minutes = 0, seconds = 0 } = {}) {
        validateDurationPart(days, "Days");
        validateDurationPart(hours, "Hours");
        validateDurationPart(minutes, "Minutes");
        validateDurationPart(seconds, "Seconds");

        return days * DAY + hours * HOUR + minutes * MINUTE + seconds * SECOND;
    }

    function parts(milliseconds) {
        validateFiniteNumber(milliseconds, "Milliseconds");

        const time = Math.max(0, milliseconds);

        return {
            days: Math.floor(time / DAY),
            hours: Math.floor((time % DAY) / HOUR),
            minutes: Math.floor((time % HOUR) / MINUTE),
            seconds: Math.floor((time % MINUTE) / SECOND)
        };
    }

    function format(milliseconds, mode = "clock") {
        if (typeof mode !== "string") {
            throw new TypeError("Format mode must be a string.");
        }

        const { days, hours, minutes, seconds } = parts(milliseconds);

        if (mode === "clock") {
            return days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }

        throw new Error(`Unsupported format: ${mode}`);
    }

    function formatTarget(targetTime) {
        validateFiniteNumber(targetTime, "Target time");

        const date = new Date(targetTime);
        const currentYear = new Date().getFullYear();

        const options = {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        };

        if (date.getFullYear() !== currentYear) {
            options.year = "numeric";
        }

        return new Intl.DateTimeFormat(LOCALE, options).format(date);
    }

    function formatTargetDay(offset) {
        if (!Number.isInteger(offset) || offset < 0) {
            throw new TypeError("Target day offset must be a non-negative integer.");
        }

        if (offset === 0) {
            return "Today";
        }

        if (offset === 1) {
            return "Tomorrow";
        }

        const date = new Date();

        date.setDate(date.getDate() + offset);

        const weekday = new Intl.DateTimeFormat(LOCALE, {
            weekday: "short"
        }).format(date);

        const month = new Intl.DateTimeFormat(LOCALE, {
            month: "short"
        }).format(date);

        return `${weekday} ${date.getDate()} ${month}`;
    }

    function validateDurationPart(value, name) {
        if (!Number.isInteger(value) || value < 0) {
            throw new TypeError(`${name} must be a non-negative integer.`);
        }
    }

    function validateFiniteNumber(value, name) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new TypeError(`${name} must be a finite number.`);
        }
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    return {
        SECOND,
        MINUTE,
        HOUR,
        DAY,
        remaining,
        isExpired,
        duration,
        parts,
        format,
        formatTarget,
        formatTargetDay
    };
})();
