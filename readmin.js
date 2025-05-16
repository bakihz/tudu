window.currentUserId = parseInt(localStorage.getItem("currentUserId"), 10);

if (!window.currentUserId || isNaN(window.currentUserId)) {
  alert("You are not logged in. Please log in again.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  // ────────────────────────────────────────────────────────
  // Elements
  // ────────────────────────────────────────────────────────
  const { getTasks, addTask, updateTask: updateTaskApi } = window.api;
  const taskForm = document.getElementById("task-form");
  const todoList = document.getElementById("todo-list-admin");
  const goToUserButton = document.getElementById("go-to-user");

  // Sidebars
  const sidebar = document.getElementById("task-sidebar");
  const closeSidebarButton = document.getElementById("close-sidebar");
  const addTaskSidebar = document.getElementById("add-task-sidebar");
  const openAddTaskBtn = document.getElementById("add-todo-admin");
  const closeAddTaskBtn = document.getElementById("close-add-task-sidebar");
  const editTaskSidebar = document.getElementById("edit-task-sidebar");
  const editTaskFields = document.getElementById("edit-task-fields");
  const closeEditTaskBtn = document.getElementById("close-edit-task-sidebar");

  // Context Menu
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

  // ────────────────────────────────────────────────────────
  // Utility Functions
  // ────────────────────────────────────────────────────────

  const addTaskToDatabase = async (task) => {
    try {
      // Ensure property names match backend expectations
      const formattedTask = {
        TaskName: task.TaskName,
        TaskType: task.TaskType,
        Deadline: task.Deadline,
        IsRecurring: task.IsRecurring,
        Interval: task.Interval,
        Details: task.Details,
        CreatorID: task.CreatorID,
        UserID: task.UserID,
        Tick: task.Tick,
      };
      await addTask(formattedTask);
      console.log("Task added to database:", formattedTask);
    } catch (err) {
      console.error("Error adding task to database:", err);
    }
  };

  // Refactored: Update Task
  async function updateTask(updatedTask) {
    try {
      // Ensure property names match backend expectations
      const formattedTask = {
        TaskID: updatedTask.TaskID,
        TaskName: updatedTask.TaskName,
        TaskType: updatedTask.TaskType,
        Deadline: updatedTask.Deadline,
        IsRecurring: updatedTask.IsRecurring,
        Interval: updatedTask.Interval,
        Details: updatedTask.Details,
        CreatorID: updatedTask.CreatorID,
        UserID: updatedTask.UserID,
        Tick: updatedTask.Tick,
      };
      if (updateTaskApi) {
        await updateTaskApi(formattedTask);
      } else {
        await addTaskToDatabase(formattedTask);
      }
      console.log("Task updated:", formattedTask);
      await loadTasksFromDatabase();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  }

  // ────────────────────────────────────────────────────────
  // Task List Rendering
  // ────────────────────────────────────────────────────────

  const loadTasksFromDatabase = async () => {
    try {
      const tasks = await getTasks();

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
        listItem.className = "list-group-item d-flex align-items-center";
        // Check circle
        const checkCircle = document.createElement("span");
        checkCircle.className = "check-circle";
        checkCircle.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 2px solid #007bff;
          border-radius: 50%;
          margin-right: 4px;
          cursor: pointer;
          font-size: 18px;
          color: #007bff;
          transition: background 0.2s;
          user-select: none;
        `;
        checkCircle.innerHTML = task.Tick ? "&#10003;" : "";

        checkCircle.addEventListener("click", async (e) => {
          e.stopPropagation();
          const newTick = !task.Tick;
          await addTaskToDatabase({ ...task, Tick: newTick });
          checkCircle.innerHTML = newTick ? "&#10003;" : "";
          task.Tick = newTick;
        });

        // Task name
        const taskName = document.createElement("strong");
        taskName.textContent = task.TaskName;
        taskName.style.marginRight = "12px";

        // Task details
        const taskContent = document.createElement("span");
        taskContent.innerHTML = `
          - ${task.Details || "No details"}<br />
          <small>
            <strong>Deadline:</strong> ${
              task.Deadline ? new Date(task.Deadline).toLocaleString() : "None"
            } |
            <strong>Type:</strong> ${
              task.TaskType === 1 ? "Urgent" : "Normal"
            } |
            <strong>Recurring:</strong> ${task.IsRecurring ? "Yes" : "No"} |
            <strong>Creator:</strong> ${task.CreatorName}
          </small>
        `;

        // Group tick and name
        const leftGroup = document.createElement("div");
        leftGroup.style.display = "flex";
        leftGroup.style.alignItems = "center";
        leftGroup.appendChild(checkCircle);
        leftGroup.appendChild(taskName);

        listItem.appendChild(leftGroup);
        listItem.appendChild(taskContent);
        todoList.appendChild(listItem);

        listItem.addEventListener("click", (e) => {
          if (e.target.classList.contains("check-circle")) return;
          openEditSidebar(task);
        });
      });
    } catch (error) {
      console.error("Error loading tasks from database:", error);
    }
  };

  // ────────────────────────────────────────────────────────
  // Add Task Form Handler
  // ────────────────────────────────────────────────────────

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get the current user's ID (should be set after login)
    const creatorId = window.currentUserId; // Make sure this is set after login

    const task = {
      TaskName: document.getElementById("task-name").value.trim(),
      TaskType: parseInt(document.getElementById("task-type").value, 10) || 2,
      Deadline: document.getElementById("task-deadline").value
        ? new Date(document.getElementById("task-deadline").value)
        : null,
      IsRecurring:
        document.getElementById("task-recurring").value == "true" ? 1 : 0,
      Interval: document.getElementById("task-interval").value
        ? parseInt(document.getElementById("task-interval").value, 10)
        : null,
      Details: document.getElementById("task-details").value.trim(),
      CreatorID: creatorId, // Pass the user ID as creator
      UserID: parseInt(document.getElementById("task-assignee").value, 10), // assigned user, // Pass the user ID as user
      Tick: false,
    };

    await addTaskToDatabase(task);
    taskForm.reset();
    await loadTasksFromDatabase();
    addTaskSidebar.classList.remove("open");
  });

  // ────────────────────────────────────────────────────────
  // Navigation & Sidebar Handlers
  // ────────────────────────────────────────────────────────

  goToUserButton.addEventListener("click", () => {
    window.location.href = "user.html";
  });

  closeSidebarButton.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  openAddTaskBtn.addEventListener("click", () => {
    addTaskSidebar.classList.add("open");
  });

  closeAddTaskBtn.addEventListener("click", () => {
    addTaskSidebar.classList.remove("open");
  });

  closeEditTaskBtn.addEventListener("click", () => {
    editTaskSidebar.classList.remove("open");
  });

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  // ────────────────────────────────────────────────────────
  // Edit Task Sidebar Logic
  // ────────────────────────────────────────────────────────

  function renderEditableField(label, value, key, type = "text") {
    return `
      <div class="mb-3 d-flex align-items-center">
        <label class="me-2" style="min-width:100px;">${label}:</label>
        <span class="field-value" data-key="${key}">${value}</span>
        <span class="edit-pencil" data-key="${key}" title="Edit">&#9998;</span>
      </div>
    `;
  }

  function openEditSidebar(task) {
    editTaskFields.innerHTML = `
      ${renderEditableField("TaskName", task.TaskName, "TaskName")}
      ${renderEditableField("Details", task.Details || "", "Details")}
      ${renderEditableField(
        "Deadline",
        task.Deadline ? new Date(task.Deadline).toISOString().slice(0, 16) : "",
        "Deadline",
        "datetime-local"
      )}
      ${renderEditableField(
        "Type",
        task.TaskType === 1 ? "Urgent" : "Normal",
        "TaskType"
      )}
      ${renderEditableField(
        "Recurring",
        task.IsRecurring ? "Yes" : "No",
        "IsRecurring"
      )}
      <div class="mt-4">
        <button id="delete-task-btn" class="btn btn-danger w-100">Delete Task</button>
      </div>
    `;
    editTaskSidebar.classList.add("open");

    editTaskFields.querySelectorAll(".edit-pencil").forEach((pencil) => {
      pencil.addEventListener("click", function () {
        const key = this.getAttribute("data-key");
        const valueSpan = editTaskFields.querySelector(
          `.field-value[data-key="${key}"]`
        );
        let inputHtml = "";
        let currentValue = valueSpan.textContent;

        if (key === "TaskType") {
          inputHtml = `
            <select class="edit-input">
              <option value="0" ${
                task.TaskType === 0 ? "selected" : ""
              }>Normal</option>
              <option value="1" ${
                task.TaskType === 1 ? "selected" : ""
              }>Urgent</option>
            </select>
          `;
        } else if (key === "IsRecurring") {
          inputHtml = `
            <select class="edit-input">
              <option value="false" ${
                !task.IsRecurring ? "selected" : ""
              }>No</option>
              <option value="true" ${
                task.IsRecurring ? "selected" : ""
              }>Yes</option>
            </select>
          `;
        } else if (key === "Deadline") {
          const val = task.Deadline
            ? new Date(task.Deadline).toISOString().slice(0, 16)
            : "";
          inputHtml = `<input type="datetime-local" class="edit-input" value="${val}"/>`;
        } else {
          inputHtml = `<input type="text" class="edit-input" value="${currentValue.replace(
            /"/g,
            "&quot;"
          )}"/>`;
        }
        valueSpan.innerHTML = `
          ${inputHtml}
          <button class="save-edit-btn btn btn-sm btn-success">&#10003;</button>
        `;

        valueSpan
          .querySelector(".save-edit-btn")
          .addEventListener("click", async () => {
            let newValue;
            if (key === "TaskType" || key === "IsRecurring") {
              newValue = valueSpan.querySelector("select").value;
            } else {
              newValue = valueSpan.querySelector("input").value;
            }

            if (key === "Name") task.Name = newValue;
            if (key === "Details") task.Details = newValue;
            if (key === "Deadline")
              task.Deadline = newValue
                ? new Date(newValue).toISOString()
                : null;
            if (key === "TaskType") task.TaskType = parseInt(newValue, 10);
            if (key === "IsRecurring") task.IsRecurring = newValue === "true";

            await updateTask(task);
            openEditSidebar(task);
          });
      });
    });

    // Delete task logic
    const deleteBtn = document.getElementById("delete-task-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this task?")) {
          if (window.api && window.api.deleteTask) {
            await window.api.deleteTask(task.TaskID || task.id);
          }
          editTaskSidebar.classList.remove("open");
          await loadTasksFromDatabase();
        }
      });
    }
  }

  // ────────────────────────────────────────────────────────
  // Initial Load
  // ────────────────────────────────────────────────────────

  await loadTasksFromDatabase();

  // ────────────────────────────────────────────────────────
  // Assignee Select
  // ────────────────────────────────────────────────────────

  const assigneeSelect = document.getElementById("task-assignee");

  async function populateAssigneeSelect() {
    const users = await window.api.getUsers();
    assigneeSelect.innerHTML = "";
    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.UserID;
      option.textContent = user.UserName;
      // Default to current user
      if (user.UserID === window.currentUserId) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    });
  }

  // Call this after DOMContentLoaded
  await populateAssigneeSelect();
});
