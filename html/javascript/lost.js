import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("lostForm");
  const itemName = document.getElementById("itemName");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const dateLost = document.getElementById("dateLost");
  const locationInput = document.getElementById("location");
  const image = document.getElementById("image");
  const msg = document.getElementById("lost_msg");
  const fileName = document.getElementById("fileName");
  const uploadBar = document.getElementById("uploadBar");

  if (!form) return;

  // Restrict future dates
  if (dateLost) {
    const today = new Date().toISOString().split("T")[0];
    dateLost.setAttribute("max", today);
  }

  // Upload bar + filename display
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

    if (
      !itemName.value ||
      !category.value ||
      !description.value ||
      !dateLost.value ||
      !locationInput.value ||
      !image.files[0]
    ) {
      if (msg) {
        msg.style.color = "#ff6b6b";
        msg.textContent = "Please fill all fields and upload an image.";
      }
      return;
    }

    const formData = new FormData();
    formData.append("item_name", itemName.value);
    formData.append("category", category.value);
    formData.append("description", description.value);
    formData.append("date", dateLost.value);
    formData.append("location", locationInput.value);
    formData.append("image", image.files[0]);

    try {
      const response = await apiRequest("/api/reports/?type=lost", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      if (msg) {
        msg.style.color = "lightgreen";
        msg.textContent = "Report submitted successfully!";
      }

      const reportId = data.message?.id;

      // Small delay so user sees message
      setTimeout(() => {
        if (reportId) {
          window.location.href = `report-matches.html?id=${reportId}`;
        }
      }, 800);

      form.reset();
      if (fileName) fileName.textContent = "";
      if (uploadBar) uploadBar.style.width = "0%";

    } catch (error) {
      console.error("Error:", error);
      if (msg) {
        msg.style.color = "#ff6b6b";
        msg.textContent = "Submission failed.";
      }
    }
  });

});