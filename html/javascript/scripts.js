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

  