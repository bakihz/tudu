require("dotenv").config();
const { execSync } = require("child_process");

console.log("GH_TOKEN loaded:", process.env.GH_TOKEN ? "YES" : "NO");

try {
  execSync("electron-builder --publish=always", { stdio: "inherit" });
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
