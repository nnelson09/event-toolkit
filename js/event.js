const Event = (() => {
    function create(name, targetTime, interval = null) {
        return {
            id: crypto.randomUUID(),
            name,
            targetTime,
            interval
        };
    }

    function clone(event) {
        return {
            ...event
        };
    }

    return {
        create,
        clone
    };
})();
