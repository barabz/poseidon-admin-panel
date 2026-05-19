<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        :root {
            --background: #ffffff;
            --foreground: #374151;
            --card: #f0fdf4;
            --card-foreground: #374151;
            --primary: #15803d;
            --primary-foreground: #ffffff;
            --secondary: #84cc16;
            --muted: #f0fdf4;
            --muted-foreground: #6b7280;
            --destructive: #dc2626;
            --border: #e5e7eb;
        }
        body { background-color: var(--background); color: var(--foreground); }
        .card { background-color: var(--card); color: var(--card-foreground); border: 1px solid var(--border); }
        .btn-primary { background-color: var(--primary); color: var(--primary-foreground); }
        .text-muted { color: var(--muted-foreground); }
        .border-color { border-color: var(--border); }
        .status-normal { background-color: rgba(21, 128, 61, 0.1); color: var(--primary); border: 1px solid rgba(21, 128, 61, 0.2); }
        .status-warning { background-color: rgba(251, 191, 36, 0.1); color: #d97706; border: 1px solid rgba(251, 191, 36, 0.2); }
        .metric-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
        .metric-value { font-size: 2.5rem; font-weight: 700; line-height: 1; margin: 8px 0; }
        .metric-label { font-size: 0.875rem; color: var(--muted-foreground); }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
        .pond-item, .worker-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border); }
        .pond-item:last-child, .worker-item:last-child { border-bottom: none; }
    </style>
</head>
<body class="min-h-screen">
    
    <?php include __DIR__ . '/partials/sidebar.php'; ?>
    <?php require __DIR__ . '/partials/firebase.php'; ?>

    <header class="sticky top-0 z-40 card border-b border-color px-4 py-4">
        <div id="headerContainer" class="ml-64 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 btn-primary rounded-lg flex items-center justify-center">
                    <i data-lucide="shield-check" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold">POSEIDON Admin</h1>
                    <p class="text-xs text-muted">Dashboard Overview</p>
                </div>
            </div>
            <span id="adminBadge" class="px-3 py-1 text-xs font-medium border border-color rounded-full">System Online</span>
        </div>
    </header>

    <main id="mainContainer" class="ml-64 px-6 py-8 space-y-8 bg-gray-50">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card rounded-lg p-6 metric-card">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-muted">Total Fishponds</h3>
                    <i data-lucide="waves" class="w-5 h-5 text-muted" style="color: var(--primary);"></i>
                </div>
                <div class="metric-value" id="val-total-ponds">--</div>
                <p class="metric-label" id="label-ponds">Loading...</p>
            </div>

            <div class="card rounded-lg p-6 metric-card">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-muted">Active Workers</h3>
                    <i data-lucide="users" class="w-5 h-5" style="color: var(--primary);"></i>
                </div>
                <div class="metric-value" id="val-total-workers">--</div>
                <p class="metric-label" id="label-workers">Loading...</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold">Fishponds Overview</h2>
                    <button onclick="window.location.href='index.php?page=iot-control'" class="text-sm px-3 py-1 border border-color rounded hover:bg-gray-100">View All</button>
                </div>
                <div class="space-y-0" id="list-ponds">
                    <div class="p-4 text-center text-sm text-gray-400">Loading ponds...</div>
                </div>
            </div>

            <div class="card rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold">Workers Overview</h2>
                    <button onclick="window.location.href='index.php?page=accounts'" class="text-sm px-3 py-1 border border-color rounded hover:bg-gray-100">View All</button>
                </div>
                <div class="space-y-0" id="list-workers">
                    <div class="p-4 text-center text-sm text-gray-400">Loading workers...</div>
                </div>
            </div>
        </div>

        <div class="card rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold">Recent Alerts</h2>
                <i data-lucide="bell" class="w-5 h-5" style="color: var(--primary);"></i>
            </div>
            <div class="space-y-3" id="list-alerts">
                <div class="p-4 text-center text-sm text-gray-400">Loading alerts...</div>
            </div>
        </div>

        <div class="card rounded-lg p-6">
            <h2 class="text-lg font-bold mb-4">Quick Actions</h2>
            <div class="grid grid-cols-4 gap-3">
                <button onclick="window.location.href='index.php?page=monitoring'" class="flex flex-col items-center justify-center gap-2 p-4 border border-color rounded hover:bg-gray-100 transition">
                    <i data-lucide="activity" class="w-6 h-6" style="color: var(--primary);"></i>
                    <span class="text-sm font-medium">Monitor Quality</span>
                </button>
                <button onclick="window.location.href='index.php?page=accounts'" class="flex flex-col items-center justify-center gap-2 p-4 border border-color rounded hover:bg-gray-100 transition">
                    <i data-lucide="users" class="w-6 h-6" style="color: var(--primary);"></i>
                    <span class="text-sm font-medium">Manage Workers</span>
                </button>
                <button onclick="window.location.href='index.php?page=assignments'" class="flex flex-col items-center justify-center gap-2 p-4 border border-color rounded hover:bg-gray-100 transition">
                    <i data-lucide="clipboard-list" class="w-6 h-6" style="color: var(--primary);"></i>
                    <span class="text-sm font-medium">Assignments</span>
                </button>
                <button onclick="window.location.href='index.php?page=reports'" class="flex flex-col items-center justify-center gap-2 p-4 border border-color rounded hover:bg-gray-100 transition">
                    <i data-lucide="file-text" class="w-6 h-6" style="color: var(--primary);"></i>
                    <span class="text-sm font-medium">View Reports</span>
                </button>
            </div>
        </div>
    </main>

    <script>
        lucide.createIcons();

        // Initialize Firebase
        const firebaseConfig = window.__FIREBASE_CONFIG__;
        if (!firebaseConfig) console.error("Firebase Config missing");
        
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();

        auth.onAuthStateChanged((user) => {
            if (!user) window.location.href = 'index.php?page=login';
        });

        async function initDashboard() {
            // A. FISHPONDS
            db.collection("fishponds").onSnapshot(async (snap) => {
                let total = 0;
                let active = 0;
                let maintenance = 0;
                let assignedWorkerIds = new Set();
                let pondHtml = '';

                snap.forEach(doc => {
                    total++;
                    const data = doc.data();
                    
                    if (data.status === 'inactive') {
                        maintenance++;
                    } else {
                        active++;
                    }

                    if (data.assignedWorkers && Array.isArray(data.assignedWorkers)) {
                        data.assignedWorkers.forEach(uid => assignedWorkerIds.add(uid));
                    }

                    if (total <= 5) {
                        const isOk = data.status !== 'inactive';
                        const badgeClass = isOk ? 'status-normal badge' : 'status-warning badge';
                        const badgeText = isOk ? 'Normal' : 'Inactive';
                        
                        pondHtml += `
                            <div class="pond-item">
                                <div>
                                    <div class="font-medium">${data.name || 'Unnamed'}</div>
                                    <div class="text-xs text-muted">${data.fishSpecies || 'Unknown Species'}</div>
                                </div>
                                <span class="${badgeClass}">${badgeText}</span>
                            </div>
                        `;
                    }
                });

                document.getElementById('val-total-ponds').innerText = total;
                document.getElementById('label-ponds').innerText = `${active} Active • ${maintenance} Inactive`;
                document.getElementById('list-ponds').innerHTML = pondHtml || '<div class="p-4 text-center text-sm">No ponds found</div>';

                fetchWorkers(assignedWorkerIds);
            });

            // ✅ B. ALERTS LISTENER (FIXED)
            // 1. Use collectionGroup to search across all ponds
            // 2. Use 'createdAt' because that's what we save in the DB (not timestamp)
            db.collectionGroup("alerts")
              .orderBy("createdAt", "desc") 
              .limit(5)
              .onSnapshot(snap => {
                let alertsHtml = '';
                if (snap.empty) {
                    alertsHtml = '<div class="p-4 text-center text-sm text-gray-400">No recent alerts</div>';
                } else {
                    snap.forEach(doc => {
                        const data = doc.data();
                        let colorClass = "border-orange-200 bg-orange-50";
                        let iconClass = "text-orange-600";
                        let iconName = "alert-circle";

                        if(data.type === 'info') {
                            colorClass = "border-blue-200 bg-blue-50";
                            iconClass = "text-blue-600";
                            iconName = "info";
                        } else if (data.type === 'critical') {
                            colorClass = "border-red-200 bg-red-50";
                            iconClass = "text-red-600";
                            iconName = "alert-octagon";
                        }

                        const timeString = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';

                        alertsHtml += `
                            <div class="p-3 border ${colorClass} rounded">
                                <div class="flex items-start gap-3">
                                    <i data-lucide="${iconName}" class="w-5 h-5 ${iconClass} flex-shrink-0 mt-0.5"></i>
                                    <div>
                                        <div class="font-medium text-sm">${data.message || 'System Alert'}</div>
                                        <div class="text-xs text-muted">Reading: ${data.value || '--'} • ${timeString}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                document.getElementById('list-alerts').innerHTML = alertsHtml;
                lucide.createIcons();
            });
        }

        // C. FETCH WORKERS
        function fetchWorkers(assignedSet) {
            db.collection("users").where("role", "==", "worker").onSnapshot(snap => {
                let totalWorkers = 0;
                let workersHtml = '';
                
                snap.forEach(doc => {
                    const data = doc.data();
                    if(data.status === 'inactive') return; 
                    
                    totalWorkers++;
                    const isAssigned = assignedSet.has(doc.id);
                    const badgeStyle = isAssigned 
                        ? 'background-color: rgba(21, 128, 61, 0.1); color: var(--primary); border: 1px solid rgba(21, 128, 61, 0.2);' 
                        : 'background-color: rgba(251, 191, 36, 0.1); color: #d97706; border: 1px solid rgba(251, 191, 36, 0.2);';
                    const badgeText = isAssigned ? 'Assigned' : 'Available';
                    const subText = isAssigned ? 'On Duty' : 'Ready';

                    if (totalWorkers <= 4) {
                        workersHtml += `
                            <div class="worker-item">
                                <div>
                                    <div class="font-medium">${data.displayName || data.email}</div>
                                    <div class="text-xs text-muted">${subText}</div>
                                </div>
                                <span class="badge" style="${badgeStyle}">${badgeText}</span>
                            </div>
                        `;
                    }
                });

                const assignedCount = assignedSet.size;
                const availableCount = Math.max(0, totalWorkers - assignedCount);

                document.getElementById('val-total-workers').innerText = totalWorkers;
                document.getElementById('label-workers').innerText = `${assignedCount} Assigned • ${availableCount} Available`;
                document.getElementById('list-workers').innerHTML = workersHtml || '<div class="p-4 text-center text-sm">No active workers</div>';
            });
        }

        initDashboard();
    </script>
</body>
</html>

