import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  loadApprovedMatches();
});


/* ── Filters ── */

function setupFilters() {
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");

  if (applyBtn) applyBtn.addEventListener("click", loadApprovedMatches);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterLocation").value = "";
      document.getElementById("filterDateFrom").value = "";
      document.getElementById("filterDateTo").value   = "";
      document.getElementById("filterMinScore").value = "";
      document.getElementById("filterMaxScore").value = "";
      document.getElementById("filterSearch").value   = "";
      loadApprovedMatches();
    });
  }
}


/* ── Fetch approved matches ── */

async function loadApprovedMatches() {

  const container = document.getElementById("approvedMatches");

  container.innerHTML = `
    <div class="loading-state">
      <span class="material-symbols-outlined spin">autorenew</span>
      <p>Loading approved matches...</p>
    </div>
  `;

  // build query params from filters
  const params = new URLSearchParams();

  const location = document.getElementById("filterLocation")?.value;
  const dateFrom = document.getElementById("filterDateFrom")?.value;
  const dateTo   = document.getElementById("filterDateTo")?.value;
  const minScore = document.getElementById("filterMinScore")?.value;
  const maxScore = document.getElementById("filterMaxScore")?.value;
  const search   = document.getElementById("filterSearch")?.value;

  if (location) params.append("location",  location);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo)   params.append("date_to",   dateTo);
  if (minScore) params.append("min_score", minScore);
  if (maxScore) params.append("max_score", maxScore);
  if (search)   params.append("search",    search);

  const query = params.toString() ? `?${params.toString()}` : "";

  try {

    const res = await apiRequest(`/api/matches/approved/${query}`);

    if (!res.ok) {
      const err = await res.json();
      console.error("APPROVED ERROR:", err);
      container.innerHTML = `
        <div class="loading-state">
          <span class="material-symbols-outlined">lock</span>
          <p>Admin access required.</p>
        </div>
      `;
      return;
    }

    const data = await res.json();
    console.log("APPROVED MATCHES:", data);

    const matches = Array.isArray(data.message) ? data.message : [];
    renderMatches(matches);

  } catch (err) {
    console.error("Failed loading approved matches:", err);
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">error</span>
        <p>Failed loading approved matches.</p>
      </div>
    `;
  }

}


/* ── Render matches ── */

function renderMatches(matches) {

  const container = document.getElementById("approvedMatches");
  container.innerHTML = "";

  if (!matches.length) {
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">inbox</span>
        <p>No approved matches yet.</p>
      </div>
    `;
    return;
  }

  matches.forEach(match => {

    const card = document.createElement("div");
    card.className = "match-card";

    card.innerHTML = `
      <div class="match-row">

        <div class="report-block">
          <h3>Lost Report</h3>
          ${match.lost_report?.image_url ? `<img src="${match.lost_report.image_url}" class="report-img">` : ""}
          <h4>${match.lost_report?.item_name || ""}</h4>
          <p><b>Category:</b> ${match.lost_report?.category || ""}</p>
          <p><b>Location:</b> ${match.lost_report?.location || ""}</p>
          <p><b>Date:</b> ${match.lost_report?.date || ""}</p>
          <p>${match.lost_report?.description || ""}</p>
          <p class="email">${match.lost_report?.reported_by_email || ""}</p>
        </div>

        <div class="report-block">
          <h3>Found Report</h3>
          ${match.found_report?.image_url ? `<img src="${match.found_report.image_url}" class="report-img">` : ""}
          <h4>${match.found_report?.item_name || ""}</h4>
          <p><b>Category:</b> ${match.found_report?.category || ""}</p>
          <p><b>Location:</b> ${match.found_report?.location || ""}</p>
          <p><b>Date:</b> ${match.found_report?.date || ""}</p>
          <p>${match.found_report?.description || ""}</p>
          <p class="email">${match.found_report?.reported_by_email || ""}</p>
        </div>

      </div>

      <div class="match-footer">
        <p><b>Match Score:</b> ${match.match_score || 0}</p>
        <p><b>Reason:</b> ${match.reason || ""}</p>
        <div class="approved-badge">✓ Approved</div>
      </div>
    `;

    container.appendChild(card);

  });

}