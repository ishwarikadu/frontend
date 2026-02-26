import { apiRequest } from "./api.js";
document.addEventListener("DOMContentLoaded", () => {
  setProfile();
  fetchReports();
});

async function fetchReports() {
  try {
    const res = await apiRequest("/api/reports/");
    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("FULL RESPONSE:", data);

    let reports = [];

    if (data.message && Array.isArray(data.message.results)) {
      reports = data.message.results;
    }

    renderReports(reports);

  } catch (err) {
    console.error("Error fetching reports:", err);
  }
}

function renderReports(reports) {
  const container = document.getElementById("reportsGrid");
  container.innerHTML = "";

  if (!reports || reports.length === 0) {
    container.innerHTML = "<p>No reports found.</p>";
    return;
  }

  reports.forEach(report => {
    const card = document.createElement("div");
    card.className = "report-card";

    card.innerHTML = `
      ${report.image_url ? `<img src="${report.image_url}" class="report-img">` : ""}
      <div class="report-content">
        <h3>${report.item_name}</h3>
        <span class="status-badge ${report.status.toLowerCase()}">${report.status}</span>
        <p>${report.description}</p>
        <div class="report-meta">
          <span><strong>Category:</strong> ${report.category}</span>
          <span><strong>Date:</strong> ${report.date}</span>
          <span><strong>Location:</strong> ${report.location}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function setProfile() {
  const username = localStorage.getItem("name") || "User";
  const firstName = username.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  document.getElementById("profileCircle").innerText = initial;
  document.getElementById("profileName").innerText = firstName;
}