import { todoList } from "./dom.js";
import { openEditSidebar } from "./sidebar.js";
import { updateTask, getUsers } from "./api.js"; // Add this import
import { createNextRecurringTask } from "./taskUtils.js";

// Add this helper to decode interval from DB (e.g. "21" means 2 weeks, "13" means 1 month)
function decodeInterval(dbInterval) {
  if (!dbInterval || typeof dbInterval !== "string" || dbInterval.length !== 2)
    return { amount: null, unit: null };
  const amount = parseInt(dbInterval[0], 10);
  const type = dbInterval[1];
  // Map DB type digit to unit string
  const unitMap = {
    1: "day",
    3: "week",
    4: "month",
    5: "year",
    6: "workday",
  };
  return { amount, unit: unitMap[type] || null };
}

// When processing tasks from DB, decode interval
export function renderTaskList(
  tasks,
  loadTasksFromDatabase,
  showCompletedOnly = false
) {
  todoList.innerHTML = "";

  const userFilter = document.getElementById("user-filter");
  let selectedUserId = userFilter ? userFilter.value : "all";

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Filter tasks by user and deleted status
  let filteredTasks = tasks.filter((task) => {
    if (selectedUserId !== "all" && String(task.UserID) !== selectedUserId)
      return false;
    if (task.isDeleted) return false;
    return true;
  });

  // If showCompletedOnly, show only completed tasks
  if (showCompletedOnly) {
    filteredTasks = filteredTasks.filter((task) => !!task.Tick);
  }

  // Separate completed and non-completed tasks
  const completedTasks = filteredTasks.filter((task) => !!task.Tick);
  const nonCompletedTasks = filteredTasks.filter((task) => !task.Tick);

  // Group non-completed tasks by date
  const groups = groupTasksByDate(nonCompletedTasks);

  // Helper to render a group with a header
  function renderGroup(title, groupTasks) {
    if (groupTasks.length === 0) return;
    const header = document.createElement("div");
    header.className = "task-group-header";
    header.textContent = `${title} ${groupTasks.length}`;
    todoList.appendChild(header);
    groupTasks.forEach((task) => {
      // --- decode interval from DB ---
      if (
        task.Interval &&
        typeof task.Interval === "string" &&
        task.Interval.length === 2
      ) {
        const { amount, unit } = decodeInterval(task.Interval);
        task.IntervalAmount = amount;
        task.IntervalUnit = unit;
      } else {
        task.IntervalAmount = null;
        task.IntervalUnit = null;
      }

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

      // Example usage:
      const intervalDisplay =
        task.IsRecurring && task.IntervalAmount && task.IntervalUnit
          ? `${task.IntervalAmount} ${
              {
                day: "gün",
                week: "hafta",
                month: "ay",
                year: "yıl",
                workday: "iş günü",
                custom: "özel",
              }[task.IntervalUnit] || ""
            }`
          : "";

      // Determine if overdue
      const deadlineDate = new Date(task.Deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only highlight if overdue and not completed
      const isOverdue = !task.Tick && deadlineDate < today;

      // Add the class only if overdue and not completed
      leftDetails.innerHTML = `
  <span class="${isOverdue ? "deadline-overdue" : ""}">
    ${formatDeadline(task.Deadline)}
  </span>
  <span><strong>${task.UserName || "Assignee"}</strong></span>
  <span>${task.IsRecurring ? "🔁" : ""}</span>
  ${intervalDisplay ? `<span>${intervalDisplay}</span>` : ""}
`;

      // Right group: type, creator
      const rightDetails = document.createElement("div");
      rightDetails.style.display = "flex";
      rightDetails.style.gap = "12px";
      rightDetails.innerHTML = `
    <span${task.TaskType === 1 ? ' class="urgent-text"' : ""}>${
        task.TaskType === 1 ? "Acil" : ""
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

        // If the task is becoming complete, store current time +3 hours as CompletionTime
        let completionTime = null;
        if (newTick) {
          const nowPlus3 = new Date();
          nowPlus3.setHours(nowPlus3.getHours() + 3);
          completionTime = nowPlus3.toISOString(); // e.g., "2025-05-28T12:34:56.789Z"
        }

        await updateTask({
          ...task,
          Tick: newTick,
          CompletionTime: completionTime, // Pass it to your DB
        });

        checkCircle.innerHTML = newTick ? "&#10003;" : "";
        task.Tick = newTick;

        // Toggle line-through, animate, etc.
        taskName.classList.toggle("task-completed", newTick);
        if (newTick) {
          listItem.classList.add("task-completed-animate");
          setTimeout(
            () => listItem.classList.remove("task-completed-animate"),
            400
          );
        }
        taskName.style.textDecoration = newTick ? "line-through" : "none";

        // Delay reload
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

  // Render completed tasks group first (if not in showCompletedOnly mode, otherwise it's the only group)
  if (completedTasks.length > 0) {
    renderGroup("Tamamlanmış", completedTasks);
  }

  // Only render other groups if not in showCompletedOnly mode
  if (!showCompletedOnly) {
    renderGroup("Daha önce", groups.overdue);
    renderGroup("Bugün", groups.today);
    renderGroup("Yarın", groups.tomorrow);
    renderGroup("Bu hafta", groups.thisWeek);
    renderGroup("Daha sonra", groups.later);
  }
}

// Format deadline as "19 May Mon" or "19 May 2024 Mon"
function formatDeadline(dateStr) {
  if (!dateStr) return "None";
  const date = new Date(dateStr);
  const now = new Date();
  const day = date.getDate();
  const month = date.toLocaleString("tr-TR", { month: "short" }); // Turkish month
  const year = date.getFullYear();
  const weekday = date.toLocaleString("tr-TR", { weekday: "short" }); // Turkish weekday
  if (year === now.getFullYear()) {
    return `${day} ${month} ${weekday}`;
  } else {
    return `${day} ${month} ${year} ${weekday}`;
  }
}

function groupTasksByDate(tasks) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const groups = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  tasks.forEach((task) => {
    if (!task.Deadline) {
      groups.later.push(task);
      return;
    }
    const deadline = new Date(task.Deadline);

    if (deadline < today) {
      groups.overdue.push(task);
    } else if (
      deadline.getFullYear() === today.getFullYear() &&
      deadline.getMonth() === today.getMonth() &&
      deadline.getDate() === today.getDate()
    ) {
      groups.today.push(task);
    } else if (
      deadline.getFullYear() === tomorrow.getFullYear() &&
      deadline.getMonth() === tomorrow.getMonth() &&
      deadline.getDate() === tomorrow.getDate()
    ) {
      groups.tomorrow.push(task);
    } else {
      // Group as "this week" or "later"
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      if (deadline < weekFromNow) {
        groups.thisWeek.push(task);
      } else {
        groups.later.push(task);
      }
    }
  });
  return groups;
}

async function populateUserFilter() {
  const userFilter = document.getElementById("user-filter");
  if (!userFilter) return;
  // Remove all except "Tümü"
  userFilter.innerHTML = '<option value="all">Tümü</option>';
  const users = await getUsers();
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.UserID;
    option.textContent = user.UserName;
    userFilter.appendChild(option);
  });
}
populateUserFilter();
