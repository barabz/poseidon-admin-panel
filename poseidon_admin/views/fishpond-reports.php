<?php
$currentPage = 'fishpond-reports';

// Defaults
$interval = isset($_GET['interval']) ? $_GET['interval'] : 'daily';
$pond = isset($_GET['pond']) ? trim($_GET['pond']) : '';

// Handle Custom Dates
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d');
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');

// If user selects specific dates, force interval to 'custom'
if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
    $interval = 'custom';
} elseif (!in_array($interval, ['daily', 'monthly', 'yearly'])) {
    $interval = 'daily';
}
?>
<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>POSEIDON Admin - Reports</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="assets/css/monitoring.css">

  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen">
  <?php require __DIR__ . '/partials/sidebar.php'; ?>

  <header class="sticky top-0 z-40 card border-b border-color px-4 py-3">
    <div class="ml-64 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold">Fishpond Reports</h1>
        <span class="text-xs text-muted">Analytics & Historical Data</span>
      </div>
    </div>
  </header>

  <main class="ml-64 px-4 py-6 space-y-6">

    <div class="card rounded-lg p-4 space-y-4">
      
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div class="w-full lg:w-1/3">
          <label class="text-xs font-bold text-muted uppercase tracking-wide block mb-1">Select Fishpond</label>
          <select id="pondSelect" class="w-full p-2 rounded border border-color bg-white text-sm" disabled>
            <option value="">Loading ponds...</option>
          </select>
        </div>

        <?php $pondParam = $pond !== '' ? '&pond=' . urlencode($pond) : ''; ?>
        <div class="flex items-center gap-2">
          <a id="btnDaily" href="index.php?page=fishpond-reports&interval=daily<?php echo $pondParam; ?>"
             class="px-4 py-2 rounded border border-color text-sm font-semibold transition-colors <?php echo $interval==='daily' ? 'btn-primary text-white border-transparent' : 'bg-white hover:bg-gray-50'; ?>">
            Daily
          </a>
          <a id="btnMonthly" href="index.php?page=fishpond-reports&interval=monthly<?php echo $pondParam; ?>"
             class="px-4 py-2 rounded border border-color text-sm font-semibold transition-colors <?php echo $interval==='monthly' ? 'btn-primary text-white border-transparent' : 'bg-white hover:bg-gray-50'; ?>">
            Monthly
          </a>
          <a id="btnYearly" href="index.php?page=fishpond-reports&interval=yearly<?php echo $pondParam; ?>"
             class="px-4 py-2 rounded border border-color text-sm font-semibold transition-colors <?php echo $interval==='yearly' ? 'btn-primary text-white border-transparent' : 'bg-white hover:bg-gray-50'; ?>">
            Yearly
          </a>
        </div>
      </div>

      <hr class="border-color">

      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label class="text-xs font-bold text-muted uppercase tracking-wide block mb-1">Start Date</label>
          <input type="date" id="inputStartDate" value="<?php echo htmlspecialchars($startDate); ?>" 
                 class="p-2 rounded border border-color text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="text-xs font-bold text-muted uppercase tracking-wide block mb-1">End Date</label>
          <input type="date" id="inputEndDate" value="<?php echo htmlspecialchars($endDate); ?>" 
                 class="p-2 rounded border border-color text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        
        <button id="btnApplyFilter" type="button" 
                class="px-4 py-2 rounded bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2">
          <i data-lucide="filter" class="w-4 h-4"></i>
          Apply Custom Range
        </button>

        <?php if($interval === 'custom'): ?>
          <div class="ml-auto flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-medium border border-blue-100">
            <i data-lucide="calendar-days" class="w-3 h-3"></i>
            Showing: <?php echo htmlspecialchars($startDate) . ' to ' . htmlspecialchars($endDate); ?>
          </div>
        <?php endif; ?>
      </div>
      
      <p id="pondMeta" class="text-xs text-muted pt-1 text-right">—</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="card rounded-lg p-4">
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Total Alerts</p>
        <p id="kpiAlerts" class="text-3xl font-extrabold mt-1">0</p>
        <p class="text-xs text-muted mt-1">Violations in selected range</p>
      </div>

      <div class="card rounded-lg p-4">
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Average pH</p>
        <p id="kpiAvgPh" class="text-3xl font-extrabold mt-1">—</p>
        <p class="text-xs text-muted mt-1">Across range</p>
      </div>

      <div class="card rounded-lg p-4">
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Average DO</p>
        <p id="kpiAvgDo" class="text-3xl font-extrabold mt-1">—</p>
        <p class="text-xs text-muted mt-1">mg/L across range</p>
      </div>

      <div class="card rounded-lg p-4">
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Average Temp</p>
        <p id="kpiAvgTemp" class="text-3xl font-extrabold mt-1">—</p>
        <p class="text-xs text-muted mt-1">°C across range</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="card rounded-lg p-4 xl:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Trends</h2>
          <span id="trendHint" class="text-xs text-muted">Select a pond to load readings.</span>
        </div>
        <div class="h-[320px]">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <div class="card rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-3">Alert Distribution</h2>
        <div class="h-[320px]">
          <canvas id="alertDonut"></canvas>
        </div>
        <p class="text-xs text-muted mt-2">Based on thresholds configured for this pond.</p>
      </div>
    </div>

    <div class="card rounded-lg p-4">
      <div class="flex items-center justify-between gap-2 flex-wrap mb-3">
        <h2 class="text-lg font-semibold">Readings Log</h2>
        <button id="exportCsvBtn" class="btn btn-primary flex items-center gap-2" type="button">
          <i data-lucide="download" class="w-4 h-4"></i>
          Export CSV
        </button>
      </div>

      <div class="overflow-auto max-h-[500px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-white z-10 shadow-sm">
            <tr class="text-left text-xs text-muted uppercase border-b border-color">
              <th class="py-2 pr-2 bg-white">Recorded At</th>
              <th class="py-2 pr-2 bg-white">pH</th>
              <th class="py-2 pr-2 bg-white">DO</th>
              <th class="py-2 pr-2 bg-white">Temp</th>
              <th class="py-2 pr-2 bg-white">Source</th>
            </tr>
          </thead>
          <tbody id="readingsTbody">
            <tr>
              <td colspan="5" class="py-3 text-xs text-muted">Select a pond to load readings.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <script>
    // Pass PHP config to JS
    window.__REPORT_CONFIG__ = {
      interval: <?php echo json_encode($interval); ?>,
      pond: <?php echo json_encode($pond); ?>,
      startDate: <?php echo json_encode($startDate); ?>,
      endDate: <?php echo json_encode($endDate); ?>
    };
    lucide.createIcons();
  </script>
  <script src="assets/js/reports.js"></script>
</body>
</html>

