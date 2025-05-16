document.addEventListener("DOMContentLoaded", function () {
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    usernameInput.focus();
  }
});

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
        // Redirect based on user type
        if (result.userType === "admin") {
          window.location.href = "admin.html";
        } else if (result.userType === "user") {
          window.location.href = "user.html";
        }
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
