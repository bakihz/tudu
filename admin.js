document.addEventListener("DOMContentLoaded", async () => {
  const { getTasks, addTask } = window.api;

  // Elements
  const taskForm = document.getElementById("task-form");
  const todoList = document.getElementById("todo-list-admin");
  const goToUserButton = document.getElementById("go-to-user");

  // ────────────────────────────────────────────────────────
  // Task Database Operations
  // ────────────────────────────────────────────────────────

  const addTaskToDatabase = async (task) => {
    try {
      await addTask(task);
      console.log("Task added to database:", task.name);
    } catch (err) {
      console.error("Error adding task to database:", err);
    }
  };

  const loadTasksFromDatabase = async () => {
    try {
      const tasks = await getTasks();
      console.log("Tasks loaded from database:", tasks);

      todoList.innerHTML = "";

      if (tasks.length === 0) {
        const noTasksMessage = document.createElement("li");
        noTasksMessage.className = "list-group-item text-center text-muted";
        noTasksMessage.textContent = "No tasks available.";
        todoList.appendChild(noTasksMessage);
        return;
      }

      tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.innerHTML = `
          <strong>${task.Name}</strong> - ${task.Details || "No details"}<br />
          <small>
            <strong>Deadline:</strong> ${
              task.Deadline ? new Date(task.Deadline).toLocaleString() : "None"
            } |
            <strong>Type:</strong> ${
              task.TaskType === 1 ? "Urgent" : "Normal"
            } |
            <strong>Recurring:</strong> ${task.IsRecurring ? "Yes" : "No"}
          </small>
        `;
        todoList.appendChild(listItem);
      });
    } catch (error) {
      console.error("Error loading tasks from database:", error);
    }
  };

  // ────────────────────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────────────────────

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const task = {
      tick: false,
      name: document.getElementById("task-name").value.trim(),
      completionTime: null,
      taskType: parseInt(document.getElementById("task-type").value, 10),
      taskCreationDate: new Date(),
      deadline: document.getElementById("task-deadline").value
        ? new Date(document.getElementById("task-deadline").value)
        : null,
      interval: document.getElementById("task-interval").value
        ? parseInt(document.getElementById("task-interval").value, 10)
        : null,
      isRecurring: document.getElementById("task-recurring").value === "true",
      user: 1,
      creator: 1,
      details: document.getElementById("task-details").value.trim(),
    };

    await addTaskToDatabase(task);
    taskForm.reset();
    await loadTasksFromDatabase();
  });

  goToUserButton.addEventListener("click", () => {
    window.location.href = "user.html";
  });

  // ────────────────────────────────────────────────────────
  // Sidebar & Context Menu
  // ────────────────────────────────────────────────────────

  const sidebar = document.getElementById("task-sidebar");
  const closeSidebarButton = document.getElementById("close-sidebar");

  const contextMenu = document.createElement("div");
  contextMenu.id = "context-menu";
  Object.assign(contextMenu.style, {
    position: "absolute",
    display: "none",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    padding: "10px",
    zIndex: 1000,
  });

  const deleteOption = document.createElement("button");
  deleteOption.textContent = "Delete Task";
  deleteOption.className = "btn btn-danger btn-sm";
  contextMenu.appendChild(deleteOption);
  document.body.appendChild(contextMenu);

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  const openSidebar = (taskDetails) => {
    document.getElementById("task-title").textContent = taskDetails.title;
    document.getElementById("task-reminder").textContent =
      taskDetails.reminder || "None";
    document.getElementById("task-due-date").textContent =
      taskDetails.dueDate || "None";
    document.getElementById("task-recurring").textContent =
      taskDetails.recurring ? "Yes" : "No";
    document.getElementById("task-assigned").textContent =
      taskDetails.assigned || "None";
    document.getElementById("task-notes").value = taskDetails.notes || "";
    sidebar.classList.add("open");
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
  };

  closeSidebarButton.addEventListener("click", closeSidebar);

  // ────────────────────────────────────────────────────────
  // Initial Task Load
  // ────────────────────────────────────────────────────────

  await loadTasksFromDatabase();
});
