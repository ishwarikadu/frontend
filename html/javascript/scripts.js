console.log("JS loaded");
const light = document.createElement("div");
light.classList.add("light");
document.body.appendChild(light);

document.addEventListener("mousemove", (e) => {
    light.style.left = e.clientX + "px";
    light.style.top = e.clientY + "px";
});