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
        alert(
          result.message || "Invalid username or password. Please try again."
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again later.");
    }
  });
