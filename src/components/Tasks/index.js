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
let showCompletedOnly = false;
async function loadTasksFromDatabase() {
  const tasks = await getTasks();
  renderTaskList(tasks, loadTasksFromDatabase, showCompletedOnly);
}

setupTaskForm(taskForm, loadTasksFromDatabase, addTaskSidebar, assigneeSelect);
await loadTasksFromDatabase();

const userType = localStorage.getItem("userType");
if (userType === "admin") {
  document.body.classList.add("admin-type");
}

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
    localStorage.clear(); // Clear all local storage
    window.location.href = "login.html"; // Redirect to login
  });
}

const newTodoInput = document.getElementById("new-todo-admin");
const addTodoButton = document.getElementById("add-todo-admin");

function addTodo() {
  const deadlineInput = document.getElementById("task-deadline");
  if (deadlineInput) {
    const now = new Date();
    now.setHours(18, 0, 0, 0);
    const pad = (n) => n.toString().padStart(2, "0");
    const formatted =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "T" +
      pad(now.getHours()) +
      ":" +
      pad(now.getMinutes());
    deadlineInput.value = formatted;
  }
  const text = newTodoInput.value.trim();
  if (!text) return;

  // Open sidebar
  addTaskSidebar.classList.add("open");

  // If you have a text field for "task-name" in the addTask form:
  const taskNameInput = document.getElementById("task-name");
  if (taskNameInput) {
    taskNameInput.value = text;
  }

  newTodoInput.value = "";
}

// Trigger on Enter press
newTodoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTodo();
  }
});

// Trigger on button click
addTodoButton.addEventListener("click", addTodo);

// User filter handler
const userFilter = document.getElementById("user-filter");
if (userFilter) {
  userFilter.addEventListener("change", () => {
    loadTasksFromDatabase();
  });
}

const showCompletedBtn = document.getElementById("show-completed-btn");
if (showCompletedBtn) {
  showCompletedBtn.addEventListener("click", () => {
    showCompletedOnly = !showCompletedOnly;
    showCompletedBtn.classList.toggle("active", showCompletedOnly);
    showCompletedBtn.textContent = showCompletedOnly
      ? "Aktif Görevler"
      : "Tamamlanmış Görevler";
    loadTasksFromDatabase();
  });
}
const userName = localStorage.getItem("userName") || "Kullanıcı";
document.getElementById("current-user-name").textContent = userName;

const userNameEl = document.getElementById("current-user-name");
if (userNameEl) {
  userNameEl.style.cursor = "pointer";
  userNameEl.title = "Ayarlar";
  userNameEl.addEventListener("click", function () {
    window.location.href = "user-settings.html";
  });
}
// Add hover effect for user name
userNameEl.addEventListener("mouseover", function () {
  userNameEl.style.textDecoration = "underline";
});
userNameEl.addEventListener("mouseout", function () {
  userNameEl.style.textDecoration = "none";
});
