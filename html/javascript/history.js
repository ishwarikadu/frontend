import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  setProfile();
  fetchReports();
});

async function fetchReports() {
  try {
    const res = await apiRequest("/api/reports/");
    const data = await res.json();

    const reports = data.message?.results || [];

    renderReports(reports);

  } catch (err) {
    console.error("Error fetching reports:", err);
  }
}

async function renderReports(reports) {

  const container = document.getElementById("reportsGrid");
  container.innerHTML = "";

  if (!reports.length) {
    container.innerHTML = `<p>No reports yet.</p>`;
    return;
  }

  for (const report of reports) {

    const card = document.createElement("div");
    card.className = "report-card";

    let extraSection = "";

    /* LOST REPORT */
    if (report.status === "LOST") {

      try {

        const matchRes = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();

        // FIX: The array is in matchData.message, NOT matchData.data
        const matches = Array.isArray(matchData.message) ? matchData.message : [];

        // DEBUG: remove once contact is confirmed working
        console.log(`LOST report ${report.id} matches:`, matches.map(m => ({ id: m.id, status: m.status })));

        const approvedMatch = matches.find(m => m.status === "APPROVED");

        if (approvedMatch) {

          extraSection = `
            <div class="info-badge approved">
              Match Found &amp; Approved!
            </div>
            <div class="contact-box">
              Contact Finder:
              <a href="mailto:${approvedMatch.found_reporter_email}">
                ${approvedMatch.found_reporter_email}
              </a>
            </div>
            <button class="history-btn view-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">search</span>
              View Matches
            </button>
          `;

        } else {

          extraSection = `
            <button class="history-btn view-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">search</span>
              View Matches
            </button>
          `;

        }

      } catch (err) {
        console.error("Error fetching matches for LOST report:", err);
        extraSection = `
          <button class="history-btn view-btn" data-id="${report.id}">
            <span class="material-symbols-outlined">search</span>
            View Matches
          </button>
        `;
      }

    }

    /* FOUND REPORT */
    else if (report.status === "FOUND") {

      try {

        const matchRes = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();

        // FIX: The array is in matchData.message, NOT matchData.data
        const matches = Array.isArray(matchData.message) ? matchData.message : [];

        const pendingMatch  = matches.find(m => m.status === "PENDING");
        const approvedMatch = matches.find(m => m.status === "APPROVED");

        if (approvedMatch) {

          extraSection = `
            <div class="info-badge approved">
              Claim Approved
            </div>
          `;

        } else if (pendingMatch) {

          extraSection = `
            <div class="info-badge pending">
              Claim Pending (Waiting for admin approval)
            </div>
          `;

        } else {

          extraSection = `
            <div class="info-badge waiting">
              Waiting for someone to claim
            </div>
          `;

        }

      } catch (err) {
        console.error("Error checking match status:", err);
      }

    }

    /* RETURNED REPORT */
    else if (report.status === "RETURNED") {

      try {

        const matchRes = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();

        // FIX: The array is in matchData.message, NOT matchData.data
        const matches = Array.isArray(matchData.message) ? matchData.message : [];

        const approvedMatch = matches.find(m => m.status === "APPROVED");

        if (approvedMatch) {

          extraSection = `
            <div class="info-badge approved">
              Match Approved
            </div>
            <div class="contact-box">
              Contact Finder:
              <a href="mailto:${approvedMatch.found_reporter_email}">
                ${approvedMatch.found_reporter_email}
              </a>
            </div>
          `;

        }

      } catch (err) {
        console.error("Error fetching approved match:", err);
      }

    }

    card.innerHTML = `
      ${report.image_url ? `<img src="${report.image_url}" class="report-img">` : ""}

      <div class="report-content">

        <h3>${report.item_name || "Unnamed Item"}</h3>

        <span class="status-badge ${report.status.toLowerCase()}">
          ${report.status}
        </span>

        <p>${report.description || ""}</p>

        <div class="report-meta">
          <span><strong>Category:</strong> ${report.category}</span>
          <span><strong>Date:</strong> ${report.date}</span>
          <span><strong>Location:</strong> ${report.location}</span>
        </div>

        ${extraSection}

      </div>
    `;

    container.appendChild(card);
  }

  /* View Matches button */
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `report-matches.html?id=${id}`;
    });
  });

}

function setProfile() {

  const username = localStorage.getItem("name") || "User";
  const firstName = username.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  document.getElementById("profileCircle").innerText = initial;
  document.getElementById("profileName").innerText = firstName;

}