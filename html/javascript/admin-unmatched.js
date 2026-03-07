import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  setProfile();
  setupFilters();
  fetchUnmatchedReports();
});


/* ── Filters ── */

function setupFilters() {
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");

  if (applyBtn) applyBtn.addEventListener("click", fetchUnmatchedReports);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterStatus").value   = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("filterLocation").value = "";
      document.getElementById("filterDateFrom").value = "";
      document.getElementById("filterDateTo").value   = "";
      document.getElementById("filterSearch").value   = "";
      fetchUnmatchedReports();
    });
  }
}


/* ── Fetch unmatched reports ── */

async function fetchUnmatchedReports() {

  const container = document.getElementById("reportsContainer");

  container.innerHTML = `
    <div class="loading-state">
      <span class="material-symbols-outlined spin">autorenew</span>
      <p>Loading unmatched reports...</p>
    </div>
  `;

  // build query params from filters
  const params = new URLSearchParams();

  const status   = document.getElementById("filterStatus")?.value;
  const category = document.getElementById("filterCategory")?.value;
  const location = document.getElementById("filterLocation")?.value;
  const dateFrom = document.getElementById("filterDateFrom")?.value;
  const dateTo   = document.getElementById("filterDateTo")?.value;
  const search   = document.getElementById("filterSearch")?.value;

  if (status)   params.append("status",    status);
  if (category) params.append("category",  category);
  if (location) params.append("location",  location);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo)   params.append("date_to",   dateTo);
  if (search)   params.append("search",    search);

  const query = params.toString() ? `?${params.toString()}` : "";

  try {

    const res = await apiRequest(`/api/admin/reports/unmatched/${query}`);

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data    = await res.json();
    const reports = data.message || [];

    if (!reports.length) {
      container.innerHTML = `
        <div class="loading-state">
          <span class="material-symbols-outlined">inbox</span>
          <p>No unmatched reports found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    reports.forEach(report => {
      container.appendChild(buildReportCard(report));
    });

  } catch (err) {
    console.error("Unmatched reports error:", err);
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">error</span>
        <p>Failed to load unmatched reports.</p>
      </div>
    `;
  }

}


/* ── Build report card ── */

function buildReportCard(report) {

  const card = document.createElement("div");
  card.className = "match-card";

  card.innerHTML = `
    <div class="report-block">
      <h3>${report.report_type === "lost" ? "Lost Report" : "Found Report"}</h3>
      ${report.image_url ? `<img src="${report.image_url}" class="report-img">` : ""}
      <h4>${report.item_name}</h4>
      <p><b>Category:</b> ${report.category}</p>
      <p><b>Location:</b> ${report.location}</p>
      <p><b>Date:</b> ${report.date}</p>
      <p>${report.description}</p>
      <p class="email">${report.reported_by_email}</p>
    </div>

    <div class="match-footer">
      <div class="unmatched-badge">Unmatched</div>
    </div>
  `;

  return card;
}


/* ── Profile ── */

function setProfile() {
  const username  = localStorage.getItem("name") || "User";
  const firstName = username.split(" ")[0];
  const initial   = firstName.charAt(0).toUpperCase();

  document.getElementById("profileCircle").innerText = initial;
  document.getElementById("profileName").innerText   = firstName;
}