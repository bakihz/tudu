import {
  taskForm,
  addTaskSidebar,
  openAddTaskBtn,
  closeAddTaskBtn,
  editTaskSidebar,
  closeEditTaskBtn,
  goToUserButton,
  assigneeSelect,
} from "./dom.js";
import { getTasks } from "./api.js";
import { renderTaskList } from "./taskList.js";
import { setupTaskForm } from "./taskForm.js";
async function loadTasksFromDatabase() {
  console.log("Loading tasks from database...");
  const tasks = await getTasks();
  renderTaskList(tasks, loadTasksFromDatabase);
}

setupTaskForm(taskForm, loadTasksFromDatabase, addTaskSidebar, assigneeSelect);
await loadTasksFromDatabase();

// Sidebar open/close handlers
if (openAddTaskBtn && addTaskSidebar) {
  openAddTaskBtn.addEventListener("click", () => {
    addTaskSidebar.classList.add("open");
  });
}
if (closeAddTaskBtn && addTaskSidebar) {
  closeAddTaskBtn.addEventListener("click", () => {
    addTaskSidebar.classList.remove("open");
  });
}
if (closeEditTaskBtn && editTaskSidebar) {
  closeEditTaskBtn.addEventListener("click", () => {
    editTaskSidebar.classList.remove("open");
  });
}

// Navigation handler
if (goToUserButton) {
  goToUserButton.addEventListener("click", () => {
    window.location.href = "user.html";
  });
}
