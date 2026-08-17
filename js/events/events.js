const Events = (() => {
    const events = new Map();
    const listeners = [];

    let unsubscribe = null;

    function start() {
        if (unsubscribe) {
            return;
        }

        unsubscribe = Firebase.listenEvents({
            onAdded: handleAdded,
            onChanged: handleChanged,
            onRemoved: handleRemoved
        });
    }

    function stop() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        events.clear();
    }

    function getAll() {
        return Array.from(events.values())
            .sort((a, b) => a.targetTime - b.targetTime)
            .map(Event.clone);
    }

    function get(id) {
        validateId(id);

        const event = events.get(id);

        return event ? Event.clone(event) : null;
    }

    function onChanged(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Events change callback must be a function.");
        }

        listeners.push(callback);

        return () => {
            const index = listeners.indexOf(callback);

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }

    async function add(event) {
        Event.validate(event);

        await Firebase.addEvent(event);
    }

    async function update(event) {
        Event.validate(event);

        await Firebase.updateEvent(event);
    }

    async function remove(id) {
        validateId(id);

        await Firebase.deleteEvent(id);
    }

    async function adjustTime(id, milliseconds) {
        validateId(id);
        validateMilliseconds(milliseconds);

        const event = get(id);

        if (!event) {
            return;
        }

        event.targetTime += milliseconds;

        Event.validate(event);

        await update(event);
    }

    function handleAdded(event) {
        try {
            const normalizedEvent = normalizeFirebaseEvent(event);

            events.set(normalizedEvent.id, normalizedEvent);

            notifyChanged();
        } catch (error) {
            ErrorHandler.handle(error, "Adding Firebase event");
        }
    }

    function handleChanged(event) {
        try {
            const normalizedEvent = normalizeFirebaseEvent(event);

            events.set(normalizedEvent.id, normalizedEvent);

            notifyChanged();
        } catch (error) {
            ErrorHandler.handle(error, "Updating Firebase event");
        }
    }

    function handleRemoved(id) {
        try {
            validateId(id);

            events.delete(id);

            notifyChanged();
        } catch (error) {
            ErrorHandler.handle(error, "Removing Firebase event");
        }
    }

    function normalizeFirebaseEvent(event) {
        if (typeof event !== "object" || event === null || Array.isArray(event)) {
            throw new TypeError("Firebase event must be an object.");
        }

        const normalizedEvent = {
            ...event,
            interval: event.interval === undefined ? null : event.interval
        };

        Event.validate(normalizedEvent);

        return Event.clone(normalizedEvent);
    }

    function notifyChanged() {
        const snapshot = getAll();

        listeners.forEach(callback => {
            try {
                callback(snapshot);
            } catch (error) {
                ErrorHandler.handle(error, "Notifying event listener");
            }
        });
    }

    function validateId(id) {
        if (typeof id !== "string" || id === "") {
            throw new TypeError("Event id must be a non-empty string.");
        }
    }

    function validateMilliseconds(milliseconds) {
        if (typeof milliseconds !== "number" || !Number.isFinite(milliseconds)) {
            throw new TypeError("Time adjustment must be a finite number.");
        }
    }

    return {
        start,
        stop,
        getAll,
        get,
        onChanged,
        add,
        update,
        remove,
        adjustTime
    };
})();
