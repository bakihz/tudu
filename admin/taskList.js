import { todoList } from "./dom.js";
import { openEditSidebar } from "./sidebar.js";
import { updateTask } from "./api.js"; // Add this import
import { createNextRecurringTask } from "./taskUtils.js";

export function renderTaskList(tasks, loadTasksFromDatabase) {
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
      await updateTask({ ...task, Tick: newTick });
      checkCircle.innerHTML = newTick ? "&#10003;" : "";
      task.Tick = newTick;

      // If this is a recurring task and just completed, create the next one
      if (newTick && task.IsRecurring && task.Interval && task.Deadline) {
        await createNextRecurringTask(task);
        if (typeof loadTasksFromDatabase === "function") {
          await loadTasksFromDatabase();
        }
      } else if (typeof loadTasksFromDatabase === "function") {
        await loadTasksFromDatabase();
      }
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
      openEditSidebar(task, loadTasksFromDatabase);
    });
  });
}
