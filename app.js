// TEMPORARY: simulate login to preview dashboard

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");

// Fake login toggle (for UI testing only)
document.querySelector("button").addEventListener("click", () => {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
});
