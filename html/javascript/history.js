import { apiRequest } from "./api.js";

let activeTab = "my"; // "my" or "all"

document.addEventListener("DOMContentLoaded", () => {
  setProfile();
  setupTabs();
  setupFilters();
  fetchReports();
});


/* ── Tabs ── */

function setupTabs() {
  const myTab  = document.getElementById("tabMyReports");
  const allTab = document.getElementById("tabAllReports");

  if (myTab) {
    myTab.addEventListener("click", () => {
      activeTab = "my";
      myTab.classList.add("active");
      allTab.classList.remove("active");
      fetchReports();
    });
  }

  if (allTab) {
    allTab.addEventListener("click", () => {
      activeTab = "all";
      allTab.classList.add("active");
      myTab.classList.remove("active");
      fetchReports();
    });
  }
}


/* ── Filters ── */

function setupFilters() {
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");

  if (applyBtn) applyBtn.addEventListener("click", fetchReports);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterStatus").value   = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("filterLocation").value = "";
      document.getElementById("filterDateFrom").value = "";
      document.getElementById("filterDateTo").value   = "";
      fetchReports();
    });
  }
}


/* ── Fetch reports ── */

async function fetchReports() {

  const container = document.getElementById("reportsGrid");

  container.innerHTML = `
    <div class="loading-state">
      <span class="material-symbols-outlined spin">autorenew</span>
      <p>Loading reports...</p>
    </div>
  `;

  const params = new URLSearchParams();

  const status   = document.getElementById("filterStatus")?.value;
  const category = document.getElementById("filterCategory")?.value;
  const location = document.getElementById("filterLocation")?.value;
  const dateFrom = document.getElementById("filterDateFrom")?.value;
  const dateTo   = document.getElementById("filterDateTo")?.value;
  const email    = localStorage.getItem("email");

  if (status)   params.append("status",      status);
  if (category) params.append("category",    category);
  if (location) params.append("location",    location);
  if (dateFrom) params.append("date_from",   dateFrom);
  if (dateTo)   params.append("date_to",     dateTo);

  // only filter by email on My Reports tab
  if (activeTab === "my" && email) {
    params.append("reported_by", email);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  try {
    const res  = await apiRequest(`/api/reports/${query}`);
    const data = await res.json();

    const reports = data.message?.results || [];
    renderReports(reports);

  } catch (err) {
    console.error("Error fetching reports:", err);
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">error</span>
        <p>Failed to load reports. Please try again.</p>
      </div>
    `;
  }
}


/* ── Delete report ── */

async function deleteReport(id) {
  const confirmed = confirm("Are you sure you want to delete this report? This cannot be undone.");
  if (!confirmed) return;

  try {
    const res = await apiRequest(`/api/reports/${id}/`, { method: "DELETE" });

    if (res.ok) {
      fetchReports();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete report.");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Something went wrong. Please try again.");
  }
}


/* ── Render reports ── */

async function renderReports(reports) {

  const container = document.getElementById("reportsGrid");
  const email     = localStorage.getItem("email");
  container.innerHTML = "";

  if (!reports.length) {
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">inbox</span>
        <p>No reports found.</p>
      </div>
    `;
    return;
  }

  for (const report of reports) {

    const card       = document.createElement("div");
    card.className   = "report-card";
    const isOwner    = report.reported_by_email === email;

    let extraSection = "";

    /* LOST REPORT */
    if (report.status === "LOST") {

      try {
        const matchRes  = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();
        const matches   = Array.isArray(matchData.message) ? matchData.message : [];

        const approvedMatch = matches.find(m => m.status === "APPROVED");

        if (approvedMatch) {
          extraSection = `
            <div class="info-badge approved">Match Found &amp; Approved!</div>
            <div class="contact-box">
              Contact Finder:
              <a href="mailto:${approvedMatch.found_reporter_email}">
                ${approvedMatch.found_reporter_email}
              </a>
            </div>
            <div class="report-actions">
              <button class="history-btn view-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">search</span>
                View Matches
              </button>
              ${isOwner ? `
              <button class="history-btn delete-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">delete</span>
                Delete
              </button>` : ""}
            </div>
          `;
        } else {
          extraSection = `
            <div class="report-actions">
              <button class="history-btn view-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">search</span>
                View Matches
              </button>
              ${isOwner ? `
              <button class="history-btn delete-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">delete</span>
                Delete
              </button>` : ""}
            </div>
          `;
        }

      } catch (err) {
        console.error("Error fetching matches for LOST report:", err);
        extraSection = `
          <div class="report-actions">
            <button class="history-btn view-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">search</span>
              View Matches
            </button>
            ${isOwner ? `
            <button class="history-btn delete-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">delete</span>
              Delete
            </button>` : ""}
          </div>
        `;
      }

    }

    /* FOUND REPORT */
    else if (report.status === "FOUND") {

      try {
        const matchRes  = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();
        const matches   = Array.isArray(matchData.message) ? matchData.message : [];

        const pendingMatch  = matches.find(m => m.status === "PENDING");
        const approvedMatch = matches.find(m => m.status === "APPROVED");

        let badge = "";
        if (approvedMatch) {
          badge = `<div class="info-badge approved">Claim Approved</div>`;
        } else if (pendingMatch) {
          badge = `<div class="info-badge pending">Claim Pending (Waiting for admin approval)</div>`;
        } else {
          badge = `<div class="info-badge waiting">Waiting for someone to claim</div>`;
        }

        extraSection = `
          ${badge}
          <div class="report-actions">
            ${isOwner ? `
            <button class="history-btn delete-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">delete</span>
              Delete
            </button>` : ""}
          </div>
        `;

      } catch (err) {
        console.error("Error checking match status:", err);
        extraSection = `
          <div class="report-actions">
            ${isOwner ? `
            <button class="history-btn delete-btn" data-id="${report.id}">
              <span class="material-symbols-outlined">delete</span>
              Delete
            </button>` : ""}
          </div>
        `;
      }

    }

    /* RETURNED REPORT */
    else if (report.status === "RETURNED") {

      try {
        const matchRes  = await apiRequest(`/api/reports/${report.id}/matches/`);
        const matchData = await matchRes.json();
        const matches   = Array.isArray(matchData.message) ? matchData.message : [];

        const approvedMatch = matches.find(m => m.status === "APPROVED");

        if (approvedMatch) {
          extraSection = `
            <div class="info-badge approved">Match Approved</div>
            <div class="contact-box">
              Contact Finder:
              <a href="mailto:${approvedMatch.found_reporter_email}">
                ${approvedMatch.found_reporter_email}
              </a>
            </div>
            <div class="report-actions">
              ${isOwner ? `
              <button class="history-btn delete-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">delete</span>
                Delete
              </button>` : ""}
            </div>
          `;
        } else {
          extraSection = `
            <div class="report-actions">
              ${isOwner ? `
              <button class="history-btn delete-btn" data-id="${report.id}">
                <span class="material-symbols-outlined">delete</span>
                Delete
              </button>` : ""}
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
        <span class="status-badge ${report.status.toLowerCase()}">${report.status}</span>
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

  /* View Matches buttons */
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `report-matches.html?id=${btn.dataset.id}`;
    });
  });

  /* Delete buttons */
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteReport(btn.dataset.id);
    });
  });

}


/* ── Profile ── */

function setProfile() {
  const username  = localStorage.getItem("name") || "User";
  const firstName = username.split(" ")[0];
  const initial   = firstName.charAt(0).toUpperCase();

  document.getElementById("profileCircle").innerText = initial;
  document.getElementById("profileName").innerText   = firstName;
}