<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>POSEIDON Admin - Fishpond Reports</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <link rel="stylesheet" href="assets/css/monitoring.css">

  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen">
  <?php require __DIR__ . '/partials/sidebar.php'; ?>

  <!-- Header -->
  <header class="sticky top-0 z-40 card border-b border-color px-4 py-3">
    <div class="ml-64 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold">Fishpond Reports</h1>
        <span class="text-xs text-muted">Water quality from readings subcollection</span>
      </div>
    </div>
  </header>

  <main class="ml-64 px-4 py-6 space-y-6">

    <!-- Controls -->
    <div class="card rounded-lg p-4 space-y-3">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="w-full md:w-1/2">
          <label class="text-sm font-medium block mb-2">Select Fishpond</label>
          <select id="pondSelect" class="w-full p-2 rounded border border-color bg-white text-sm" disabled>
            <option value="">Loading ponds...</option>
          </select>
          <p id="pondMeta" class="text-xs text-muted mt-2">—</p>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2">
          <div class="flex items-center gap-2">
  <a id="btnDaily" class="btn px-3 py-2 text-sm rounded border" href="index.php?page=reports&interval=daily">Daily</a>
  <a id="btnMonthly" class="btn px-3 py-2 text-sm rounded border" href="index.php?page=reports&interval=monthly">Monthly</a>
  <a id="btnYearly" class="btn px-3 py-2 text-sm rounded border" href="index.php?page=reports&interval=yearly">Yearly</a>
</div>

          <div class="flex items-center gap-2">
            <label class="text-xs text-muted" for="metricSelect">Metric</label>
            <select id="metricSelect" class="p-2 rounded border border-color bg-white text-sm">
              <option value="ph">pH</option>
              <option value="do">DO</option>
              <option value="temp">Temperature</option>
            </select>
          </div>
        </div>
      </div>

      <div id="infoBanner" class="hidden text-sm rounded border border-color p-3 bg-white">
        <div class="flex items-start gap-2">
          <i data-lucide="info" class="w-4 h-4 text-muted mt-0.5"></i>
          <div>
            <div class="font-medium">Note</div>
            <div id="infoBannerText" class="text-xs text-muted"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Latest pH</h3>
          <i data-lucide="activity" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="text-2xl font-bold"><span id="latestPh">--</span></div>
        <div class="text-xs text-muted mt-1">Recorded: <span id="latestTime">--</span></div>
      </div>

      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Latest DO</h3>
          <i data-lucide="droplets" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="text-2xl font-bold"><span id="latestDo">--</span> <span class="text-sm font-normal text-muted">mg/L</span></div>
        <div class="text-xs text-muted mt-1">Recorded: <span id="latestTime2">--</span></div>
      </div>

      <div class="card rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Latest Temp</h3>
          <i data-lucide="thermometer" class="w-4 h-4 text-muted"></i>
        </div>
        <div class="text-2xl font-bold"><span id="latestTemp">--</span> <span class="text-sm font-normal text-muted">°C</span></div>
        <div class="text-xs text-muted mt-1">Recorded: <span id="latestTime3">--</span></div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card rounded-lg p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div>
          <h2 class="text-lg font-semibold">Trend</h2>
          <p id="chartHint" class="text-xs text-muted">Loading...</p>
        </div>
      </div>

      <div class="w-full" style="height: 320px;">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <!-- Table -->
    <div class="card rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Recent Readings</h2>
        <button id="exportCsvBtn" class="btn btn-primary flex items-center gap-2" type="button">
          <i data-lucide="download" class="w-4 h-4"></i>
          Export CSV
        </button>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-color">
              <th class="py-2 pr-3">Recorded At</th>
              <th class="py-2 pr-3">pH</th>
              <th class="py-2 pr-3">DO</th>
              <th class="py-2 pr-3">Temp</th>
              <th class="py-2 pr-3">Source</th>
            </tr>
          </thead>
          <tbody id="readingsTbody">
            <tr>
              <td class="py-3 text-muted" colspan="5">Select a pond…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <!-- PHP interval -> JS -->
  <script>
    window.__REPORTS_INTERVAL__ = "<?php echo htmlspecialchars($interval ?? 'daily'); ?>";
  </script>

  <script src="assets/js/reports.js"></script>
</body>
</html>


