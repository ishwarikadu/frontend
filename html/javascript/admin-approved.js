import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  loadApprovedMatches();
});

async function loadApprovedMatches() {

  const container = document.getElementById("approvedMatches");
  container.innerHTML = "<p>Loading...</p>";

  try {

    const res = await apiRequest("/api/matches/approved/");

    if (!res.ok) {
      const err = await res.json();
      console.error("APPROVED ERROR:", err);
      container.innerHTML = "<p>Admin access required.</p>";
      return;
    }

    const data = await res.json();

    console.log("APPROVED MATCHES:", data);

    const matches = data.message || [];

    renderMatches(matches);

  } catch (err) {

    console.error("Failed loading approved matches:", err);
    container.innerHTML = "<p>Failed loading approved matches.</p>";

  }

}

function renderMatches(matches) {

  const container = document.getElementById("approvedMatches");
  container.innerHTML = "";

  if (!matches.length) {
    container.innerHTML = "<p>No approved matches yet.</p>";
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