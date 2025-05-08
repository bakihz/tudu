document.addEventListener("DOMContentLoaded", () => {
  const newTodoInput = document.getElementById("new-todo");
  const addTodoButton = document.getElementById("add-todo");
  const todoList = document.getElementById("todo-list");
  const taskTemplate = document.getElementById("task-template");

  // Create a right-click menu
  const contextMenu = document.createElement("div");
  contextMenu.id = "context-menu";
  contextMenu.style.position = "absolute";
  contextMenu.style.display = "none";
  contextMenu.style.backgroundColor = "#fff";
  contextMenu.style.border = "1px solid #ccc";
  contextMenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
  contextMenu.style.padding = "10px";
  document.body.appendChild(contextMenu);

  // Add delete option to the context menu
  const deleteOption = document.createElement("button");
  deleteOption.textContent = "Delete Task";
  deleteOption.className = "btn btn-danger btn-sm";
  contextMenu.appendChild(deleteOption);

  // Hide the context menu when clicking elsewhere
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  // Add task function
  const addTask = () => {
    const task = newTodoInput.value.trim();
    if (task) {
      // Clone the task template
      const listItem = taskTemplate.cloneNode(true);
      listItem.style.display = ""; // Make it visible
      listItem.removeAttribute("id"); // Remove the template ID

      // Set task text
      const taskText = listItem.querySelector(".task-text");
      taskText.textContent = task;

      // Get buttons
      const completeButton = listItem.querySelector(".complete-task");

      // Add functionality to the complete button
      let isComplete = false; // Default state
      completeButton.addEventListener("click", () => {
        isComplete = !isComplete; // Toggle the boolean
        completeButton.innerHTML = isComplete
          ? '<i class="bi bi-check-circle"></i>' // Icon for true
          : '<i class="bi bi-circle"></i>'; // Icon for false
      });

      // Add right-click functionality to the list item
      listItem.addEventListener("contextmenu", (event) => {
        event.preventDefault(); // Prevent the default context menu
        contextMenu.style.display = "block";
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        // Set delete functionality for the current list item
        deleteOption.onclick = () => {
          todoList.removeChild(listItem);
          contextMenu.style.display = "none";
        };
      });

      // Append the new task to the todo list
      todoList.appendChild(listItem);

      // Clear input field
      newTodoInput.value = "";
    } else {
      alert("Please enter a task.");
    }
  };

  // Add event listeners
  addTodoButton.addEventListener("click", addTask);
  newTodoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addTask();
    }
  });
});
