let taskId = 0;

// Add Task
function addTask(column){
    let input = document.getElementById("todoInput");
    let value = input.value.trim();

    if(value === "") return;

    let task = document.createElement("div");
    task.className = "task";
    task.draggable = true;
    task.id = "task" + taskId++;

    task.innerHTML = `
        ${value}
        <button onclick="deleteTask(this)">Delete</button>
    `;

    task.addEventListener("dragstart", drag);

    document.getElementById(column).appendChild(task);

    input.value = "";
}

// Delete Task
function deleteTask(btn){
    btn.parentElement.remove();
}

// Drag & Drop
function allowDrop(ev){
    ev.preventDefault();
}

function drag(ev){
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev){
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");

    let column = ev.target.closest(".column").querySelector("div");
    column.appendChild(document.getElementById(data));
}
