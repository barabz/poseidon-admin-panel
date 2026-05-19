<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POSEIDON Admin - Water Quality Monitoring</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="assets/css/monitoring.css">
  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen">
  <?php require __DIR__ . '/partials/sidebar.php'; ?>

  <header class="sticky top-0 z-40 card border-b border-color px-4 py-3">
    <div id="headerContainer" class="ml-64 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold">Water Quality Monitor</h1>
        <span id="adminBadge" class="hidden ml-2 px-2 py-1 text-xs border border-color rounded">Read Only</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 btn-primary rounded-full animate-pulse"></div>
        <span class="text-sm text-muted">Live</span>
      </div>
    </div>
  </header>

  <main id="mainContainer" class="ml-64 px-4 py-6 space-y-6">

    <div class="card rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Select Fishpond</h2>
        <button id="registerPondBtn" class="btn btn-primary flex items-center gap-2" type="button">
          <i data-lucide="plus" class="w-4 h-4"></i>
          Register New Pond
        </button>
      </div>
      <select id="pondSelect" class="w-full p-2 rounded border border-color bg-white text-sm" disabled>
        <option value="">Loading ponds...</option>
      </select>
      
      <div class="mt-4 border-t border-color pt-4">
        <span class="block text-xs font-bold text-gray-500 uppercase mb-2">Hardware Connection Status</span>
        <div class="flex gap-3">
          <div id="sensorBadge" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-2 transition-all">
            <i data-lucide="cpu" class="w-4 h-4"></i> Sensor: Checking...
          </div>
          <div id="pumpBadge" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-2 transition-all">
            <i data-lucide="waves" class="w-4 h-4"></i> Pump: Checking...
          </div>
        </div>
        <p class="text-[10px] text-gray-400 mt-2 font-medium">Live telemetry and automatic water exchange require hardware to be linked to this pond.</p>
      </div>
    </div>

    <div id="parametersContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">pH Level</h3>
          <i data-lucide="activity" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="flex items-center justify-between mb-3">
          <div class="space-y-1">
            <div class="text-2xl font-bold">
              <span id="phValue">--</span>
              <span class="text-sm font-normal text-muted ml-1"></span>
            </div>
            <div class="flex items-center gap-2">
              <span id="phStatus" class="status-normal px-2 py-1 text-xs rounded font-semibold">Normal</span>
              <div class="flex items-center gap-1 text-xs text-muted">
                <i data-lucide="minus" class="w-3 h-3"></i>
                stable
              </div>
            </div>
          </div>
          <div class="w-16 h-12 mini-chart">
            <div class="chart-bar w-1" style="height: 60%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 45%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 70%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 55%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 80%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 65%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 75%; background-color: var(--chart-1);"></div>
            <div class="chart-bar w-1" style="height: 85%; background-color: var(--chart-1);"></div>
          </div>
        </div>
        <div class="space-y-1 text-xs text-muted">
          <div>Worker Threshold: <span id="phThresholdText">--</span></div>
          <div>Updated: <span id="phTime">--</span></div>
        </div>
      </div>

      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Dissolved Oxygen</h3>
          <i data-lucide="droplets" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="flex items-center justify-between mb-3">
          <div class="space-y-1">
            <div class="text-2xl font-bold">
              <span id="doValue">--</span>
              <span class="text-sm font-normal text-muted ml-1">mg/L</span>
            </div>
            <div class="flex items-center gap-2">
              <span id="doStatus" class="status-normal px-2 py-1 text-xs rounded font-semibold">Normal</span>
              <div class="flex items-center gap-1 text-xs text-muted">
                <i data-lucide="minus" class="w-3 h-3"></i>
                stable
              </div>
            </div>
          </div>
          <div class="w-16 h-12 mini-chart">
            <div class="chart-bar w-1" style="height: 40%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 55%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 60%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 75%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 80%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 85%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 90%; background-color: var(--chart-2);"></div>
            <div class="chart-bar w-1" style="height: 95%; background-color: var(--chart-2);"></div>
          </div>
        </div>
        <div class="space-y-1 text-xs text-muted">
          <div>Worker Threshold: <span id="doThresholdText">--</span></div>
          <div>Updated: <span id="doTime">--</span></div>
        </div>
      </div>

      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Temperature</h3>
          <i data-lucide="thermometer" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="flex items-center justify-between mb-3">
          <div class="space-y-1">
            <div class="text-2xl font-bold">
              <span id="tempValue">--</span>
              <span class="text-sm font-normal text-muted ml-1">°C</span>
            </div>
            <div class="flex items-center gap-2">
              <span id="tempStatus" class="status-normal px-2 py-1 text-xs rounded font-semibold">Normal</span>
              <div class="flex items-center gap-1 text-xs text-muted">
                <i data-lucide="minus" class="w-3 h-3"></i>
                stable
              </div>
            </div>
          </div>
          <div class="w-16 h-12 mini-chart">
            <div class="chart-bar w-1" style="height: 70%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 65%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 72%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 68%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 71%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 69%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 73%; background-color: var(--chart-3);"></div>
            <div class="chart-bar w-1" style="height: 70%; background-color: var(--chart-3);"></div>
          </div>
        </div>
        <div class="space-y-1 text-xs text-muted">
          <div>Worker Threshold: <span id="tempThresholdText">--</span></div>
          <div>Updated: <span id="tempTime">--</span></div>
        </div>
      </div>
    </div>

    <div class="card rounded-lg p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h2 class="text-lg font-semibold">Water Quality Trend</h2>
          <p class="text-xs text-muted">
            Shows movement per recorded interval (based on Firestore reading timestamps).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs text-muted" for="metricSelect">Metric</label>
          <select id="metricSelect" class="p-2 rounded border border-color bg-white text-sm">
            <option value="ph">pH</option>
            <option value="do">DO</option>
            <option value="temp">Temperature</option>
          </select>

          <select id="rangeSelect" class="p-2 rounded border border-color bg-white text-sm">
            <option value="10">Last 10</option>
            <option value="25" selected>Last 25</option>
            <option value="50">Last 50</option>
          </select>
        </div>
      </div>

      <div class="bg-white border border-color rounded-lg p-3">
        <div id="metricRangeLegend" class="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-700">
          Select a metric to view safe and critical ranges.
        </div>
        <canvas id="trendChart" height="120"></canvas>
        <div id="chartHint" class="text-xs text-muted mt-2">
          Select a pond to display its readings.
        </div>
      </div>
    </div>

  </main>

  <div id="registerModal" class="modal-backdrop">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold">Register New Fishpond</h2>
        <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600" type="button">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>

      <form id="pondForm">
        <div class="form-group">
          <label class="form-label">Pond Name</label>
          <input id="pondName" type="text" class="form-input" placeholder="e.g., Pond #5" required>
        </div>

        <div class="form-group">
          <label class="form-label">Fish Species</label>
          <select id="fishSpecies" class="form-select" required>
            <option value="">Select a species</option>
            <option value="tilapia">Tilapia</option>
            <option value="catfish">Catfish</option>
            <option value="carp">Carp</option>
            <option value="bass">Bass</option>
            <option value="trout">Trout</option>
            <option value="shrimp">Shrimp</option>
          </select>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="form-group">
            <label class="form-label">Length (m)</label>
            <input id="pondLength" type="number" class="form-input" placeholder="e.g., 20" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Width (m)</label>
            <input id="pondWidth" type="number" class="form-input" placeholder="e.g., 10" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Depth (m)</label>
            <input id="pondDepth" type="number" class="form-input" placeholder="e.g., 1.5" min="0" step="0.01" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">pH Min</label>
            <input id="phMin" type="number" class="form-input" placeholder="e.g., 6.5" min="0" max="14" step="0.1" required>
          </div>
          <div class="form-group">
            <label class="form-label">pH Max</label>
            <input id="phMax" type="number" class="form-input" placeholder="e.g., 7.5" min="0" max="14" step="0.1" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">DO Min (mg/L)</label>
            <input id="doMin" type="number" class="form-input" placeholder="e.g., 5.0" min="0" step="0.1" required>
          </div>
          <div class="form-group">
            <label class="form-label">DO Max (mg/L)</label>
            <input id="doMax" type="number" class="form-input" placeholder="e.g., 8.0" min="0" step="0.1" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Temp Min (°C)</label>
            <input id="tempMin" type="number" class="form-input" placeholder="e.g., 26" min="0" max="50" step="0.1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Temp Max (°C)</label>
            <input id="tempMax" type="number" class="form-input" placeholder="e.g., 30" min="0" max="50" step="0.1" required>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button type="button" id="cancelBtn" class="btn flex-1" style="background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;">
            Cancel
          </button>
          <button type="submit" id="registerSubmitBtn" class="btn btn-primary flex-1">
            Register Pond
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="toast" class="toast">
    <div class="card rounded-lg p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold" id="toastTitle">Saved</div>
          <div class="text-sm text-muted" id="toastMsg">Changes saved.</div>
        </div>
        <button id="toastClose" class="text-gray-400 hover:text-gray-600" type="button">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
  </div>

  <script src="assets/js/monitoring-ranges.js"></script>
  <script src="assets/js/monitoring.js"></script>
</body>
</html>