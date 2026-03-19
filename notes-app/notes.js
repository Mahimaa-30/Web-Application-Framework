let notes = [];

// Add Note
function addNote(){
    let title = document.getElementById("title").value.trim();
    let content = document.getElementById("content").value.trim();

    if(title === "" || content === "") return;

    let note = {title, content};
    notes.push(note);

    displayNotes(notes);

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
}

// Display Notes
function displayNotes(data){
    let container = document.getElementById("notesContainer");
    container.innerHTML = "";

    data.forEach((note, index) => {
        let div = document.createElement("div");
        div.className = "note";

        div.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <button class="delete" onclick="deleteNote(${index})">Delete</button>
        `;

        container.appendChild(div);
    });
}

// Delete Note
function deleteNote(index){
    notes.splice(index,1);
    displayNotes(notes);
}

// Search Notes
function searchNotes(){
    let query = document.getElementById("search").value.toLowerCase();

    let filtered = notes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );

    displayNotes(filtered);
}
