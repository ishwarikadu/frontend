import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const reportId = params.get("id");

  if (!reportId) {
    console.error("No report ID found in URL");
    return;
  }

  const container = document.getElementById("matchesList");

  if (!container) {
    console.error("matchesList container not found");
    return;
  }

  container.innerHTML = "<p>Loading matches...</p>";

  try {

    const aiRes = await apiRequest(
      `/api/reports/${reportId}/suggest-matches/`,
      { method: "POST" }
    );

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      container.innerHTML = `
        <p style="color:#ff6b6b;">
          ${aiData.message || "Unable to load matches."}
        </p>
      `;
      return;
    }

    const matches = aiData.message?.matches || [];

    if (matches.length === 0) {
      container.innerHTML = "<p>No potential matches found.</p>";
      return;
    }

    container.innerHTML = "";

    matches.forEach(match => {

      const card = document.createElement("div");
      card.className = "match-card";

      card.innerHTML = `
        ${match.image_url ? `<img src="${match.image_url}" class="match-img">` : ""}
        
        <div class="match-details">
          <h3>${match.item_name || "Unnamed Item"}</h3>
          <p><strong>Category:</strong> ${match.category}</p>
          <p><strong>Location:</strong> ${match.location}</p>
          <p><strong>Date:</strong> ${match.date}</p>
          <p><strong>Match Score:</strong> ${match.score}</p>
          <p><strong>Reason:</strong> ${match.reason || "—"}</p>
          
          <button class="match-btn" data-id="${match.report_id}">
            <span class="material-symbols-outlined">send</span>
            Send for Approval
          </button>

          <div class="match-error" style="margin-top:8px;color:#ff6b6b;font-size:14px;"></div>
        </div>
      `;

      const btn = card.querySelector(".match-btn");
      const errorBox = card.querySelector(".match-error");

      btn.addEventListener("click", async () => {

        btn.disabled = true;
        errorBox.innerText = "";

        try {

          const createRes = await apiRequest(
            "/api/create_match/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lost_id: reportId,
                found_id: match.report_id,
                score: match.score,
                reason: match.reason
              })
            }
          );

          const responseData = await createRes.json();

          if (!createRes.ok) {
            // 🔴 Show backend message clearly
            errorBox.innerText =
              responseData.message ||
              "You are not allowed to request this claim.";
            btn.disabled = false;
            return;
          }

          // 🟢 Success state
          btn.innerHTML = `
            <span class="material-symbols-outlined">check_circle</span>
            Request Sent
          `;
          btn.classList.add("sent");
          btn.disabled = true;

        } catch (err) {
          console.error("Error sending approval request:", err);
          errorBox.innerText = "Something went wrong. Try again.";
          btn.disabled = false;
        }

      });

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading matches:", error);
    container.innerHTML = "<p>Something went wrong.</p>";
  }

});