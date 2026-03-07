import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    loadPendingMatches();
});

async function loadPendingMatches() {

    const container = document.getElementById("pendingMatches");
    container.innerHTML = "<p>Loading...</p>";

    try {

        const res = await apiRequest("/api/matches/pending/");

        if (!res.ok) {
            const err = await res.json();
            console.error("ADMIN ERROR:", err);
            container.innerHTML = "<p>Admin access required.</p>";
            return;
        }

        const data = await res.json();
        console.log("ADMIN MATCHES:", data);

        const matches = data.message || [];

        renderMatches(matches);

    } catch (error) {

        console.error("Failed loading matches:", error);
        container.innerHTML = "<p>Failed loading matches.</p>";

    }

}

function renderMatches(matches) {

    const container = document.getElementById("pendingMatches");
    container.innerHTML = "";

    if (!matches.length) {
        container.innerHTML = "<p>No pending matches.</p>";
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
                <p class="email">Reported by: ${match.lost_report?.reported_by_email || ""}</p>
            </div>

            <div class="report-block">
                <h3>Found Report</h3>
                ${match.found_report?.image_url ? `<img src="${match.found_report.image_url}" class="report-img">` : ""}
                <h4>${match.found_report?.item_name || ""}</h4>
                <p><b>Category:</b> ${match.found_report?.category || ""}</p>
                <p><b>Location:</b> ${match.found_report?.location || ""}</p>
                <p><b>Date:</b> ${match.found_report?.date || ""}</p>
                <p>${match.found_report?.description || ""}</p>
                <p class="email">Reported by: ${match.found_report?.reported_by_email || ""}</p>
            </div>

        </div>

        <div class="match-footer">
            <p><b>Match Score:</b> ${match.match_score || 0}</p>
            <p><b>Reason:</b> ${match.reason || ""}</p>

            <div class="admin-actions">
                <button class="approve-btn" data-id="${match.id}">Approve</button>
                <button class="reject-btn" data-id="${match.id}">Reject</button>
            </div>
        </div>
        `;

        container.appendChild(card);

    });

    attachButtons();
}

function attachButtons() {

    document.querySelectorAll(".approve-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;

            const res = await apiRequest(`/api/matches/${id}/approve/`, {
                method: "POST"
            });

            if (res.ok) {
                btn.closest(".match-card").remove();
            } else {
                alert("Failed to approve match");
            }

        });

    });

    document.querySelectorAll(".reject-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;

            const res = await apiRequest(`/api/matches/${id}/reject/`, {
                method: "POST"
            });

            if (res.ok) {
                btn.closest(".match-card").remove();
            } else {
                alert("Failed to reject match");
            }

        });

    });

}