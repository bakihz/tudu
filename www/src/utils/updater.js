// Auto-updater UI handler
class UpdateManager {
  constructor() {
    this.init();
  }

  init() {
    // Güncelleme mevcut olduğunda
    window.api.onUpdateAvailable((event, info) => {
      this.showUpdateAvailable(info);
    });

    // İndirme ilerlemesi
    window.api.onDownloadProgress((event, progress) => {
      this.showDownloadProgress(progress);
    });

    // Güncelleme indirildiğinde
    window.api.onUpdateDownloaded((event, info) => {
      this.showUpdateReady(info);
    });
  }

  showUpdateAvailable(info) {
    // Güncelleme mevcut bildirimi
    const notification = this.createNotification(
      "Güncelleme Mevcut",
      `Yeni sürüm ${info.version} mevcut. İndiriliyor...`,
      "info"
    );
    this.showNotification(notification);

    console.log("Güncelleme mevcut:", info.version);
  }

  showDownloadProgress(progress) {
    // Progress bar güncelle (eğer varsa)
    const percent = Math.round(progress.percent);
    console.log(`İndirme: %${percent}`);

    // Önceki progress notification'ı kaldır ve yenisini göster
    this.removeNotificationsByType("progress");

    if (percent < 100) {
      const notification = this.createNotification(
        "Güncelleme İndiriliyor",
        `İlerleme: %${percent} (${this.formatBytes(
          progress.transferred
        )}/${this.formatBytes(progress.total)})`,
        "progress"
      );
      this.showNotification(notification);
    }
  }

  showUpdateReady(info) {
    // İndirme tamamlandı, yeniden başlatma bildirimi
    this.removeNotificationsByType("progress");

    const notification = this.createNotification(
      "Güncelleme Hazır",
      `Sürüm ${info.version} indirildi. Uygulama 5 saniye içinde yeniden başlatılacak.`,
      "success"
    );
    this.showNotification(notification, 4000);

    console.log("Güncelleme hazır, yeniden başlatılıyor...");
  }

  createNotification(title, message, type = "info") {
    return {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date(),
    };
  }

  showNotification(notification, duration = 3000) {
    // Toast notification oluştur
    const toast = document.createElement("div");
    toast.className = `update-toast update-toast-${notification.type}`;
    toast.setAttribute("data-id", notification.id);
    toast.setAttribute("data-type", notification.type);

    toast.innerHTML = `
            <div class="update-toast-content">
                <div class="update-toast-title">${notification.title}</div>
                <div class="update-toast-message">${notification.message}</div>
            </div>
            <button class="update-toast-close" onclick="this.parentElement.remove()">×</button>
        `;

    // Container yoksa oluştur
    let container = document.querySelector(".update-notifications");
    if (!container) {
      container = document.createElement("div");
      container.className = "update-notifications";
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // CSS yoksa ekle
    this.injectStyles();

    // Otomatik kaldır
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);

    // System notification da gönder
    if (window.api && window.api.showNotification) {
      window.api.showNotification({
        title: notification.title,
        body: notification.message,
      });
    }
  }

  removeNotificationsByType(type) {
    const notifications = document.querySelectorAll(`[data-type="${type}"]`);
    notifications.forEach((notification) => notification.remove());
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  injectStyles() {
    if (document.querySelector("#update-styles")) return;

    const styles = document.createElement("style");
    styles.id = "update-styles";
    styles.textContent = `
            .update-notifications {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }

            .update-toast {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 15px;
                display: flex;
                align-items: flex-start;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #007bff;
            }

            .update-toast-info {
                border-left-color: #007bff;
            }

            .update-toast-success {
                border-left-color: #28a745;
            }

            .update-toast-progress {
                border-left-color: #ffc107;
            }

            .update-toast-content {
                flex: 1;
            }

            .update-toast-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }

            .update-toast-message {
                color: #666;
                font-size: 14px;
                line-height: 1.4;
            }

            .update-toast-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #999;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .update-toast-close:hover {
                color: #333;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
    document.head.appendChild(styles);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.updateManager = new UpdateManager();
  });
} else {
  window.updateManager = new UpdateManager();
}
