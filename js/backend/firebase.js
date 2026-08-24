const Firebase = (() => {
    const eventsRef = firebase.database().ref("events");
    const configRef = firebase.database().ref("config");

    const EVENT_ADDED = "child_added";
    const EVENT_CHANGED = "child_changed";
    const EVENT_REMOVED = "child_removed";
    const VALUE = "value";

    function listenEvents(callbacks) {
        const handleAdded = snapshot => {
            callbacks.onAdded?.(snapshot.val());
        };

        const handleChanged = snapshot => {
            callbacks.onChanged?.(snapshot.val());
        };

        const handleRemoved = snapshot => {
            callbacks.onRemoved?.(snapshot.key);
        };

        eventsRef.on(EVENT_ADDED, handleAdded);
        eventsRef.on(EVENT_CHANGED, handleChanged);
        eventsRef.on(EVENT_REMOVED, handleRemoved);

        return () => {
            eventsRef.off(EVENT_ADDED, handleAdded);
            eventsRef.off(EVENT_CHANGED, handleChanged);
            eventsRef.off(EVENT_REMOVED, handleRemoved);
        };
    }

    function listenConfig(path, callback) {
        validateConfigPath(path);

        if (typeof callback !== "function") {
            throw new TypeError("Config callback must be a function.");
        }

        const ref = configRef.child(path);

        const handleValue = snapshot => {
            callback(snapshot.val());
        };

        ref.on(VALUE, handleValue);

        return () => {
            ref.off(VALUE, handleValue);
        };
    }

    async function setConfig(path, value) {
        validateConfigPath(path);

        await configRef.child(path).set(value);
    }

    async function addEvent(event) {
        await eventsRef.child(event.id).set(event);
    }

    async function updateEvent(event) {
        await eventsRef.child(event.id).set(event);
    }

    async function deleteEvent(id) {
        await eventsRef.child(id).remove();
    }

    function validateConfigPath(path) {
        if (typeof path !== "string" || path === "") {
            throw new TypeError("Config path must be a non-empty string.");
        }
    }

    return {
        listenEvents,
        listenConfig,
        setConfig,
        addEvent,
        updateEvent,
        deleteEvent
    };
})();
