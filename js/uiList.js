const UIList = (() => {
    let container;
    let deleteCallback = null;
    let adjustCallback = null;

    const displays = new Map();

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
        deleteCallback = callback;
    }

    function onAdjust(callback) {
        adjustCallback = callback;
    }

    function render(events) {
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
        empty.textContent = "Sin eventos activos.";

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

        const title = document.createElement("div");

        title.className = "event-title";
        title.textContent = event.name || "Evento";

        info.appendChild(title);

        const display = document.createElement("div");

        display.className = "event-display";
        display.textContent = Time.format(Time.remaining(event.targetTime));

        info.appendChild(display);

        displays.set(event.id, {
            element: display,
            targetTime: event.targetTime
        });

        const target = document.createElement("div");

        target.className = "event-sub";
        target.textContent = Time.formatTarget(event.targetTime);

        info.appendChild(target);

        const actions = document.createElement("div");

        actions.className = "event-actions";

        row.appendChild(actions);

        const btnAdjust = document.createElement("button");

        btnAdjust.type = "button";
        btnAdjust.className = "btn-action";
        btnAdjust.textContent = "⏱";

        btnAdjust.addEventListener("click", () => {
            if (adjustCallback) {
                adjustCallback(event.id);
            }
        });

        actions.appendChild(btnAdjust);

        const btnDelete = document.createElement("button");

        btnDelete.type = "button";
        btnDelete.className = "btn-action btn-del";
        btnDelete.textContent = "🗑";

        btnDelete.addEventListener("click", () => {
            if (deleteCallback) {
                deleteCallback(event.id);
            }
        });

        actions.appendChild(btnDelete);

        return card;
    }

    return {
        start,
        onDelete,
        onAdjust,
        render,
        update,
        clear
    };
})();
