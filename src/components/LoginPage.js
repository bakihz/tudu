document.addEventListener("DOMContentLoaded", function () {
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    usernameInput.focus();
  }
});

// Check if the user is already logged in
if (localStorage.getItem("userId")) {
  // Redirect to the main app page
  window.location.href = "tasks.html";
}

document
  .getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form submission

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      // Send login credentials to the server
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        window.currentUserId = result.userId;
        localStorage.setItem("currentUserId", result.userId);
        window.currentUserType = result.userType;
        localStorage.setItem("userType", result.userType);
        window.currentUserName = result.userName || "Siz";
        console.log("User Name:", window.currentUserName);
        localStorage.setItem("userName", window.currentUserName);
        // After successful login
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("userType", result.userType);
        localStorage.setItem("userName", result.userName);
        window.location.href = "./tasks.html";
      } else {
        showCustomAlert(
          result.message || "Invalid username or password. Please try again."
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  });

function showCustomAlert(message) {
  let modal = document.getElementById("custom-alert-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-alert-modal";
    modal.innerHTML = `
      <div class="custom-alert-box">
        <div style="margin-bottom:18px;">${message}</div>
        <button id="custom-alert-ok" autofocus>Tamam</button>
      </div>
    `;
    document.body.appendChild(modal);
    const okBtn = document.getElementById("custom-alert-ok");
    okBtn.onclick = () => {
      modal.remove();
    };
    okBtn.focus();
    // Listen for Enter key to close the alert
    modal.addEventListener("keydown", function handler(e) {
      if (e.key === "Enter") {
        modal.remove();
      }
    });
    // Focus the modal for keyboard events
    modal.tabIndex = -1;
    modal.focus();
  }
  modal.style.display = "flex";
}
