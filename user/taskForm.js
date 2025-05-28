window.currentUserId = parseInt(localStorage.getItem("currentUserId"), 10);

import { addTask } from "./api.js"; // Removed getUsers since we’re not assigning to others

export function setupTaskForm(taskForm, loadTasksFromDatabase, addTaskSidebar) {
  // Recurring & interval handling
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
    updateIntervalState(); // Initialize
  }

  // Custom interval handling
  const intervalSelect = document.getElementById("task-interval");
  const customIntervalModal = document.getElementById("custom-interval-modal");
  const customIntervalNumber = document.getElementById("custom-interval-number");
  const customIntervalUnit = document.getElementById("custom-interval-unit");
  const customIntervalOk = document.getElementById("custom-interval-ok");
  const customIntervalCancel = document.getElementById("custom-interval-cancel");
  
  let customIntervalValue = null;

  if (intervalSelect) {
    intervalSelect.addEventListener("change", () => {
      if (intervalSelect.value === "custom") {
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
      intervalSelect.options[intervalSelect.selectedIndex].text =
        `Every ${num} ${unit}${num > 1 ? "s" : ""}`;
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

  // On form submit, always assign to current user
  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

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
          intervalValue = 12; // custom code for "iş günü"
          break;
        case "weekly":
          intervalValue = 13; 
          break;
        case "monthly":
          intervalValue = 14; 
          break;
        case "yearly":
          intervalValue = 15; 
          break;
        default:
          intervalValue = null; // Non-recurring
      }
    }

    const task = {
      TaskName: document.getElementById("task-name").value.trim(),
      TaskType: parseInt(document.getElementById("task-type").value, 10) || 2,
      Deadline: document.getElementById("task-deadline").value
        ? new Date(document.getElementById("task-deadline").value)
        : null,
      IsRecurring: document.getElementById("task-recurring").value,
      Interval: intervalValue,
      Details: document.getElementById("task-details").value.trim(),
      CreatorID: window.currentUserId,
      UserID: window.currentUserId, // Assign to current user only
      Tick: false,
      TaskCreationDate: new Date(),
    };

    await addTask(task);
    taskForm.reset();
    await loadTasksFromDatabase();
    addTaskSidebar.classList.remove("open");
  });
}
