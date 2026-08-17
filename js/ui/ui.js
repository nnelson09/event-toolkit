const UI = (() => {
    let activeTool = null;

    function start() {
        startModules();
        bindEvents();
    }

    function startModules() {
        UIForm.start();
        UIList.start();
        UIDialogs.start();
        UINotifications.start();
        UIToolsMenu.start();
        UITroopDivider.start();
        UIEternitysReach.start();
    }

    function bindEvents() {
        UIForm.onCreate(handleCreate);
        UIList.onDelete(handleDelete);
        UIList.onAdjust(handleAdjust);
        UIDialogs.onAccept(handleAdjustAccept);

        UIToolsMenu.onTroopDivider(handleTroopDivider);
        UIToolsMenu.onEternitysReach(handleEternitysReach);

        UITroopDivider.onClose(() => {
            handleToolClosed(UITroopDivider);
        });

        UIEternitysReach.onClose(() => {
            handleToolClosed(UIEternitysReach);
        });

        Events.onChanged(handleEventsChanged);
    }

    async function handleCreate(data) {
        try {
            const event = EventFactory.create(data);

            await Events.add(event);

            UIForm.clear();
        } catch (error) {
            ErrorHandler.handle(error, "Creating event");
        }
    }

    async function handleDelete(id) {
        try {
            await Events.remove(id);
        } catch (error) {
            ErrorHandler.handle(error, "Deleting event");
        }
    }

    function handleAdjust(id) {
        try {
            UIDialogs.open(id);
        } catch (error) {
            ErrorHandler.handle(error, "Opening event adjustment");
        }
    }

    async function handleAdjustAccept(data) {
        try {
            await Events.adjustTime(data.id, data.milliseconds);
        } catch (error) {
            ErrorHandler.handle(error, "Adjusting event time");
        }
    }

    function handleTroopDivider() {
        try {
            openTool(UITroopDivider);
        } catch (error) {
            ErrorHandler.handle(error, "Opening Troop Divider");
        }
    }

    function handleEternitysReach() {
        try {
            openTool(UIEternitysReach);
        } catch (error) {
            ErrorHandler.handle(error, "Opening Eternity's Reach");
        }
    }

    function openTool(tool) {
        if (activeTool === tool) {
            return;
        }

        if (activeTool) {
            activeTool.close();
        }

        tool.open();
        activeTool = tool;
    }

    function handleToolClosed(tool) {
        if (activeTool === tool) {
            activeTool = null;
        }
    }

    function handleEventsChanged(events) {
        UIList.render(events);
    }

    function reset() {
        UIForm.reset();
        UIDialogs.close();
        UIToolsMenu.close();

        if (activeTool) {
            activeTool.close();
        }

        UIEternitysReach.reset();

        UIList.render([]);
    }

    return {
        start,
        reset
    };
})();
