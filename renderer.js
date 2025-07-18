const func = async () => {
  const response = await window.versions.ping();
  console.log(response); // "pong"
};
func();

import PImage from "pureimage";

async function createBadge(count) {
  const size = 64;
  const img = PImage.make(size, size);
  const ctx = img.getContext("2d");

  // Background circle
  ctx.fillStyle = "#007bff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "30pt Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(count > 99 ? "99+" : String(count), size / 2, size / 2);

  const bufferChunks = [];
  const stream = PImage.encodePNGToStream(img, {
    write: (chunk) => bufferChunks.push(chunk),
    end: () => {
      const buffer = Buffer.concat(bufferChunks);
      window.electronAPI.sendBadgeBuffer(buffer);
    },
  });
}

function updateBadgeCount(tasks) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const currentUserId = localStorage.getItem("currentUserId");
  const waitingCount = tasks.filter(
    (task) =>
      !task.Tick &&
      !task.isDeleted &&
      task.Deadline &&
      new Date(task.Deadline) <= now &&
      String(task.UserID) === String(currentUserId)
  ).length;

  window.api.sendBadgeCount(waitingCount);
}

document.getElementById("setBadge").addEventListener("click", () => {
  const count = parseInt(document.getElementById("countInput").value, 10);
  createBadge(count);
});

window.api.showNotification({ title: "Başlık", body: "Mesaj" });
