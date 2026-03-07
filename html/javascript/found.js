import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("foundForm");
  const itemName = document.getElementById("itemName");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const date = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  date.setAttribute("max", today);
  const locationInput = document.getElementById("location");
  const image = document.getElementById("image");
  const msg = document.getElementById("found_msg");
  const fileName = document.getElementById("fileName");
  const uploadBar = document.getElementById("uploadBar");
  
  if (!form) return;
  if (image) {
    image.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        if (fileName) {
          fileName.textContent = "Attached: " + this.files[0].name;
        }
        if (uploadBar) {
          uploadBar.style.width = "100%";
        }
      } else {
        if (fileName) fileName.textContent = "";
        if (uploadBar) uploadBar.style.width = "0%";
      }
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Basic validation
    if (!itemName.value || !category.value || !description.value || 
        !date.value || !locationInput.value) {

      if (msg) {
        msg.style.color = "#ff6b6b";
        msg.textContent = "Please fill all required fields.";
      }
      return;
    }

    const formData = new FormData();
    formData.append("item_name", itemName.value);
    formData.append("category", category.value);
    formData.append("description", description.value);
    formData.append("date", date.value);
    formData.append("location", locationInput.value);

    if (image && image.files[0]) {
      formData.append("image", image.files[0]);
    }

    try {
      const response = await apiRequest("/api/reports/?type=found", {
        method: "POST",
        body: formData
      });

      if (!response || !response.ok) {
        if (msg) {
          msg.style.color = "#ff6b6b";
          msg.textContent = "Submission failed.";
        }
        return;
      }

      if (msg) {
        msg.style.color = "lightgreen";
        msg.textContent = "Report submitted successfully!";
      }

      const data = await response.json();
      const reportId = data.message.id;
      window.location.href = `report-matches.html?id=${reportId}`;

      if (fileName) fileName.textContent = "";
      if (uploadBar) uploadBar.style.width = "0%";

    } catch (error) {
      console.error("Error submitting report:", error);
      if (msg) {
        msg.style.color = "#ff6b6b";
        msg.textContent = "Something went wrong.";
      }
    }
  });

});