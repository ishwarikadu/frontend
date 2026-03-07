import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  setProfile();
  setupFilters();
  fetchRejectedMatches();
});


/* ── Filters ── */

function setupFilters() {
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");

  if (applyBtn) applyBtn.addEventListener("click", fetchRejectedMatches);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterSearch").value = "";
      fetchRejectedMatches();
    });
  }
}


/* ── Fetch rejected matches ── */

async function fetchRejectedMatches() {

  const container = document.getElementById("matchesContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <span class="material-symbols-outlined spin">autorenew</span>
      <p>Loading rejected matches...</p>
    </div>
  `;

  // build query params
  const params = new URLSearchParams();
  const search = document.getElementById("filterSearch")?.value;
  if (search) params.append("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";

  try {

    const res = await apiRequest(`/api/matches/rejected/${query}`);

    if (!res.ok) {
      const text = await res.text();
      console.error("API error response:", text);
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    console.log("Rejected matches data:", data);

    const matches =
      Array.isArray(data)         ? data         :
      Array.isArray(data.message) ? data.message :
      Array.isArray(data.results) ? data.results :
      Array.isArray(data.data)    ? data.data    :
      [];

    if (!matches.length) {
      container.innerHTML = `
        <div class="loading-state">
          <span class="material-symbols-outlined">inbox</span>
          <p>No rejected matches found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    matches.forEach(match => {
      container.appendChild(buildMatchCard(match));
    });

  } catch (err) {
    console.error("Rejected matches error:", err);
    container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">error</span>
        <p>Failed to load rejected matches. Check console for details.</p>
      </div>
    `;
  }

}


/* ── Build match card ── */

function buildMatchCard(match) {

  const card = document.createElement("div");
  card.className = "match-card";

  const lost  = match.lost_report  || {};
  const found = match.found_report || {};

  card.innerHTML = `
    <div class="match-row">

      <div class="report-block">
        <h3>Lost Report</h3>
        ${lost.image_url ? `<img src="${lost.image_url}" class="report-img">` : ""}
        <h4>${lost.item_name || ""}</h4>
        <p><b>Category:</b> ${lost.category || ""}</p>
        <p><b>Location:</b> ${lost.location || ""}</p>
        <p><b>Date:</b> ${lost.date || ""}</p>
        <p>${lost.description || ""}</p>
        <p class="email">${match.lost_reporter_email || ""}</p>
      </div>

      <div class="report-block">
        <h3>Found Report</h3>
        ${found.image_url ? `<img src="${found.image_url}" class="report-img">` : ""}
        <h4>${found.item_name || ""}</h4>
        <p><b>Category:</b> ${found.category || ""}</p>
        <p><b>Location:</b> ${found.location || ""}</p>
        <p><b>Date:</b> ${found.date || ""}</p>
        <p>${found.description || ""}</p>
        <p class="email">${match.found_reporter_email || ""}</p>
      </div>

    </div>

    <div class="match-footer">
      <p><b>Match Score:</b> ${match.match_score ?? "-"}</p>
      <p><b>Reason:</b> ${match.reason || "-"}</p>
      <div class="rejected-badge">✕ Rejected</div>
    </div>
  `;

  return card;
}


/* ── Profile ── */

function setProfile() {
  const username  = localStorage.getItem("name") || "User";
  const firstName = username.split(" ")[0];
  const initial   = firstName.charAt(0).toUpperCase();

  const circle = document.getElementById("profileCircle");
  const name   = document.getElementById("profileName");

  if (circle) circle.innerText = initial;
  if (name)   name.innerText   = firstName;
}