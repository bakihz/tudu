import { editTaskFields, editTaskSidebar } from "./dom.js";
import { updateTask } from "./api.js";

// Add this helper function (top of your file or in a utils file)
function decodeInterval(interval) {
  if (!interval) return { amount: null, unit: null, display: "" };
  const str = interval.toString();
  if (str.length !== 2) return { amount: null, unit: null, display: "" };

  const amount = parseInt(str[0], 10);
  const type = str[1];
  let display = "";

  const unitMap = {
    1: "day",
    2: "workday",
    3: "week",
    4: "month",
    5: "year",
  };

  if (amount === 1) {
    switch (type) {
      case "1":
        display = "Günlük";
        break;
      case "2":
        display = "Hafta içi her gün";
        break;
      case "3":
        display = "Haftalık";
        break;
      case "4":
        display = "Aylık";
        break;
      case "5":
        display = "Yıllık";
        break;
      default:
        display = "";
        break;
    }
  } else {
    const unitText =
      {
        1: "günde bir",
        2: "iş günü",
        3: "haftada bir",
        4: "ayda bir",
        5: "yılda bir",
      }[type] || "";
    display = unitText ? `Her ${amount} ${unitText}` : "";
  }

  return {
    amount,
    unit: unitMap[type] || "day",
    display,
  };
}

function renderEditableField(label, value, key, type = "text") {
  return `
      <div class="mb-3 d-flex align-items-center">
        <label class="me-2" style="min-width:100px;">${label}:</label>
        <span class="field-value" data-key="${key}">${value}</span>
        <span class="edit-pencil" data-key="${key}" title="Edit">&#9998;</span>
      </div>
    `;
}

export function openEditSidebar(task, loadTasksFromDatabase, options = {}) {
  // Decode interval for display
  let intervalDisplay = "";
  let intervalAmount = "";
  let intervalUnit = "day";
  if (task.Interval) {
    const { amount, unit, display } = decodeInterval(task.Interval);
    intervalDisplay = display;
    intervalAmount = amount || "";
    intervalUnit = unit || "day";
  }

  editTaskFields.innerHTML = `
    ${renderEditableField("Görev", task.TaskName, "TaskName")}
    ${renderEditableField(
      "Son Tarih",
      task.Deadline ? formatTurkishDeadline(task.Deadline) : "",
      "Deadline",
      "datetime-local"
    )}
    ${renderEditableField(
      "Aciliyet",
      task.TaskType === 1 ? "Acil" : "Normal",
      "TaskType"
    )}
    ${renderEditableField(
      "Tekrar",
      task.IsRecurring ? "Evet" : "Hayır",
      "IsRecurring"
    )}
    ${renderEditableField(
      "Tekrar Aralığı",
      intervalDisplay,
      "Interval",
      "text"
    )}
    ${renderEditableField("Not", task.Details || "", "Details")}
    <div class="mt-4">
      <button id="delete-task-btn" class="btn btn-danger w-100">Görevi sil</button>
    </div>
  `;

  editTaskSidebar.classList.add("open");

  // Handle readOnly option
  if (options.readOnly) {
    // Hide all edit pencils
    editTaskFields.querySelectorAll(".edit-pencil").forEach((el) => {
      el.style.display = "none";
    });
    // Hide delete button
    const deleteBtn = editTaskFields.querySelector("#delete-task-btn");
    if (deleteBtn) deleteBtn.style.display = "none";
  } else {
    // Show all edit pencils and delete button
    editTaskFields.querySelectorAll(".edit-pencil").forEach((el) => {
      el.style.display = "";
    });
    const deleteBtn = editTaskFields.querySelector("#delete-task-btn");
    if (deleteBtn) deleteBtn.style.display = "";
  }

  editTaskFields.querySelectorAll(".edit-pencil").forEach((pencil) => {
    pencil.addEventListener("click", function () {
      if (options.readOnly) return; // Prevent editing in read-only mode
      const key = this.getAttribute("data-key");
      const valueSpan = editTaskFields.querySelector(
        `.field-value[data-key="${key}"]`
      );
      let inputHtml = "";
      let currentValue = valueSpan.textContent;

      if (key === "TaskType") {
        inputHtml = `
            <select class="edit-input">
              <option value="2" ${
                task.TaskType === 2 ? "selected" : ""
              }>Normal</option>
              <option value="1" ${
                task.TaskType === 1 ? "selected" : ""
              }>Acil</option>
            </select>
          `;
      } else if (key === "IsRecurring") {
        inputHtml = `
            <select class="edit-input">
              <option value="false" ${
                !task.IsRecurring ? "selected" : ""
              }>Hayır</option>
              <option value="true" ${
                task.IsRecurring ? "selected" : ""
              }>Evet</option>
            </select>
          `;
      } else if (key === "Deadline") {
        // Take the existing date
        const deadlineDate = task.Deadline
          ? new Date(task.Deadline)
          : new Date();
        // Shift it +3 hours for Turkey
        deadlineDate.setHours(deadlineDate.getHours() + 3);
        // Use toISOString() but truncate to yyyy-MM-ddTHH:mm
        const val = deadlineDate.toISOString().slice(0, 16);

        inputHtml = `<input type="datetime-local" class="edit-input" value="${val}" />`;
      } else if (key === "Interval") {
        let placeholder = intervalDisplay;
        let intervalNum = intervalAmount;
        let unit = intervalUnit;
        inputHtml = `
    <div class="input-group" style="max-width:220px;">
      <input type="number" min="1" class="edit-input form-control" value="${intervalNum}" style="max-width:80px;" id="sidebar-interval-number" placeholder="${placeholder}"/>
      <select class="edit-input form-select" style="max-width:120px;" id="sidebar-interval-unit">
        <option value="day" ${unit === "day" ? "selected" : ""}>gün</option>
        <option value="workday" ${
          unit === "workday" ? "selected" : ""
        }>iş günü</option>
        <option value="week" ${unit === "week" ? "selected" : ""}>hafta</option>
        <option value="month" ${unit === "month" ? "selected" : ""}>ay</option>
        <option value="year" ${unit === "year" ? "selected" : ""}>yıl</option>
      </select>
    </div>
  `;
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

      // If editing IsRecurring, clear Interval if set to false
      if (key === "IsRecurring") {
        const select = valueSpan.querySelector("select");
        select.addEventListener("change", async () => {
          if (select.value === "false") {
            task.IsRecurring = 0; // false
            task.Interval = null;
            await updateTask(task);
            const intervalField = editTaskFields.querySelector(
              '.field-value[data-key="Interval"]'
            );
            if (intervalField) intervalField.textContent = "";
          } else {
            // User picked "true" -> set IsRecurring = 1
            task.IsRecurring = 1; // true
            // If there's no current interval, default to daily (11)
            if (!task.Interval) {
              task.Interval = 11; // "Günlük"
            }
            await updateTask(task);

            // Update the Interval UI if needed
            const intervalField = editTaskFields.querySelector(
              '.field-value[data-key="Interval"]'
            );
            if (intervalField && task.Interval === 11) {
              intervalField.textContent = "Günlük"; // Optional
            }
          }
        });
      }

      valueSpan
        .querySelector(".save-edit-btn")
        .addEventListener("click", async () => {
          let newValue;
          if (key === "TaskType" || key === "IsRecurring") {
            const select = valueSpan.querySelector("select");
            const newValue = select.value;

            if (key === "TaskType") {
              // Convert the selected value ("1" or "2") to number
              task.TaskType = parseInt(newValue, 10);
            } else {
              // "IsRecurring" case
              task.IsRecurring = newValue === "true" ? 1 : 0;
            }

            await updateTask(task);
            if (loadTasksFromDatabase) await loadTasksFromDatabase();
            openEditSidebar(task, loadTasksFromDatabase);
            return; // Prevent further code, since we’ve already handled this
          } else if (key === "Interval") {
            const input = valueSpan.querySelector("#sidebar-interval-number");
            const select = valueSpan.querySelector("#sidebar-interval-unit");
            let intervalNum = parseInt(input.value, 10) || null;
            let intervalUnit = select.value;
            const unitToType = {
              day: "1",
              workday: "2",
              week: "3",
              month: "4",
              year: "5",
            };

            if (task.IsRecurring && intervalUnit) {
              // Special case: if workday is selected, always use 12 (1 workday)
              if (intervalUnit === "workday") {
                task.Interval = 12; // Fixed value for "Hafta içi her gün"
              } else if (intervalNum && intervalUnit) {
                task.Interval = Number(
                  `${intervalNum}${unitToType[intervalUnit]}`
                );
              } else {
                task.Interval = null;
              }
            } else {
              task.Interval = null;
            }

            console.log("Updating task:", task); // <--- See what is sent!
            await updateTask(task); // Make sure this sends the correct object to your backend
            if (loadTasksFromDatabase) await loadTasksFromDatabase();
            openEditSidebar(task, loadTasksFromDatabase);
            return;
          } else {
            const input = valueSpan.querySelector("input");
            let val = input.value;
            task[key] = val;
          }

          await updateTask(task);
          if (loadTasksFromDatabase) await loadTasksFromDatabase();
          openEditSidebar(task, loadTasksFromDatabase); // <-- Always refresh sidebar after save
        });
    });
  });

  // Delete task
  editTaskFields.querySelector("#delete-task-btn").onclick = async () => {
    if (confirm("Bu görevi silmek istediğinize emin misiniz?")) {
      await updateTask({ ...task, isDeleted: true });
      editTaskSidebar.classList.remove("open");
      if (loadTasksFromDatabase) loadTasksFromDatabase();
    }
  };

  // Close sidebar on outside click
  document.addEventListener("click", (e) => {
    if (e.target === editTaskSidebar) {
      editTaskSidebar.classList.remove("open");
    }
  });
}

// Utility function to format Turkish deadlines
function formatTurkishDeadline(deadline) {
  if (!deadline) return "";
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return new Date(deadline).toLocaleString("tr-TR", options);
}
