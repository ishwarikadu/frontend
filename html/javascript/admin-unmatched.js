import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {

  setProfile();
  fetchUnmatchedReports();

});


async function fetchUnmatchedReports(){

  const container = document.getElementById("reportsContainer");

  try{

    const res = await apiRequest("/api/admin/reports/unmatched/");

    if(!res.ok){
      throw new Error("Server error");
    }

    const data = await res.json();

    const reports = data.message || [];

    if(!reports.length){

      container.innerHTML = "<p>No unmatched reports.</p>";
      return;

    }

    reports.forEach(report => {

      container.appendChild(buildReportCard(report));

    });

  }

  catch(err){

    console.error("Unmatched reports error:",err);

    container.innerHTML = "<p>Failed to load unmatched reports.</p>";

  }

}



function buildReportCard(report){

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

    <div class="unmatched-badge">
      Unmatched
    </div>

  </div>

  `;

  return card;

}



function setProfile(){

  const username = localStorage.getItem("name") || "User";

  const firstName = username.split(" ")[0];

  const initial = firstName.charAt(0).toUpperCase();

  document.getElementById("profileCircle").innerText = initial;

  document.getElementById("profileName").innerText = firstName;

}