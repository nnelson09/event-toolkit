const EventFactory = (() => {
    function create(data) {
        switch (data.mode) {
            case "duration":
                return createFromDuration(data);

            case "target":
                return createFromTarget(data);

            default:
                throw new Error(`Modo no soportado: ${data.mode}`);
        }
    }

    function createFromDuration(data) {
        const milliseconds = Time.duration(data.duration);
        const targetTime = Timer.now() + milliseconds;

        return Event.create(data.name, normalizeTargetTime(targetTime));
    }

    function createFromTarget(data) {
        const { day, hour, minute } = data.target;

        validateTarget(day, hour, minute);

        const targetDate = new Date();

        targetDate.setDate(targetDate.getDate() + day);
        targetDate.setHours(hour, minute, 0, 0);

        const targetTime = targetDate.getTime();
        const minimumTargetTime = Timer.now() + Time.duration({ minutes: 1 });

        if (targetTime < minimumTargetTime) {
            throw new Error("El objetivo debe estar al menos un minuto en el futuro.");
        }

        return Event.create(data.name, normalizeTargetTime(targetTime));
    }

    function validateTarget(day, hour, minute) {
        if (!Number.isInteger(day) || day < 0 || day > 6) {
            throw new Error("Día objetivo inválido.");
        }

        if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
            throw new Error("Hora objetivo inválida.");
        }

        if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
            throw new Error("Minuto objetivo inválido.");
        }
    }

    function normalizeTargetTime(targetTime) {
        return targetTime - (targetTime % 1000);
    }

    return {
        create
    };
})();
