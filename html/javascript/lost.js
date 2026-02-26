import { apiRequest } from "./api.js";
document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("lostForm");
  const itemName = document.getElementById("itemName");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const dateLost = document.getElementById("dateLost");
  const location = document.getElementById("location");
  const image = document.getElementById("image");
  const msg = document.getElementById("lost_msg");
  const fileName = document.getElementById("fileName");
  const uploadBar = document.getElementById("uploadBar");

  const today = new Date().toISOString().split("T")[0];
  dateLost.setAttribute("max", today);

  image.addEventListener("change", function () {
    if (this.files.length > 0) {
      fileName.textContent = "Attached: " + this.files[0].name;
      uploadBar.style.width = "100%";
    } else {
      fileName.textContent = "";
      uploadBar.style.width = "0%";
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!itemName.value || !category.value || !description.value ||
        !dateLost.value || !location.value || !image.files[0]) {

      msg.style.color = "#ff6b6b";
      msg.textContent = "Please fill all fields and upload an image.";
      return;
    }

    const formData = new FormData();
    formData.append("item_name", itemName.value);
    formData.append("category", category.value);
    formData.append("description", description.value);
    formData.append("date", dateLost.value);
    formData.append("location", location.value); 
    formData.append("image", image.files[0]);

    try {
      const response = await apiRequest("/api/reports/", {
  method: "POST",
  body: formData
});
      if (!response.ok) throw new Error();

      msg.style.color = "lightgreen";
      msg.textContent = "Report submitted successfully!";
      form.reset();
      uploadBar.style.width = "0%";

    } catch {
      msg.style.color = "#ff6b6b";
      msg.textContent = "Submission failed.";
    }
  });

});