const Time = (() => {
    const LOCALE = "es-AR";

    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    const SECONDS_PER_MINUTE = 60;
    const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
    const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

    function remaining(targetTime) {
        return targetTime - Timer.now();
    }

    function isExpired(targetTime) {
        return remaining(targetTime) <= 0;
    }

    function duration({ days = 0, hours = 0, minutes = 0, seconds = 0 }) {
        return days * DAY + hours * HOUR + minutes * MINUTE + seconds * SECOND;
    }

    function parts(milliseconds) {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / SECOND));

        return {
            days: Math.floor(totalSeconds / SECONDS_PER_DAY),
            hours: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
            minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
            seconds: totalSeconds % SECONDS_PER_MINUTE
        };
    }

    function format(milliseconds, format = "clock") {
        const { days, hours, minutes, seconds } = parts(milliseconds);

        switch (format) {
            case "clock":
                return days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

            default:
                throw new Error(`Formato no soportado: ${format}`);
        }
    }

    function formatTarget(targetTime) {
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
        if (offset === 0) {
            return "Hoy";
        }

        if (offset === 1) {
            return "Mañana";
        }

        const date = new Date();

        date.setDate(date.getDate() + offset);

        const weekday = new Intl.DateTimeFormat(LOCALE, {
            weekday: "short"
        })
            .format(date)
            .replace(".", "");

        return `${capitalize(weekday)} ${date.getDate()}`;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function capitalize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    return {
        remaining,
        isExpired,
        duration,
        parts,
        format,
        formatTarget,
        formatTargetDay
    };
})();
