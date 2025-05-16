import { editTaskFields, editTaskSidebar } from "./dom.js";
import { updateTask } from "./api.js";

function renderEditableField(label, value, key, type = "text") {
  return `
      <div class="mb-3 d-flex align-items-center">
        <label class="me-2" style="min-width:100px;">${label}:</label>
        <span class="field-value" data-key="${key}">${value}</span>
        <span class="edit-pencil" data-key="${key}" title="Edit">&#9998;</span>
      </div>
    `;
}

export function openEditSidebar(task, loadTasksFromDatabase) {
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

          if (key === "TaskName") task.TaskName = newValue;
          if (key === "Details") task.Details = newValue;
          if (key === "Deadline")
            task.Deadline = newValue ? new Date(newValue).toISOString() : null;
          if (key === "TaskType") task.TaskType = parseInt(newValue, 10);
          if (key === "IsRecurring")
            task.IsRecurring = newValue === "true" ? 1 : 0;

          await updateTask(task);
          if (typeof loadTasksFromDatabase === "function") {
            await loadTasksFromDatabase();
          }
          openEditSidebar(task, loadTasksFromDatabase);
        });
    });
  });

  // Delete task logic
  const deleteBtn = document.getElementById("delete-task-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      console.log("Delete:", task.TaskID || task.id);
      if (confirm("Are you sure you want to delete this task?")) {
        if (window.api && window.api.deleteTask) {
          await window.api.deleteTask(task.TaskID || task.id);
        }
        editTaskSidebar.classList.remove("open");
        if (typeof loadTasksFromDatabase === "function") {
          await loadTasksFromDatabase();
        }
      }
    });
  }
}
