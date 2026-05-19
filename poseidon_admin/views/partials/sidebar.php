<div id="sideNav"
     class="fixed left-0 top-0 h-full w-64 z-50"
     style="background-color: #f0fdf4; color: #374151; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">

    <div class="flex items-center justify-between mb-4 p-4">
    <h2 class="text-xl font-bold">POSEIDON Admin</h2>

    <a href="index.php?page=notifications"
       class="relative p-2 rounded hover:bg-gray-100 <?php echo ($currentPage === 'notifications') ? 'bg-gray-200' : ''; ?>"
       title="Notifications">
        <i data-lucide="bell" class="w-5 h-5"></i>
        <span id="notifBadge"
              class="hidden ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-2 text-[10px] leading-[18px] text-center rounded-full bg-red-600 text-white font-bold">
          0
        </span>
    </a>
  </div>

    <ul class="space-y-2 px-4" style="flex: 1;">
        <li id="nav-dashboard">
            <a href="index.php?page=dashboard" class="flex items-center p-2 hover:bg-gray-100 rounded <?php echo ($currentPage === 'dashboard') ? 'bg-gray-200' : ''; ?>">
                <i data-lucide="home" class="w-4 h-4 mr-2"></i> Dashboard
            </a>
        </li>

        <li id="nav-monitoring">
            <a href="index.php?page=monitoring" class="flex items-center p-2 hover:bg-gray-100 rounded <?php echo ($currentPage === 'monitoring') ? 'bg-gray-200' : ''; ?>">
                <i data-lucide="activity" class="w-4 h-4 mr-2"></i> Monitoring
            </a>
        </li>


        

        <li id="nav-assignments">
            <a href="index.php?page=assignments" class="flex items-center p-2 hover:bg-gray-100 rounded <?php echo ($currentPage === 'assignments') ? 'bg-gray-200' : ''; ?>">
                <i data-lucide="clipboard-list" class="w-4 h-4 mr-2"></i> Pond Management
            </a>
        </li>

        <li id="nav-iot-control">
            <button onclick="toggleIoTDropdown()" class="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded <?php echo (in_array($currentPage, ['iot-control', 'water-exchange', 'sensors', 'aerator-recommendation'])) ? 'bg-gray-200' : ''; ?>">
                <div class="flex items-center">
                    <i data-lucide="settings" class="w-4 h-4 mr-2"></i> IoT Control
                </div>
                <i data-lucide="chevron-down" id="iot-chevron" class="w-4 h-4 transition-transform duration-200 <?php echo (in_array($currentPage, ['water-exchange', 'sensors', 'aerator-recommendation'])) ? 'rotate-180' : ''; ?>"></i>
            </button>

            <ul id="iot-dropdown" class="ml-6 mt-1 space-y-1 <?php echo (in_array($currentPage, ['water-exchange', 'sensors', 'aerator-recommendation'])) ? '' : 'hidden'; ?>">
                <li>
                    <a href="index.php?page=water-exchange" class="flex items-center p-2 hover:bg-gray-100 rounded text-sm <?php echo ($currentPage === 'water-exchange') ? 'bg-gray-100 font-semibold' : ''; ?>">
                        <i data-lucide="droplets" class="w-3 h-3 mr-2"></i> Water Exchange
                    </a>
                </li>
                <li>
                    <a href="index.php?page=sensors" class="flex items-center p-2 hover:bg-gray-100 rounded text-sm <?php echo ($currentPage === 'sensors') ? 'bg-gray-200 font-semibold' : ''; ?>">
                        <i data-lucide="thermometer" class="w-3 h-3 mr-2"></i> Sensors
                    </a>
                </li>
                <li>
                    <a href="index.php?page=aerator-recommendation"
                       class="flex items-center p-2 hover:bg-gray-100 rounded text-sm
                       <?php echo ($currentPage === 'aerator-recommendation') ? 'bg-gray-200 font-semibold' : ''; ?>">
                        <i data-lucide="fan" class="w-3 h-3 mr-2"></i>
                        Aerator Recommendation
                    </a>
                </li>
            </ul>
            <li id="nav-reports">
            <button onclick="toggleReportsDropdown()"
                class="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded
                <?php echo (in_array($currentPage, ['fishpond-reports'])) ? 'bg-gray-200' : ''; ?>">
                <div class="flex items-center">
                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Reports
                </div>
                <i data-lucide="chevron-down" id="reports-chevron"
                   class="w-4 h-4 transition-transform duration-200
                   <?php echo (in_array($currentPage, ['fishpond-reports'])) ? 'rotate-180' : ''; ?>">
                </i>
            </button>

            <ul id="reports-dropdown"
                class="ml-6 mt-1 space-y-1 <?php echo (in_array($currentPage, ['fishpond-reports'])) ? '' : 'hidden'; ?>">
                <li>
                    <a href="index.php?page=fishpond-reports"
                       class="flex items-center p-2 hover:bg-gray-100 rounded text-sm
                       <?php echo ($currentPage === 'fishpond-reports') ? 'bg-gray-200 font-semibold' : ''; ?>">
                        <i data-lucide="bar-chart-3" class="w-3 h-3 mr-2"></i>
                        Fishpond Reports
                    </a>
                </li>
            </ul>
        </li>
        </li>

        <li id="nav-profile" class="mt-4 pt-4 border-t border-gray-200">
            <a href="index.php?page=profile" class="flex items-center p-2 hover:bg-gray-100 rounded <?php echo ($currentPage === 'profile') ? 'bg-gray-200' : ''; ?>">
                <i data-lucide="user" class="w-4 h-4 mr-2"></i> My Profile
            </a>
        </li>
    </ul>

    <div class="px-4 pb-4">
        <form method="post" action="logout.php">
            <button type="submit"
                    class="flex items-center p-2 w-full hover:bg-gray-100 rounded">
                <i data-lucide="log-out" class="w-4 h-4 mr-2"></i>
                Logout
            </button>
        </form>
    </div>
</div>


<script src="assets/js/notif_badge.js?v=1"></script>
<script>
function toggleIoTDropdown() {
    document.getElementById('iot-dropdown').classList.toggle('hidden');
    document.getElementById('iot-chevron').classList.toggle('rotate-180');
}

function toggleReportsDropdown() {
    document.getElementById('reports-dropdown').classList.toggle('hidden');
    document.getElementById('reports-chevron').classList.toggle('rotate-180');
}
</script>