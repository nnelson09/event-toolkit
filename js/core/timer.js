const Timer = (() => {
    const TICK_INTERVAL = 1000;

    const listeners = [];

    let timeoutId = null;
    let intervalId = null;

    function start() {
        if (timeoutId || intervalId) {
            return;
        }

        tick();

        const delay = TICK_INTERVAL - (Date.now() % TICK_INTERVAL);

        timeoutId = setTimeout(() => {
            tick();

            intervalId = setInterval(tick, TICK_INTERVAL);
            timeoutId = null;
        }, delay);
    }

    function stop() {
        clearTimeout(timeoutId);
        clearInterval(intervalId);

        timeoutId = null;
        intervalId = null;
    }

    function now() {
        return Date.now();
    }

    function onTick(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Tick callback must be a function.");
        }

        listeners.push(callback);

        return () => {
            const index = listeners.indexOf(callback);

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }

    function tick() {
        const currentTime = now();

        listeners.forEach(callback => {
            callback(currentTime);
        });
    }

    return {
        start,
        stop,
        now,
        onTick
    };
})();
