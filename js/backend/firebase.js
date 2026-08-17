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
        const ref = configRef.child(path);

        const handleValue = snapshot => {
            callback(snapshot.val());
        };

        ref.on(VALUE, handleValue);

        return () => {
            ref.off(VALUE, handleValue);
        };
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

    return {
        listenEvents,
        listenConfig,
        addEvent,
        updateEvent,
        deleteEvent
    };
})();
