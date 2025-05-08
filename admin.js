const { poolPromise, sql } = require("./db");

// Navigation to user page
document.getElementById("go-to-user").addEventListener("click", () => {
  window.location.href = "user.html";
});

// Admin-specific todo functionality
document.addEventListener("DOMContentLoaded", () => {
  const newTodoInput = document.getElementById("new-todo-admin");
  const addTodoButton = document.getElementById("add-todo-admin");
  const todoList = document.getElementById("todo-list-admin");
  const taskTemplate = document.getElementById("task-template-admin");

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

  const addTaskToDatabase = async (task) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("Tick", sql.Bit, task.tick)
        .input("Name", sql.NVarChar, task.name)
        .input("CompletionTime", sql.DateTime, task.completionTime)
        .input("TaskType", sql.Int, task.taskType)
        .input("TaskCreationDate", sql.DateTime, task.taskCreationDate)
        .input("Deadline", sql.DateTime, task.deadline)
        .input("Interval", sql.Int, task.interval)
        .input("IsRecurring", sql.Bit, task.isRecurring)
        .input("UserID", sql.Int, task.user)
        .input("CreatorID", sql.Int, task.creator)
        .input("Details", sql.NVarChar, task.details).query(`
          INSERT INTO Tasks (
            Tick, Name, CompletionTime, TaskType, TaskCreationDate, Deadline,
            Interval, IsRecurring, UserID, CreatorID, Details
          )
          VALUES (
            @Tick, @Name, @CompletionTime, @TaskType, @TaskCreationDate, @Deadline,
            @Interval, @IsRecurring, @UserID, @CreatorID, @Details
          )
        `);
      console.log("Task added to database:", task.name);
    } catch (err) {
      console.error("Error adding task to database:", err);
    }
  };

  const loadTasksFromDatabase = async () => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query("SELECT * FROM Tasks");
      const tasks = result.recordset;

      tasks.forEach((task) => {
        const listItem = taskTemplate.cloneNode(true);
        listItem.style.display = ""; // Make it visible
        listItem.removeAttribute("id"); // Remove the template ID

        // Set task text
        const taskText = listItem.querySelector(".task-text");
        taskText.textContent = task.Name;

        // Set completion state
        const completeButton = listItem.querySelector(".complete-task");
        if (task.Tick) {
          completeButton.innerHTML = '<i class="bi bi-check-circle"></i>';
        }

        // Append the task to the todo list
        todoList.appendChild(listItem);
      });
    } catch (err) {
      console.error("Error loading tasks from database:", err);
    }
  };

  // Add task function
  const addTask = () => {
    const taskName = newTodoInput.value.trim();
    if (taskName) {
      const task = {
        tick: false,
        name: taskName,
        completionTime: null,
        taskType: 2, // Default to "Normal"
        taskCreationDate: new Date(),
        deadline: null, // Set a deadline if needed
        interval: null, // Set an interval if needed
        isRecurring: false,
        user: 1, // Replace with the actual user ID
        creator: 1, // Replace with the actual creator ID
        details: "Task created via admin panel",
      };

      // Save the task to the database
      addTaskToDatabase(task);

      // Clone the task template
      const listItem = taskTemplate.cloneNode(true);
      listItem.style.display = ""; // Make it visible
      listItem.removeAttribute("id"); // Remove the template ID

      // Set task text
      const taskText = listItem.querySelector(".task-text");
      taskText.textContent = task.name;

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

  loadTasksFromDatabase();
});
