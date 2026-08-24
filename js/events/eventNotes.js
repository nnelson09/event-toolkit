const EventNotes = (() => {
    async function add(eventId, text) {
        validateId(eventId);

        const event = Events.get(eventId);

        if (!event) {
            return;
        }

        const order = Object.keys(event.notes).length;

        const note = Note.create(text, order);

        event.notes[note.id] = note;

        Event.validate(event);

        await Events.update(event);
    }

    async function update(eventId, noteId, text) {
        validateId(eventId);
        validateId(noteId);

        const event = Events.get(eventId);

        if (!event) {
            return;
        }

        const note = event.notes[noteId];

        if (!note) {
            return;
        }

        Note.setText(note, text);

        Event.validate(event);

        await Events.update(event);
    }

    async function remove(eventId, noteId) {
        validateId(eventId);
        validateId(noteId);

        const event = Events.get(eventId);

        if (!event) {
            return;
        }

        if (!event.notes[noteId]) {
            return;
        }

        delete event.notes[noteId];

        normalizeOrder(event.notes);

        Event.validate(event);

        await Events.update(event);
    }

    async function reorder(eventId, noteIds) {
        validateId(eventId);
        validateNoteIds(noteIds);

        const event = Events.get(eventId);

        if (!event) {
            return;
        }

        validateReorder(event.notes, noteIds);

        noteIds.forEach((id, index) => {
            event.notes[id].order = index;
        });

        Event.validate(event);

        await Events.update(event);
    }

    function normalizeOrder(notes) {
        getOrderedNotes(notes).forEach((note, index) => {
            note.order = index;
        });
    }

    function getOrderedNotes(notes) {
        return Object.values(notes).sort((a, b) => a.order - b.order);
    }

    function validateReorder(notes, noteIds) {
        const existingIds = Object.keys(notes);

        if (noteIds.length !== existingIds.length) {
            throw new RangeError("Note order must contain every event note.");
        }

        if (new Set(noteIds).size !== noteIds.length) {
            throw new RangeError("Note order cannot contain duplicate ids.");
        }

        const validIds = new Set(existingIds);

        noteIds.forEach(id => {
            if (!validIds.has(id)) {
                throw new RangeError(`Unknown note id: ${id}`);
            }
        });
    }

    function validateNoteIds(noteIds) {
        if (!Array.isArray(noteIds)) {
            throw new TypeError("Note ids must be an array.");
        }

        noteIds.forEach(validateId);
    }

    function validateId(id) {
        if (typeof id !== "string" || id === "") {
            throw new TypeError("Id must be a non-empty string.");
        }
    }

    return {
        add,
        update,
        remove,
        reorder
    };
})();
