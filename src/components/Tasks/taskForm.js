window.currentUserId = parseInt(localStorage.getItem("currentUserId"), 10);

import { addTask, getUsers } from "./api.js";

export async function populateAssigneeSelect(assigneeSelect) {
  const currentUserId = localStorage.getItem(
    "currentUserId",
    window.currentUserId
  );
  const currentUserName = localStorage.getItem(
    "userName",
    window.currentUserName
  );
  const currentUserType = localStorage.getItem(
    "userType",
    window.currentUserType
  );
  if (currentUserType !== "admin") {
    // Show only current user
    assigneeSelect.innerHTML = "";
    const users = await getUsers();
    users.forEach((user) => {
      if (user.UserType !== "admin") {
        const option = document.createElement("option");
        option.value = user.UserID;
        option.textContent = user.UserName;
        // Default to current user
        if (user.UserID === window.currentUserId) {
          option.selected = true;
        }
        assigneeSelect.appendChild(option);
      } // Skip other users
    });
  } else {
    const users = await getUsers();
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
}

export function setupTaskForm(
  taskForm,
  loadTasksFromDatabase,
  addTaskSidebar,
  assigneeSelect
) {
  // Populate assignee select on load
  populateAssigneeSelect(assigneeSelect);

  // Set default date to today at 18:00 (6 p.m.)
  const deadlineInput = document.getElementById("task-deadline");
  if (deadlineInput) {
    const now = new Date();
    now.setHours(18, 0, 0, 0); // 18:00:00 today
    // Format as yyyy-MM-ddTHH:mm for input[type="datetime-local"]
    const pad = (n) => n.toString().padStart(2, "0");
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    deadlineInput.value = formatted;
  }

  const recurringSelect = document.getElementById("task-recurring");
  const intervalInput = document.getElementById("task-interval");
  function updateIntervalState() {
    if (recurringSelect.value === "1") {
      intervalInput.disabled = false;
    } else {
      intervalInput.disabled = true;
      intervalInput.value = "";
    }
  }
  if (recurringSelect && intervalInput) {
    recurringSelect.addEventListener("change", updateIntervalState);
    updateIntervalState(); // Set initial state
  }

  const intervalSelect = document.getElementById("task-interval");
  const customIntervalModal = document.getElementById("custom-interval-modal");
  const customIntervalNumber = document.getElementById(
    "custom-interval-number"
  );
  const customIntervalUnit = document.getElementById("custom-interval-unit");
  const customIntervalOk = document.getElementById("custom-interval-ok");
  const customIntervalCancel = document.getElementById(
    "custom-interval-cancel"
  );

  let customIntervalValue = null;

  if (intervalSelect) {
    intervalSelect.addEventListener("change", () => {
      if (intervalSelect.value === "custom") {
        // Show modal
        customIntervalModal.style.display = "flex";
        customIntervalNumber.value = 1;
        customIntervalUnit.value = "day";
      } else {
        customIntervalValue = null;
      }
    });
  }

  if (customIntervalOk) {
    customIntervalOk.addEventListener("click", () => {
      const num = parseInt(customIntervalNumber.value, 10);
      const unit = customIntervalUnit.value;
      if (isNaN(num) || num < 1) {
        alert("0'dan büyük bir sayı girin.");
        return;
      }
      customIntervalValue = { num, unit };
      // Optionally, show a summary in the select
      intervalSelect.options[
        intervalSelect.selectedIndex
      ].text = `Every ${num} ${unit}${num > 1 ? "s" : ""}`;
      customIntervalModal.style.display = "none";
    });
  }
  if (customIntervalCancel) {
    customIntervalCancel.addEventListener("click", () => {
      customIntervalModal.style.display = "none";
      intervalSelect.value = "daily"; // Reset to default
      customIntervalValue = null;
    });
  }

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const creatorId = window.currentUserId;
    const userIdValue = assigneeSelect.value;
    if (!userIdValue) {
      alert("Görev atamak için bir kullanıcı seçin.");
      return;
    }

    // Map for custom interval type encoding
    const intervalTypeMap = {
      day: 1,
      week: 3,
      month: 4,
      year: 5,
    };

    let intervalValue;
    if (intervalSelect.value === "custom" && customIntervalValue) {
      const num = parseInt(customIntervalValue.num, 10);
      const type = intervalTypeMap[customIntervalValue.unit];
      if (!num || !type) {
        alert("Invalid custom interval.");
        return;
      }
      intervalValue = parseInt(`${num}${type}`, 10); // e.g. 21 for 2 days
    } else {
      // Map standard options to your encoding
      switch (intervalSelect.value) {
        case "daily":
          intervalValue = 11; // every 1 day
          break;
        case "working-days":
          intervalValue = 12; // you can define a special code if needed
          break;
        case "weekly":
          intervalValue = 13; // every 1 week
          break;
        case "monthly":
          intervalValue = 14; // every 1 month
          break;
        case "yearly":
          intervalValue = 15; // every 1 year
          break;
        default:
          intervalValue = null; // No recurring
      }
    }

    const task = {
      TaskName: document.getElementById("task-name").value.trim(),
      TaskType: parseInt(document.getElementById("task-type").value, 10) || 2,
      Deadline: document.getElementById("task-deadline").value
        ? new Date(document.getElementById("task-deadline").value)
        : null,
      IsRecurring: parseInt(
        document.getElementById("task-recurring").value,
        10
      ),
      Interval: intervalValue,
      Details: document.getElementById("task-details").value.trim(),
      CreatorID: creatorId,
      UserID: parseInt(userIdValue, 10),
      Tick: false,
      TaskCreationDate: new Date(),
    };

    await addTask(task);
    taskForm.reset();
    await loadTasksFromDatabase();
    addTaskSidebar.classList.remove("open");
    await populateAssigneeSelect(assigneeSelect);
  });
}

document.getElementById("custom-interval-ok").onclick = function () {
  const number = document.getElementById("custom-interval-number").value;
  const unit = document.getElementById("custom-interval-unit").value;
  // Use these values as needed...
  document.getElementById("custom-interval-modal").style.display = "none";
};

document.getElementById("custom-interval-cancel").onclick = function () {
  document.getElementById("custom-interval-modal").style.display = "none";
};
