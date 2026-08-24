const UIList = (() => {
    const displays = new Map();

    let container;
    let deleteCallback = null;
    let adjustCallback = null;
    let openCallback = null;

    function start() {
        cacheDOM();
        bindEvents();
    }

    function cacheDOM() {
        container = document.getElementById("eventsList");
    }

    function bindEvents() {
        Timer.onTick(update);
    }

    function onDelete(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Delete callback must be a function.");
        }

        deleteCallback = callback;
    }

    function onAdjust(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Adjust callback must be a function.");
        }

        adjustCallback = callback;
    }

    function onOpen(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Open callback must be a function.");
        }

        openCallback = callback;
    }

    function render(events) {
        if (!Array.isArray(events)) {
            throw new TypeError("Events must be an array.");
        }

        events.forEach(Event.validate);

        clear();

        if (events.length === 0) {
            renderEmpty();
            return;
        }

        events.forEach(event => {
            container.appendChild(createCard(event));
        });
    }

    function update() {
        displays.forEach(({ element, targetTime }) => {
            element.textContent = Time.format(Time.remaining(targetTime));
        });
    }

    function clear() {
        displays.clear();
        container.replaceChildren();
    }

    function renderEmpty() {
        const empty = document.createElement("div");

        empty.className = "empty-msg";
        empty.textContent = "No active events.";

        container.appendChild(empty);
    }

    function createCard(event) {
        const card = document.createElement("div");

        card.className = "event-card";
        card.dataset.id = event.id;

        const row = document.createElement("div");

        row.className = "event-main-row";

        card.appendChild(row);

        const info = document.createElement("div");

        info.className = "event-info";

        row.appendChild(info);

        const title = document.createElement("button");

        title.type = "button";
        title.className = "event-title";
        title.textContent = event.name || "Event";
        title.title = "Open event";

        title.addEventListener("click", () => {
            notifyOpen(event.id);
        });

        info.appendChild(title);

        const display = document.createElement("div");

        display.className = "event-display";
        display.textContent = Time.format(Time.remaining(event.targetTime));

        info.appendChild(display);

        displays.set(event.id, {
            element: display,
            targetTime: event.targetTime
        });

        const subRow = document.createElement("div");

        subRow.className = "event-sub-row";

        info.appendChild(subRow);

        const target = document.createElement("div");

        target.className = "event-sub";
        target.textContent = Time.formatTarget(event.targetTime);

        subRow.appendChild(target);

        if (Object.keys(event.notes).length > 0) {
            const noteIndicator = document.createElement("button");

            noteIndicator.type = "button";
            noteIndicator.className = "event-note-indicator";
            noteIndicator.title = "View notes";
            noteIndicator.setAttribute("aria-label", "View notes");

            noteIndicator.addEventListener("click", () => {
                notifyOpen(event.id);
            });

            subRow.appendChild(noteIndicator);
        }

        const actions = document.createElement("div");

        actions.className = "event-actions";

        row.appendChild(actions);

        const btnAdjust = document.createElement("button");

        btnAdjust.type = "button";
        btnAdjust.className = "btn-action";
        btnAdjust.title = "Adjust time";

        btnAdjust.appendChild(Icons.create(Icons.ADJUST));

        btnAdjust.addEventListener("click", () => {
            if (adjustCallback) {
                adjustCallback(event.id);
            }
        });

        actions.appendChild(btnAdjust);

        const btnDelete = document.createElement("button");

        btnDelete.type = "button";
        btnDelete.className = "btn-action btn-del";
        btnDelete.title = "Delete";

        btnDelete.appendChild(Icons.create(Icons.DELETE));

        btnDelete.addEventListener("click", () => {
            if (deleteCallback) {
                deleteCallback(event.id);
            }
        });

        actions.appendChild(btnDelete);

        return card;
    }

    function notifyOpen(id) {
        if (openCallback) {
            openCallback(id);
        }
    }

    return {
        start,
        onDelete,
        onAdjust,
        onOpen,
        render,
        update,
        clear
    };
})();
