import { todoList } from "./dom.js";
import { openEditSidebar } from "./sidebar.js";
import { updateTask } from "./api.js"; // Add this import
import { createNextRecurringTask } from "./taskUtils.js";

export function renderTaskList(tasks, loadTasksFromDatabase) {
  todoList.innerHTML = "";

  // Show tasks that are not completed, or completed but deadline is today
  const visibleTasks = tasks.filter((task) => {
    if (!task.Tick) return true;
    if (!task.Deadline) return false;
    const deadline = new Date(task.Deadline);
    const now = new Date();
    return (
      deadline.getFullYear() === now.getFullYear() &&
      deadline.getMonth() === now.getMonth() &&
      deadline.getDate() === now.getDate()
    );
  });

  if (visibleTasks.length === 0) {
    const noTasksMessage = document.createElement("li");
    noTasksMessage.className = "list-group-item text-center text-muted";
    noTasksMessage.textContent = "No tasks available.";
    todoList.appendChild(noTasksMessage);
    return;
  }
  visibleTasks.forEach((task) => {
    const listItem = document.createElement("li");
    listItem.className =
      "list-group-item d-flex align-items-stretch task-fade-in";
    setTimeout(() => listItem.classList.remove("task-fade-in"), 500);

    // --- Left: Tick ---
    const leftCol = document.createElement("div");
    leftCol.style.display = "flex";
    leftCol.style.alignItems = "center";
    leftCol.style.justifyContent = "center";
    leftCol.style.width = "60px";
    leftCol.style.minWidth = "60px";

    const checkCircle = document.createElement("span");
    checkCircle.className = "check-circle";
    checkCircle.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 2px solid #007bff;
    border-radius: 50%;
    cursor: pointer;
    font-size: 22px;
    color: #007bff;
    transition: background 0.2s;
    user-select: none;
  `;
    checkCircle.innerHTML = task.Tick ? "&#10003;" : "";
    leftCol.appendChild(checkCircle);

    // --- Right: Main Content ---
    const rightCol = document.createElement("div");
    rightCol.style.display = "flex";
    rightCol.style.flexDirection = "column";
    rightCol.style.flex = "1";
    rightCol.style.justifyContent = "center";
    rightCol.style.gap = "6px";

    // Top row: Task name
    const taskName = document.createElement("div");
    taskName.textContent = task.TaskName;
    taskName.className = "task-name";
    taskName.style.fontWeight = "bold";
    taskName.style.fontSize = "1.1rem";
    taskName.style.overflow = "hidden";
    taskName.style.textOverflow = "ellipsis";
    taskName.style.whiteSpace = "nowrap";
    taskName.style.width = "100%";
    taskName.style.textDecoration = task.Tick ? "line-through" : "none";
    taskName.classList.toggle("task-completed", task.Tick);

    // Bottom row: Details
    const bottomRow = document.createElement("div");
    bottomRow.style.display = "flex";
    bottomRow.style.justifyContent = "space-between";
    bottomRow.style.alignItems = "center";
    bottomRow.style.width = "100%";

    // Left group: assignee, deadline, recurring
    const leftDetails = document.createElement("div");
    leftDetails.style.display = "flex";
    leftDetails.style.gap = "16px";
    leftDetails.innerHTML = `
  <span><strong>${task.UserName || "Assignee"}</strong></span>
  <span>${
    task.Deadline ? new Date(task.Deadline).toLocaleString() : "None"
  }</span>
  <span>${task.IsRecurring ? "🔁" : ""}</span>
`;

    // Right group: type, creator
    const rightDetails = document.createElement("div");
    rightDetails.style.display = "flex";
    rightDetails.style.gap = "12px";
    rightDetails.innerHTML = `
    <span${task.TaskType === 1 ? ' class="urgent-text"' : ""}>${
      task.TaskType === 1 ? "Urgent" : "Normal"
    }</span>
    <span>${task.CreatorName}</span>
  `;

    bottomRow.appendChild(leftDetails);
    bottomRow.appendChild(rightDetails);

    rightCol.appendChild(taskName);
    rightCol.appendChild(bottomRow);

    listItem.appendChild(leftCol);
    listItem.appendChild(rightCol);
    todoList.appendChild(listItem);

    checkCircle.addEventListener("click", async (e) => {
      e.stopPropagation();
      const newTick = !task.Tick;
      await updateTask({ ...task, Tick: newTick });
      checkCircle.innerHTML = newTick ? "&#10003;" : "";
      task.Tick = newTick;

      // Animate completion
      taskName.classList.toggle("task-completed", newTick);
      if (newTick) {
        listItem.classList.add("task-completed-animate");
        setTimeout(
          () => listItem.classList.remove("task-completed-animate"),
          400
        );
      }

      // Add or remove line-through on task name
      taskName.style.textDecoration = newTick ? "line-through" : "none";

      // Delay before refreshing the list
      setTimeout(async () => {
        if (newTick && task.IsRecurring && task.Interval && task.Deadline) {
          await createNextRecurringTask(task);
        }
        if (typeof loadTasksFromDatabase === "function") {
          await loadTasksFromDatabase();
        }
      }, 400);
    });

    listItem.addEventListener("click", (e) => {
      if (e.target.classList.contains("check-circle")) return;
      openEditSidebar(task, loadTasksFromDatabase);
    });
  });
}
