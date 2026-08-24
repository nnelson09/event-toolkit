const UIEvent = (() => {
    let currentEvent = null;
    let editingField = null;

    let nameSaveCallback = null;
    let notesSaveCallback = null;

    let overlay;
    let btnClose;

    let nameValue;
    let btnEditName;

    let notesValue;
    let btnEditNotes;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();
    }

    function cacheDOM() {
        overlay = document.getElementById("eventDialog");
        btnClose = document.getElementById("btnEventClose");

        nameValue = document.getElementById("eventNameValue");
        btnEditName = document.getElementById("btnEventEditName");

        notesValue = document.getElementById("eventNotesValue");
        btnEditNotes = document.getElementById("btnEventEditNotes");
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);

        btnEditName.addEventListener("click", () => {
            startEditing("name");
        });

        btnEditNotes.addEventListener("click", () => {
            startEditing("notes");
        });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                close();
            }
        });
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));

        btnEditName.replaceChildren(Icons.create(Icons.EDIT));

        btnEditNotes.replaceChildren(Icons.create(Icons.EDIT));
    }

    function onNameSave(callback) {
        validateCallback(callback);

        nameSaveCallback = callback;
    }

    function onNotesSave(callback) {
        validateCallback(callback);

        notesSaveCallback = callback;
    }

    function open(event) {
        Event.validate(event);

        currentEvent = Event.clone(event);
        editingField = null;

        render();

        overlay.hidden = false;
    }

    function close() {
        if (editingField !== null) {
            return;
        }

        overlay.hidden = true;
        currentEvent = null;
    }

    function startEditing(field) {
        if (!currentEvent || editingField !== null) {
            return;
        }

        editingField = field;

        render();
    }

    function cancelEditing() {
        editingField = null;

        render();
    }

    async function saveName() {
        const input = nameValue.querySelector(".event-dialog-name-input");

        if (!input) {
            return;
        }

        const name = input.value;

        if (nameSaveCallback) {
            await nameSaveCallback({
                eventId: currentEvent.id,
                name
            });
        }

        currentEvent.name = name;
        editingField = null;

        render();
    }

    async function saveNotes() {
        const rows = Array.from(notesValue.querySelectorAll(".event-dialog-note-edit"));

        const notes = rows.map(row => {
            const input = row.querySelector(".event-dialog-note-input");

            return {
                id: row.dataset.noteId || null,
                text: input.value
            };
        });

        if (notesSaveCallback) {
            await notesSaveCallback({
                eventId: currentEvent.id,
                notes
            });
        }

        editingField = null;
    }

    function render() {
        if (!currentEvent) {
            return;
        }

        renderName();
        renderNotes();

        btnClose.disabled = editingField !== null;
    }

    function renderName() {
        nameValue.replaceChildren();

        if (editingField === "name") {
            renderNameEditor();
            return;
        }

        const value = document.createElement("div");

        value.className = "event-dialog-text";

        value.textContent = currentEvent.name || "Event";

        nameValue.appendChild(value);

        renderEditButton(btnEditName, "name");
    }

    function renderNameEditor() {
        const input = document.createElement("input");

        input.type = "text";
        input.className = "event-dialog-name-input";

        input.value = currentEvent.name;

        nameValue.appendChild(input);

        renderEditingButtons(btnEditName, saveName);

        input.focus();
        input.select();
    }

    function renderNotes() {
        notesValue.replaceChildren();

        if (editingField === "notes") {
            renderNotesEditor();
            return;
        }

        const notes = getOrderedNotes(currentEvent.notes);

        if (notes.length === 0) {
            const empty = document.createElement("div");

            empty.className = "event-dialog-empty";

            empty.textContent = "No notes.";

            notesValue.appendChild(empty);
        } else {
            notes.forEach(note => {
                const item = document.createElement("div");

                item.className = "event-dialog-note";

                item.textContent = note.text;

                notesValue.appendChild(item);
            });
        }

        renderEditButton(btnEditNotes, "notes");
    }

    function renderNotesEditor() {
        const notes = getOrderedNotes(currentEvent.notes);

        notes.forEach(note => {
            notesValue.appendChild(createNoteEditor(note));
        });

        const btnAdd = document.createElement("button");

        btnAdd.type = "button";
        btnAdd.className = "event-dialog-note-add";
        btnAdd.title = "Add note";

        btnAdd.replaceChildren(Icons.create(Icons.ADD));

        btnAdd.addEventListener("click", addNoteEditor);

        notesValue.appendChild(btnAdd);

        renderEditingButtons(btnEditNotes, saveNotes);
    }

    function createNoteEditor(note = null) {
        const row = document.createElement("div");

        row.className = "event-dialog-note-edit";

        row.draggable = true;

        if (note) {
            row.dataset.noteId = note.id;
        }

        const input = document.createElement("input");

        input.type = "text";
        input.className = "event-dialog-note-input";

        input.value = note ? note.text : "";

        const btnDelete = document.createElement("button");

        btnDelete.type = "button";
        btnDelete.className = "event-dialog-note-delete";
        btnDelete.title = "Remove note";

        btnDelete.replaceChildren(Icons.create(Icons.DELETE));

        btnDelete.addEventListener("click", () => {
            row.remove();
        });

        bindDragEvents(row);

        row.append(input, btnDelete);

        return row;
    }

    function addNoteEditor() {
        const row = createNoteEditor();

        const btnAdd = notesValue.querySelector(".event-dialog-note-add");

        notesValue.insertBefore(row, btnAdd);

        row.querySelector(".event-dialog-note-input").focus();
    }

    function bindDragEvents(row) {
        row.addEventListener("dragstart", () => {
            row.classList.add("dragging");
        });

        row.addEventListener("dragend", () => {
            row.classList.remove("dragging");
        });

        row.addEventListener("dragover", event => {
            event.preventDefault();

            const dragging = notesValue.querySelector(".dragging");

            if (!dragging || dragging === row) {
                return;
            }

            const rect = row.getBoundingClientRect();

            const after = event.clientY > rect.top + rect.height / 2;

            if (after) {
                row.after(dragging);
            } else {
                row.before(dragging);
            }
        });
    }

    function renderEditButton(button, field) {
        button.replaceChildren(Icons.create(Icons.EDIT));

        button.title = `Edit ${field}`;

        button.onclick = () => {
            startEditing(field);
        };
    }

    function renderEditingButtons(button, saveCallback) {
        button.replaceChildren();

        const btnCancel = document.createElement("span");

        btnCancel.className = "event-dialog-edit-cancel";

        btnCancel.appendChild(Icons.create(Icons.CANCEL));

        const btnSave = document.createElement("span");

        btnSave.className = "event-dialog-edit-save";

        btnSave.appendChild(Icons.create(Icons.ACCEPT));

        btnCancel.addEventListener("click", event => {
            event.stopPropagation();

            cancelEditing();
        });

        btnSave.addEventListener("click", async event => {
            event.stopPropagation();

            await saveCallback();
        });

        button.append(btnCancel, btnSave);

        button.title = "";
        button.onclick = null;
    }

    function getOrderedNotes(notes) {
        return Object.values(notes).sort((a, b) => a.order - b.order);
    }

    function validateCallback(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function.");
        }
    }

    return {
        start,
        onNameSave,
        onNotesSave,
        open,
        close
    };
})();
