const Firebase = (() => {
    const eventsRef = firebase.database().ref("events");

    const CHILD_ADDED = "child_added";
    const CHILD_CHANGED = "child_changed";
    const CHILD_REMOVED = "child_removed";

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

        eventsRef.on(CHILD_ADDED, handleAdded);
        eventsRef.on(CHILD_CHANGED, handleChanged);
        eventsRef.on(CHILD_REMOVED, handleRemoved);

        return () => {
            eventsRef.off(CHILD_ADDED, handleAdded);
            eventsRef.off(CHILD_CHANGED, handleChanged);
            eventsRef.off(CHILD_REMOVED, handleRemoved);
        };
    }

    async function getEvent(id) {
        const snapshot = await eventsRef.child(id).get();

        return snapshot.exists() ? snapshot.val() : null;
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
        getEvent,
        addEvent,
        updateEvent,
        deleteEvent
    };
})();
