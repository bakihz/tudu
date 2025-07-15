document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("user-settings-form");
  const message = document.getElementById("settings-message");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      message.className = "";

      const username = localStorage.getItem("userName");
      const currentPassword = form["current-password"].value;
      const newPassword = form["new-password"].value;
      const confirmPassword = form["confirm-password"].value;

      if (newPassword !== confirmPassword) {
        message.textContent = "Yeni şifreler eşleşmiyor.";
        message.className = "error";
        return;
      }

      // TODO: Replace with your real API call
      try {
        // Example: send to backend via fetch or ipcRenderer

        const res = await fetch("http://localhost:3000/api/user/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            currentPassword,
            newPassword,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        // Simulate success
        setTimeout(() => {
          message.textContent = "Ayarlar başarıyla güncellendi.";
          message.className = "success";
          form.reset();
        }, 800);
      } catch (err) {
        message.textContent = err.message || "Bir hata oluştu.";
        message.className = "error";
      }
    });
  }
});
const userType = localStorage.getItem("userType");
const addUserBtn = document.getElementById("add-user-btn");
if (userType === "admin" && addUserBtn) {
  addUserBtn.style.display = "block";
}
if (addUserBtn) {
  addUserBtn.addEventListener("click", function () {
    window.location.href = "add-user.html";
  });
}

const addUserForm = document.getElementById("add-user-form");
if (addUserForm) {
  addUserForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const userType = document.getElementById("user-type").value;

    if (!username || !password || !userType) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, userType }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById("add-user-message").innerText =
          "Kullanıcı başarıyla eklendi.";
      } else {
        document.getElementById("add-user-message").innerText =
          result.message || "Bir hata oluştu.";
      }
    } catch (err) {
      document.getElementById("add-user-message").innerText =
        "Bir hata oluştu.";
    }
  });
}
