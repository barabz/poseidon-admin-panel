import { DashboardModel } from "../models/DashboardModel.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadSidebar();
    renderDashboard();
    setActiveNav();
    lucide.createIcons();
});

/* Load Sidebar View */
async function loadSidebar() {
    const response = await fetch("sidebar.html");
    const sidebarHTML = await response.text();
    document.getElementById("sidebarContainer").innerHTML = sidebarHTML;
}

/* Render Dashboard Data */
function renderDashboard() {
    const metrics = DashboardModel.getMetrics();
    const water = DashboardModel.getWaterQualityDetails();

    document.getElementById("fishpondMetric").textContent = metrics.fishponds.total;
    document.getElementById("fishpondLabel").textContent =
        `${metrics.fishponds.active} Active • ${metrics.fishponds.maintenance} Maintenance`;

    document.getElementById("workerMetric").textContent = metrics.workers.total;
    document.getElementById("workerLabel").textContent =
        `${metrics.workers.assigned} Assigned • ${metrics.workers.available} Available`;

    document.getElementById("waterQualityMetric").textContent =
        metrics.waterQuality.percentage + "%";
    document.getElementById("waterQualityStatus").textContent =
        metrics.waterQuality.status;

    document.getElementById("phValue").textContent = water.ph;
    document.getElementById("doValue").textContent = water.dissolvedOxygen + " mg/L";
    document.getElementById("tempValue").textContent = water.temperature + "°C";
}

/* Active Navigation */
function setActiveNav() {
    const current = window.location.pathname.split("/").pop();
    const navMap = {
        "admin-dashboard.html": "nav-dashboard"
    };

    const activeId = navMap[current];
    if (activeId) {
        const li = document.getElementById(activeId);
        if (li) li.querySelector("a").classList.add("bg-gray-200");
    }
}
