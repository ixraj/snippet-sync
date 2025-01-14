document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const titleInput = document.getElementById("titleInput");
    const categorySelect = document.getElementById("categorySelect");
    const pasteArea = document.getElementById("pasteArea");
    const saveButton = document.getElementById("saveButton");
    const clearButton = document.getElementById("clearButton");
    const copyButton = document.getElementById("copyButton");
    const themeToggle = document.getElementById("themeToggle");
    const notesList = document.getElementById("notesList");
    const viewNotesBtn = document.getElementById("viewNotesBtn");
    const homeBtn = document.getElementById("homeBtn");
    const exportBtn = document.getElementById("exportBtn");
    const searchInput = document.getElementById("searchInput");
    const filterCategory = document.getElementById("filterCategory");
    const modal = document.getElementById("noteModal");

    // Theme Management
    function initializeTheme() {
        const savedTheme = localStorage.getItem("theme") || "dark";
        document.body.classList.toggle("dark-mode", savedTheme === "dark");
        if (themeToggle) {
            themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        if (themeToggle) {
            themeToggle.textContent = isDark ? "☀️" : "🌙";
        }
    }

    // Custom Confirmation Dialog
    function showConfirmDialog(message, onConfirm) {
        const confirmDialog = document.createElement("div");
        confirmDialog.className = "confirm-dialog";
        confirmDialog.innerHTML = `
            <div class="confirm-content">
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn yes">Yes</button>
                    <button class="confirm-btn no">No</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        const yesBtn = confirmDialog.querySelector(".yes");
        const noBtn = confirmDialog.querySelector(".no");

        yesBtn.addEventListener("click", () => {
            onConfirm();
            confirmDialog.remove();
        });

        noBtn.addEventListener("click", () => {
            confirmDialog.remove();
        });
    }

    // Save Note Function
    function saveNote(e) {
        if (e) e.preventDefault();

        const title = titleInput?.value.trim();
        const category = categorySelect?.value;
        const content = pasteArea?.value.trim();

        if (!title || !content || !category) {
            showAlert("Please fill in all fields");
            return;
        }

        const noteObj = {
            id: Date.now(),
            title,
            category,
            content,
            timestamp: new Date().toISOString(),
        };

        let notes = JSON.parse(localStorage.getItem("notes")) || [];
        notes.push(noteObj);
        localStorage.setItem("notes", JSON.stringify(notes));

        clearInputs();
        showAlert("Note saved successfully!");
    }

    // Create Note Element Function
    function createNoteElement(note) {
        const noteItem = document.createElement("div");
        noteItem.className = "saved-item";
        const date = new Date(note.timestamp).toLocaleDateString();

        const searchTerm = (searchInput?.value || "").toLowerCase().trim();
        let titleText = note.title;
        let contentPreview = note.content.substring(0, 150) + (note.content.length > 150 ? "..." : "");

        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            titleText = note.title.replace(regex, '<mark>$1</mark>');
            contentPreview = contentPreview.replace(regex, '<mark>$1</mark>');
        }

        const previewClass = note.category === 'code' ? 'code-preview' : 'text-preview';
        const previewContent = note.category === 'code'
            ? `<pre><code class="language-${detectLanguage(note.content)}">${escapeHtml(contentPreview)}</code></pre>`
            : contentPreview;

        noteItem.innerHTML = `
            <h3>${titleText}</h3>
            <span class="note-category" data-category="${note.category}">${note.category}</span>
            <div class="note-preview ${previewClass}">
                ${previewContent}
            </div>
            <div class="note-date">${date}</div>
            <button class="delete-btn" data-id="${note.id}">Delete</button>
        `;

        noteItem.addEventListener("click", (e) => {
            if (!e.target.classList.contains("delete-btn")) {
                showNoteDetails(note);
            }
        });

        const deleteBtn = noteItem.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showConfirmDialog("Are you sure you want to delete this note?", () => {
                deleteNote(note.id);
            });
        });

        return noteItem;
    }

    function formatNotesForPDF(notes) {
        const container = document.createElement('div');
        container.style.padding = '20px';
        container.style.fontFamily = 'Arial, sans-serif';

        notes.forEach(note => {
            // Note Header Section
            const noteHeader = document.createElement('div');
            noteHeader.style.marginBottom = '20px';

            // Title
            const title = document.createElement('h2');
            title.textContent = note.title;
            title.style.color = '#2c3e50';
            title.style.marginBottom = '10px';

            // Category
            const category = document.createElement('div');
            category.textContent = `Category: ${note.category}`;
            category.style.color = '#7f8c8d';
            category.style.marginBottom = '10px';

            // Content
            const content = document.createElement('div');
            content.style.marginBottom = '15px';
            content.style.whiteSpace = 'pre-wrap';
            content.style.backgroundColor = note.category === 'code' ? '#f7f9fa' : 'transparent';
            content.style.padding = note.category === 'code' ? '15px' : '0';
            content.style.borderRadius = '5px';
            content.style.color = '#333333';

            if (note.category === 'code') {
                content.style.fontFamily = 'Source Code Pro, serif';
            } else {
                content.style.fontFamily = 'Poppins, serif';
            }

            content.textContent = note.content;

            // Timestamp
            const timestamp = document.createElement('div');
            timestamp.textContent = new Date(note.timestamp).toLocaleString();
            timestamp.style.color = '#95a5a6';
            timestamp.style.fontSize = '14px';

            // Divider
            const divider = document.createElement('hr');
            divider.style.margin = '30px 0';
            divider.style.border = '1px solid #ecf0f1';

            // Append all elements
            noteHeader.appendChild(title);
            noteHeader.appendChild(category);
            noteHeader.appendChild(content);
            noteHeader.appendChild(timestamp);
            noteHeader.appendChild(divider);

            container.appendChild(noteHeader);
        });

        return container;
    }

    function exportNotesToPDF() {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        if (notes.length === 0) {
            showAlert("No notes to export!");
            return;
        }

        const notesContainer = formatNotesForPDF(notes);
        document.body.appendChild(notesContainer);

        const options = {
            margin: 10,
            filename: 'notes.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(notesContainer).set(options).save().then(() => {
            document.body.removeChild(notesContainer);
            showAlert("Notes exported as PDF successfully!");
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function detectLanguage(code) {
        if (code.includes('def ') || code.includes('import ')) return 'python';
        if (code.includes('function') || code.includes('const ')) return 'javascript';
        if (code.includes('SELECT ') || code.includes('FROM ')) return 'sql';
        if (code.includes('{') && code.includes('}')) return 'javascript';
        return 'plaintext';
    }

    function showNoteDetails(note) {
        if (!modal) return;

        const contentHtml = note.category === 'code'
            ? `<pre><code class="language-${detectLanguage(note.content)}">${escapeHtml(note.content)}</code></pre>`
            : `<div class="content-wrapper">${note.content}</div>`;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${note.title}</h2>
                    <button class="close-btn" id="closeModal">&times;</button>
                </div>
                <div class="modal-body" data-category="${note.category}">
                    <span class="note-category" data-category="${note.category}">${note.category}</span>
                    ${contentHtml}
                </div>
                <div class="modal-footer">
                    <span class="note-date">${new Date(note.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `;

        const closeBtn = modal.querySelector("#closeModal");
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        modal.style.display = "flex";

        if (note.category === 'code') {
            Prism.highlightAll();
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    function displayNotes() {
        if (!notesList) return;

        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const sortedNotes = notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        notesList.innerHTML = '';

        if (sortedNotes.length === 0) {
            notesList.innerHTML = `
                <div class="no-notes">
                    <p>No notes found. Start by creating a new note!</p>
                </div>
            `;
            return;
        }

        sortedNotes.forEach(note => {
            const noteElement = createNoteElement(note);
            notesList.appendChild(noteElement);
        });

        if (window.Prism) {
            Prism.highlightAll();
        }
    }

    function deleteNote(id) {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const updatedNotes = notes.filter(note => note.id !== id);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));

        if (searchInput?.value || filterCategory?.value) {
            filterNotes();
        } else {
            displayNotes();
        }

        showAlert("Note deleted successfully!");
    }

    function filterNotes() {
        if (!notesList) return;

        const searchTerm = (searchInput?.value || "").toLowerCase().trim();
        const selectedCategory = filterCategory?.value || "";
        const notes = JSON.parse(localStorage.getItem("notes")) || [];

        const filteredNotes = notes.filter(note => {
            const matchesSearch =
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || note.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        displayFilteredNotes(filteredNotes);
    }

    function displayFilteredNotes(filteredNotes) {
        if (!notesList) return;

        notesList.innerHTML = '';

        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <div class="no-results">
                    <p>No matching notes found</p>
                </div>
            `;
            return;
        }

        filteredNotes
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(note => {
                const noteElement = createNoteElement(note);
                notesList.appendChild(noteElement);
            });

        if (window.Prism) {
            Prism.highlightAll();
        }
    }

    function showAlert(message) {
        const alert = document.createElement("div");
        alert.className = "custom-alert";
        alert.textContent = message;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = "slideOut 0.3s ease forwards";
            setTimeout(() => alert.remove(), 300);
        }, 2000);
    }

    function clearInputs() {
        if (titleInput) titleInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (pasteArea) pasteArea.value = "";
    }

    // Initialize Theme
    initializeTheme();

    // Event Listeners
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }

    if (document.getElementById("snippetForm")) {
        document.getElementById("snippetForm").addEventListener("submit", saveNote);
    }

    if (clearButton) {
        clearButton.addEventListener("click", clearInputs);
    }

    if (copyButton && pasteArea) {
        copyButton.addEventListener("click", () => {
            pasteArea.select();
            document.execCommand("copy");
            showAlert("Content copied to clipboard!");
        });
    }

    if (viewNotesBtn) {
        viewNotesBtn.addEventListener("click", () => {
            window.location.href = "notes.html";
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterNotes);
    }

    if (filterCategory) {
        filterCategory.addEventListener("change", filterNotes);
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", exportNotesToPDF);
    }

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal?.style.display === "flex") {
            modal.style.display = "none";
        }
    });

    // Initial display of notes
    if (notesList) {
        displayNotes();
    }
});