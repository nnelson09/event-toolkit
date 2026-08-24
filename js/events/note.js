const Note = (() => {
    function create(text, order) {
        const normalizedText = normalizeText(text);

        validateData(normalizedText, order);

        return {
            id: crypto.randomUUID(),
            text: normalizedText,
            order
        };
    }

    function setText(note, text) {
        validate(note);

        const normalizedText = normalizeText(text);

        validateData(normalizedText, note.order);

        note.text = normalizedText;
    }

    function clone(note) {
        validate(note);

        return { ...note };
    }

    function validate(note) {
        if (typeof note !== "object" || note === null || Array.isArray(note)) {
            throw new TypeError("Note must be an object.");
        }

        if (typeof note.id !== "string" || note.id === "") {
            throw new TypeError("Note id must be a non-empty string.");
        }

        validateData(note.text, note.order);

        return true;
    }

    function validateData(text, order) {
        if (typeof text !== "string" || text.trim() === "") {
            throw new TypeError("Note text must be a non-empty string.");
        }

        if (!Number.isInteger(order) || order < 0) {
            throw new TypeError("Note order must be a non-negative integer.");
        }
    }

    function normalizeText(text) {
        if (typeof text !== "string") {
            throw new TypeError("Note text must be a string.");
        }

        return text.trim();
    }

    return {
        create,
        setText,
        clone,
        validate
    };
})();
