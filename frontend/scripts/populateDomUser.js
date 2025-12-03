document.addEventListener("DOMContentLoaded", () => {
    const notesDirectory = document.getElementById("notesDirectory");
    const notesTextarea  = document.getElementById("userNotes");
    const createBtn      = document.getElementById("createNoteButton");

    let currentFile = null;
    let saveTimeout = null;
    /* LOAD LOCAL FILE LIST */
    async function loadNotesList() {
        try {
            const res = await fetch("/api/getNoteFiles");
            if (!res.ok) throw new Error("Failed to fetch note files.");

            const files = await res.json();
            renderNotesList(files);
        } catch (err) {
            console.error(err);
        }
    }

    function renderNotesList(files) {
        notesDirectory.innerHTML = "";

        files.forEach((fileName) => {
            const li = document.createElement("li");
            li.dataset.filename = fileName;          // <-- needed for highlight

            // ---- left side: filename ----
            const nameSpan = document.createElement("span");
            nameSpan.textContent = fileName;

            nameSpan.addEventListener("click", async () => {
                await saveCurrentNote();
                openNote(fileName);                  // will update currentFile
            });

            // ---- right side: delete button ----
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "✕";
            deleteBtn.className = "deleteNoteBtn";

            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();                
                const ok = confirm(`Delete "${fileName}"?`);
                if (!ok) return;

                try {
                    const res = await fetch("/api/deleteNote", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: fileName })
                    });

                    if (!res.ok) throw new Error("Delete failed");

                    if (currentFile === fileName) {
                        currentFile = null;
                        notesTextarea.value = "";
                    }

                    await loadNotesList();           // rebuilds the list
                } catch (err) {
                    console.error(err);
                }
            });

            if (currentFile === fileName) {
                li.classList.add("active");
            }

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            notesDirectory.appendChild(li);
        });
    }

    /* TO OPEN NOTE */
    async function openNote(fileName) {
        try {
            const res = await fetch(
                `/api/getNoteContent?filename=${encodeURIComponent(fileName)}`
            );
            if (!res.ok) throw new Error("Failed to fetch note content");

            const text = await res.text();
            currentFile = fileName;
            notesTextarea.value = text;
            highlightCurrentFile();
        } catch (err) {
            console.error(err);
        }
    }

    function highlightCurrentFile() {
        [...notesDirectory.children].forEach((li) => {
            li.classList.toggle(
                "active",
                li.dataset.filename === currentFile
            );
        });
    }

    /* CREATE NOTE BUTTON */
    createBtn.addEventListener("click", async () => {
        const name = prompt("Enter a name for your note:");
        if (!name) return;

        try {
            const res = await fetch("/api/createNoteFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: name })
            });

            if (!res.ok) throw new Error("Failed to create note");

            const data = await res.json();
            currentFile = data.filename;
            notesTextarea.value = "";

            await loadNotesList();
            highlightCurrentFile();
        } catch (err) {
            console.error(err);
        }
    });

    /* SAVE NOTE CONTENT (AUTOSAVE) */
    async function saveCurrentNote() {
        if (!currentFile) return;

        try {
            await fetch("/api/saveNote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: currentFile,
                    content: notesTextarea.value
                })
            });
        } catch (err) {
            console.error("Save failed:", err);
        }
    }

    notesTextarea.addEventListener("input", () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveCurrentNote();
        }, 400);
    });


    /* INITIAL LOAD ON DOM POPULATION */
    loadNotesList();
});