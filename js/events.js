const Events = (() => {
    const events = new Map();
    const listeners = [];

    let unsubscribeFirebase = null;

    function start() {
        if (unsubscribeFirebase) return;

        unsubscribeFirebase = Firebase.listenEvents({
            onAdded(event) {
                addLocal(event);
            },

            onChanged(event) {
                updateLocal(event);
            },

            onRemoved(id) {
                removeLocal(id);
            }
        });
    }

    function stop() {
        if (unsubscribeFirebase) {
            unsubscribeFirebase();
            unsubscribeFirebase = null;
        }

        events.clear();
    }

    function addLocal(event) {
        events.set(event.id, event);
        notifyListeners();
    }

    function updateLocal(event) {
        events.set(event.id, event);
        notifyListeners();
    }

    function removeLocal(id) {
        events.delete(id);
        notifyListeners();
    }

    function getAll() {
        return Array.from(events.values())
            .sort((a, b) => a.targetTime - b.targetTime)
            .map(Event.clone);
    }

    function get(id) {
        const event = events.get(id);

        return event ? Event.clone(event) : null;
    }

    function onChanged(callback) {
        listeners.push(callback);

        return () => {
            const index = listeners.indexOf(callback);

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }

    function notifyListeners() {
        const currentEvents = getAll();

        listeners.forEach(callback => {
            callback(currentEvents);
        });
    }

    async function add(event) {
        await Firebase.addEvent(event);
    }

    async function update(event) {
        await Firebase.updateEvent(event);
    }

    async function remove(id) {
        await Firebase.deleteEvent(id);
    }

    async function adjustTime(id, milliseconds) {
        const event = get(id);

        if (!event) return;

        event.targetTime += milliseconds;

        await update(event);
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
