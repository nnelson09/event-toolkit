const Timer = (() => {
    let timeoutId = null;
    let intervalId = null;

    const listeners = [];

    function start() {
        if (timeoutId || intervalId) {
            return;
        }

        tick();

        const delay = 1000 - (Date.now() % 1000);

        timeoutId = setTimeout(() => {
            tick();

            intervalId = setInterval(tick, 1000);
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
