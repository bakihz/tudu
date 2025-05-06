document.addEventListener("DOMContentLoaded", () => {
  const newTodoInput = document.getElementById("new-todo");
  const addTodoButton = document.getElementById("add-todo");
  const todoList = document.getElementById("todo-list");

  // Add task function
  const addTask = () => {
    const task = newTodoInput.value.trim();
    if (task) {
      const listItem = document.createElement("li");
      listItem.textContent = task;
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      // Create complete button
      const completeButton = document.createElement("button");
      completeButton.innerHTML = '<i class="bi bi-check-circle">complete</i>'; // Tick icon inside a circle
      completeButton.className = "btn btn-success btn-sm complete-task";

      // Create delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.addEventListener("click", () => {
        todoList.removeChild(listItem);
      });

      // Append buttons to list item
      listItem.appendChild(completeButton);
      listItem.appendChild(deleteButton);

      // Append list item to the todo list
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

  todoList.addEventListener("click", (event) => {
    if (event.target.classList.contains("complete-task")) {
      const listItem = event.target.parentElement;
      listItem.classList.toggle("completed");
    }
  });

  // Add styles for completed tasks
  const style = document.createElement("style");
  style.textContent = `
        .completed {
                text-decoration: overline;
                background-color: lightgray;
        }
    `;
  document.head.appendChild(style);
});
