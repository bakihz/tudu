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

const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", () => {
    // Optionally clear any session or token here
    window.location.href = "login.html"; // Redirect to login
  });
}

const newUserTodoInput = document.getElementById("new-todo-user");
const addUserTodoButton = document.getElementById("add-todo-user");

function addUserTodo() {
  const text = newUserTodoInput.value.trim();
  if (!text) return;

  addTaskSidebar.classList.add("open");

  // Put the text in the task form
  const taskNameInput = document.getElementById("task-name");
  if (taskNameInput) {
    taskNameInput.value = text;
  }

  newUserTodoInput.value = "";
}

// Open sidebar on Enter
newUserTodoInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addUserTodo();
  }
});

// Open sidebar on button click
addUserTodoButton?.addEventListener("click", addUserTodo);
