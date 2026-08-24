const Event = (() => {
    function create(name, targetTime, interval = null) {
        validateData(name, targetTime, interval, {});

        return {
            id: crypto.randomUUID(),
            name,
            targetTime,
            interval,
            notes: {}
        };
    }

    function clone(event) {
        validate(event);

        return {
            ...event,
            notes: Object.fromEntries(Object.entries(event.notes).map(([id, note]) => [id, Note.clone(note)]))
        };
    }

    function validate(event) {
        if (typeof event !== "object" || event === null || Array.isArray(event)) {
            throw new TypeError("Event must be an object.");
        }

        if (typeof event.id !== "string" || event.id === "") {
            throw new TypeError("Event id must be a non-empty string.");
        }

        validateData(event.name, event.targetTime, event.interval, event.notes);

        return true;
    }

    function validateData(name, targetTime, interval, notes) {
        if (typeof name !== "string") {
            throw new TypeError("Event name must be a string.");
        }

        if (typeof targetTime !== "number" || !Number.isFinite(targetTime)) {
            throw new TypeError("Event target time must be a finite number.");
        }

        if (interval !== null && (typeof interval !== "number" || !Number.isFinite(interval) || interval <= 0)) {
            throw new TypeError("Event interval must be a positive finite number or null.");
        }

        validateNotes(notes);
    }

    function validateNotes(notes) {
        if (typeof notes !== "object" || notes === null || Array.isArray(notes)) {
            throw new TypeError("Event notes must be an object.");
        }

        const values = Object.entries(notes);

        values.forEach(([id, note]) => {
            Note.validate(note);

            if (note.id !== id) {
                throw new RangeError("Note id must match its collection key.");
            }
        });

        validateNoteOrder(values.map(([, note]) => note));
    }

    function validateNoteOrder(notes) {
        const orders = notes.map(note => note.order).sort((a, b) => a - b);

        orders.forEach((order, index) => {
            if (order !== index) {
                throw new RangeError("Note order must be consecutive starting at zero.");
            }
        });
    }

    return {
        create,
        clone,
        validate
    };
})();
