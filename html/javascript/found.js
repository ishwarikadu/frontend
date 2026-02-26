import { apiRequest } from "./api.js";
document.getElementById("foundForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("item_name", itemName.value);
  formData.append("category", category.value);
  formData.append("description", description.value);
  formData.append("date", date.value);
  formData.append("location", location.value);
  formData.append("status", "FOUND");

  if (image.files[0]) {
    formData.append("image", image.files[0]);
  }

  try {
    const response = await apiRequest("/api/reports/", {
  method: "POST",
  body: formData
});
    const data = await response.json();

    if (!response.ok) {
      msg.style.color = "#ff6b6b";
      msg.textContent = "Validation failed.";
      console.log(data);
      return;
    }

    msg.style.color = "lightgreen";
    msg.textContent = "Found report submitted successfully!";

  } catch (err) {
    msg.style.color = "#ff6b6b";
    msg.textContent = "Submission failed.";
  }
});

image.addEventListener("change", function() {
  if (this.files.length > 0) {
    fileName.textContent = "Attached: " + this.files[0].name;
    uploadBar.style.width = "100%";
  } else {
    fileName.textContent = "";
    uploadBar.style.width = "0%";
  }
});