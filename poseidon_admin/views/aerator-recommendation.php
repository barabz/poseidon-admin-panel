<?php $currentPage = 'aerator-recommendation'; ?>
<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>POSEIDON - AI Command Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  
  <!-- AI and Visualization Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <link rel="stylesheet" href="assets/css/monitoring.css">
  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>
<body class="min-h-screen bg-gray-50 relative">

<?php require __DIR__ . '/partials/sidebar.php'; ?>

<header class="sticky top-0 z-40 bg-white border-b px-6 py-4 ml-64 shadow-sm">
  <div>
    <h1 class="text-2xl font-bold flex items-center gap-2 text-gray-800">
      <i data-lucide="brain-circuit" class="w-6 h-6 text-blue-600"></i>
      AI Command Center
    </h1>
    <p class="text-sm text-muted mt-1">
      Predictive models and neural network analysis for fishpond optimization.
    </p>
  </div>
</header>

<main class="ml-64 px-6 py-6 space-y-6" id="mainContent">
  <!-- Pond Selector -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <label class="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-700">
      <i data-lucide="crosshair" class="w-4 h-4 text-blue-500"></i>
      Select Target Environment
    </label>
    <select id="pondSelect" class="w-full p-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
      <option>Loading environments...</option>
    </select>
  </div>

  <div id="aiResults" class="space-y-6">
    
    <!-- Top Row: Overview & Equipment -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Computed Specs -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-1">
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Environment Specs</h2>
        <div class="space-y-4">
          <div>
            <p class="text-xs text-gray-400">Target Species</p>
            <p id="pondSpecies" class="text-lg font-bold text-gray-800 uppercase"></p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-gray-400">Area</p>
              <p id="pondArea" class="font-bold text-gray-700"></p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Volume</p>
              <p id="pondVolume" class="font-bold text-gray-700"></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment Neural Match -->
      <div class="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6 col-span-1 lg:col-span-2 relative overflow-hidden">
        <i data-lucide="cpu" class="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-50"></i>
        
        <h2 class="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4"></i> Neural Network Equipment Match
        </h2>
        
        <div class="grid grid-cols-2 gap-6 mb-4">
          <div>
            <p class="text-xs text-blue-600 font-semibold">Recommended Hardware</p>
            <p id="recType" class="text-xl font-bold text-gray-900"></p>
          </div>
          <div>
            <p class="text-xs text-blue-600 font-semibold">Power Requirement</p>
            <p id="recHP" class="text-xl font-bold text-gray-900"></p>
          </div>
        </div>

        <p id="recNotes" class="text-sm text-gray-700 leading-relaxed mb-6 border-l-4 border-blue-400 pl-3"></p>
        
        <div class="flex items-center gap-3 pt-4 border-t border-blue-200/60 relative z-10">
          <p class="text-xs font-semibold text-gray-500 uppercase">Procure via:</p>
          <a id="btnShopee" href="#" target="_blank" class="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded shadow transition flex items-center gap-1">
            <i data-lucide="shopping-bag" class="w-3 h-3"></i> Shopee
          </a>
          <a id="btnLazada" href="#" target="_blank" class="px-4 py-1.5 bg-[#0f146d] hover:bg-blue-900 text-white text-xs font-bold rounded shadow transition flex items-center gap-1">
            <i data-lucide="shopping-cart" class="w-3 h-3"></i> Lazada
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom Row: System Optimizer (Chart & Strategy) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i data-lucide="activity" class="w-5 h-5 text-blue-500"></i>
          AI Volatility Analysis & Strategy
        </h2>
      </div>

      <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Strategy & Visual Meters -->
        <div class="col-span-1 space-y-6">
          <div>
            <p class="text-xs text-gray-500 font-semibold uppercase mb-1">Water Volatility Index</p>
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>Stable</span>
              <span>Erratic</span>
            </div>
            <!-- Dynamic Gauge Bar -->
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div id="volatilityGauge" class="h-full rounded-full transition-all duration-1000 ease-out w-0 bg-green-500"></div>
            </div>
            <p id="volatilityStatusText" class="text-xs font-bold mt-2 text-gray-600">Analyzing...</p>
          </div>

          <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 class="text-sm font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Optimal Thresholds</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex justify-between"><span>pH Range:</span> <span id="ai-ph-range" class="font-bold text-blue-600">--</span></li>
              <li class="flex justify-between"><span>Temp Range:</span> <span id="ai-temp-range" class="font-bold text-blue-600">--</span></li>
              <li class="flex justify-between"><span>Safe DO Limit:</span> <span id="ai-do-min" class="font-bold text-blue-600">--</span></li>
            </ul>
          </div>

          <div>
            <h3 class="text-xs text-gray-500 font-semibold uppercase mb-2">Recommended Strategy</h3>
            <div class="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <p id="ai-wx-mode" class="font-bold text-lg text-gray-800">--</p>
              <p id="ai-wx-interval" class="text-sm text-blue-600 font-semibold mt-1">--</p>
            </div>
          </div>
        </div>

        <!-- Chart.js Visualization -->
        <div class="col-span-1 lg:col-span-2 flex flex-col">
          <div class="bg-white rounded-xl border border-gray-200 p-4 flex-grow relative">
            <h3 class="text-gray-600 font-semibold text-sm mb-4 flex items-center gap-2">
               Environmental Trend Projections
            </h3>
            <div class="w-full h-64">
              <canvas id="aiChart"></canvas>
            </div>
            <p id="ai-wx-reasoning" class="text-sm text-gray-600 mt-4 leading-relaxed bg-gray-50 p-3 rounded border border-gray-100"></p>
          </div>
        </div>

      </div>
    </div>

  </div>
</main>
<script>lucide.createIcons();</script>
<script src="assets/js/aerator-recommendation.js?v=7"></script>
</body>
</html>

