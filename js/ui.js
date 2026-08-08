const UI = (() => {
    function start() {
        startModules();
        bindEvents();
    }

    function startModules() {
        UIForm.start();
        UIList.start();
        UIDialogs.start();
        UINotifications.start();
    }

    function bindEvents() {
        UIForm.onCreate(handleCreate);

        UIList.onDelete(handleDelete);
        UIList.onAdjust(handleAdjust);

        UIDialogs.onAccept(handleAdjustAccept);

        Events.onChanged(handleEventsChanged);
    }

    function reset() {
        UIForm.reset();
        UIDialogs.close();
        UIList.render([]);
    }

    async function handleCreate(data) {
        try {
            const event = EventFactory.create(data);

            await Events.add(event);

            UIForm.clear();
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDelete(id) {
        try {
            await Events.remove(id);
        } catch (error) {
            console.error(error);
        }
    }

    function handleAdjust(id) {
        UIDialogs.open(id);
    }

    async function handleAdjustAccept(data) {
        try {
            await Events.adjustTime(data.id, data.milliseconds);
        } catch (error) {
            console.error(error);
        }
    }

    function handleEventsChanged(events) {
        UIList.render(events);
    }

    return {
        start,
        reset
    };
})();
