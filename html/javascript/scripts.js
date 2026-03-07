import { apiRequest } from "./api.js";
console.log("JS loaded");
const light = document.createElement("div");
light.classList.add("light");
document.body.appendChild(light);

document.addEventListener("mousemove", (e) => {
    light.style.left = e.clientX + "px";
    light.style.top = e.clientY + "px";
});
document.addEventListener("DOMContentLoaded", function () {
    const name = localStorage.getItem("name");
    const greeting = "Good to see you";

    if (name) {
        document.getElementById("welcomeText").innerText =
            `${greeting}, ${name}`;
    } else {
        document.getElementById("welcomeText").innerText = greeting;
    }
});

import { showLoading, showEmpty, showError } from './utils/loading.js';

const container = document.getElementById("matchesContainer");

// 1. show spinner immediately
showLoading(container, "Loading rejected matches...");

try {
  const res = await apiRequest("/api/matches/rejected/");
  const data = await res.json();
  const matches = Array.isArray(data.message) ? data.message : [];

  if (!matches.length) {
    showEmpty(container, "No rejected matches found.");  // 2. empty
    return;
  }

  // render your cards...

} catch (err) {
  showError(container, "Failed to load. Please try again.");  // 3. error
}
  