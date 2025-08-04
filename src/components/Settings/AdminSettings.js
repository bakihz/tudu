// Sayfa yüklendiğinde kullanıcıları getir
document.addEventListener("DOMContentLoaded", function () {
  loadUsers();
});

// Kullanıcıları yükle
async function loadUsers() {
  const loadingDiv = document.getElementById("loading");
  const alertContainer = document.getElementById("alert-container");

  try {
    loadingDiv.style.display = "block";
    clearAlerts();

    const response = await fetch("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Kullanıcılar yüklenirken hata oluştu");
    }

    displayUsers(result.users || result);
  } catch (error) {
    console.error("Kullanıcılar yüklenirken hata:", error);
    showAlert("Hata: " + error.message, "danger");
  } finally {
    loadingDiv.style.display = "none";
  }
}

// Kullanıcıları göster
function displayUsers(users) {
  const usersList = document.getElementById("users-list");

  if (!users || users.length === 0) {
    usersList.innerHTML = "<p>Kullanıcı bulunamadı.</p>";
    return;
  }

  let html = "";
  users.forEach((user) => {
    html += `
            <div class="user-card" data-user-id="${user.UserID}">
                <div class="user-info">
                    <div class="user-details">
                        <h3>${user.UserName}</h3>
                        <p class="user-type">Kullanıcı Tipi: ${
                          user.UserType || "Standart"
                        }</p>
                    </div>
                    <button class="btn btn-warning" onclick="togglePasswordForm(${
                      user.UserID
                    })">
                        🔑 Şifre Değiştir
                    </button>
                </div>

                <div class="password-change-form" id="password-form-${
                  user.UserID
                }">
                    <form onsubmit="changePassword(event, ${user.UserID}, '${
      user.UserName
    }')">
                        <div class="form-group">
                            <label for="new-password-${
                              user.UserID
                            }">Yeni Şifre:</label>
                            <input 
                                type="password" 
                                id="new-password-${user.UserID}" 
                                name="newPassword" 
                                required 
                                placeholder="Yeni şifre girin"
                                oninput="checkPasswordStrength(this, ${
                                  user.UserID
                                })"
                            >
                            <div class="password-strength">
                                <div class="password-strength-bar" id="strength-bar-${
                                  user.UserID
                                }"></div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm-password-${
                              user.UserID
                            }">Şifre Tekrar:</label>
                            <input 
                                type="password" 
                                id="confirm-password-${user.UserID}" 
                                name="confirmPassword" 
                                required 
                                placeholder="Şifreyi tekrar girin"
                            >
                        </div>

                        <div style="margin-top: 15px;">
                            <button type="submit" class="btn btn-success">
                                ✅ Şifreyi Değiştir
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="togglePasswordForm(${
                              user.UserID
                            })">
                                ❌ İptal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
  });

  usersList.innerHTML = html;
}

// Şifre formunu aç/kapat
function togglePasswordForm(userId) {
  const form = document.getElementById(`password-form-${userId}`);
  const isVisible = form.style.display === "block";

  // Tüm formları kapat
  document.querySelectorAll(".password-change-form").forEach((f) => {
    f.style.display = "none";
  });

  // Bu formu aç/kapat
  if (!isVisible) {
    form.style.display = "block";
    document.getElementById(`new-password-${userId}`).focus();
  }
}

// Şifre gücünü kontrol et (sadece bilgilendirici)
function checkPasswordStrength(input, userId) {
  const password = input.value;
  const strengthBar = document.getElementById(`strength-bar-${userId}`);

  if (password.length === 0) {
    strengthBar.style.width = "0%";
    strengthBar.className = "password-strength-bar";
    return;
  }

  let strength = 0;
  if (password.length >= 1) strength += 20;
  if (password.length >= 4) strength += 20;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;

  strengthBar.style.width = strength + "%";

  if (strength <= 40) {
    strengthBar.className = "password-strength-bar strength-weak";
  } else if (strength <= 80) {
    strengthBar.className = "password-strength-bar strength-medium";
  } else {
    strengthBar.className = "password-strength-bar strength-strong";
  }
}

// Şifre değiştir
async function changePassword(event, userId, userName) {
  event.preventDefault();

  const newPassword = document.getElementById(`new-password-${userId}`).value;
  const confirmPassword = document.getElementById(
    `confirm-password-${userId}`
  ).value;

  // Şifre kontrolü
  if (newPassword !== confirmPassword) {
    showAlert("Şifreler eşleşmiyor!", "danger");
    return;
  }

  if (newPassword.trim() === "") {
    showAlert("Şifre boş olamaz!", "danger");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Şifre değiştirilemedi");
    }

    showAlert(
      `${userName} kullanıcısının şifresi başarıyla değiştirildi!`,
      "success"
    );

    // Formu kapat ve temizle
    togglePasswordForm(userId);
    document.getElementById(`new-password-${userId}`).value = "";
    document.getElementById(`confirm-password-${userId}`).value = "";
  } catch (error) {
    console.error("Şifre değiştirme hatası:", error);
    showAlert("Hata: " + error.message, "danger");
  }
}

// Alert göster
function showAlert(message, type) {
  const alertContainer = document.getElementById("alert-container");
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  alertContainer.appendChild(alertDiv);

  // 5 saniye sonra alert'i kaldır
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
}

// Alert'leri temizle
function clearAlerts() {
  const alertContainer = document.getElementById("alert-container");
  alertContainer.innerHTML = "";
}
