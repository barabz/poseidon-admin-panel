<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Water Exchange</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>
<body class="bg-gray-50 min-h-screen">
    <?php require __DIR__ . '/partials/sidebar.php'; ?>

    <div class="ml-64 p-8">
        <div class="flex justify-between items-end mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Water Exchange Control</h1>
                <div class="mt-3 flex items-center gap-3">
                    <label class="text-xs font-bold text-gray-400 uppercase">Active Device:</label>
                    <select id="deviceSelector" onchange="switchDevice(this.value)" class="p-2 border rounded-lg bg-white shadow-sm font-medium text-green-700 outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Select IoT Device...</option>
                    </select>

                    <a id="registerDeviceBtn" href="index.php?page=water-exchange-register"
                       class="ml-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-sm hover:bg-green-700 transition inline-flex items-center justify-center">
                        Register Device
                    </a>
                </div>
            </div>
            <div id="connection-status" class="px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                Disconnected
            </div>
        </div>

        <div id="mainContent" class="opacity-50 pointer-events-none transition-all duration-300">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 class="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <i data-lucide="link" class="w-4 h-4"></i> Water Exchange Configuration
                        </h2>

                        <div class="grid grid-cols-1 gap-6">
                            <div>
                                <label class="block text-xs font-semibold mb-2 text-gray-600">Link to Fishpond</label>
                                <select id="pondLinker" onchange="linkPond(this.value)" class="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:bg-white transition-all">
                                    <option value="">No Pond Linked</option>
                                </select>
                                
                                <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="cpu" class="w-4 h-4 text-gray-400"></i>
                                        <span class="text-xs font-bold text-gray-500 uppercase">Companion Sensor:</span>
                                    </div>
                                    <div id="companionSensorBadge" class="px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300">
                                        WAITING FOR POND...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div class="flex items-center justify-between mb-8">
                            <h2 class="text-lg font-bold text-gray-800">Operation Mode</h2>
                            <div class="flex bg-gray-100 p-1 rounded-xl">
                                <button onclick="updateMode('manual')" id="btn-manual" class="px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-white shadow text-gray-900">
                                    Manual
                                </button>
                                <button onclick="updateMode('auto')" id="btn-auto" class="px-6 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500">
                                    Automatic
                                </button>
                            </div>
                        </div>

                        <div id="manual-controls" class="py-8 flex flex-col items-center justify-center border-t border-gray-50">
                            
                            <button id="power-btn" onclick="toggleMasterPower()" class="w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 mb-8">
                                <i data-lucide="power" class="w-8 h-8 mb-1"></i>
                                <span id="power-btn-label" class="font-black text-sm uppercase">OFF</span>
                            </button>

                            <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
                                <button id="drain-btn" onclick="toggleDrain()" class="p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                                    <i data-lucide="arrow-down-circle" class="w-6 h-6 mb-2"></i>
                                    <span class="font-bold text-xs uppercase">Drain Pump</span>
                                    <span id="drain-btn-label" class="text-[10px] font-black mt-1 text-gray-400">OFF</span>
                                </button>
                                <button id="fill-btn" onclick="toggleFill()" class="p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                                    <i data-lucide="arrow-up-circle" class="w-6 h-6 mb-2"></i>
                                    <span class="font-bold text-xs uppercase">Fill Pump</span>
                                    <span id="fill-btn-label" class="text-[10px] font-black mt-1 text-gray-400">OFF</span>
                                </button>
                            </div>
                            <p class="mt-6 text-xs text-gray-400 font-medium text-center">Use the master button to cycle both, or toggle them individually.</p>
                        </div>

                        <div id="auto-controls" class="hidden pt-6 border-t border-gray-50 space-y-6">
                            
                            <div id="noSensorWarning" style="display: none;" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg items-center gap-2 text-xs font-bold">
                                <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>
                                WARNING: No Sensor linked to this pond. Auto-Threshold will not trigger!
                            </div>

                            <div class="flex gap-4">
                                <button onclick="updateBasis('threshold')" id="basis-threshold-btn" class="flex-1 p-4 border-2 rounded-xl text-left transition-all">
                                    <p class="font-bold text-sm">Sensor Threshold</p>
                                    <p class="text-[10px] text-gray-400">Triggers via Pond Threshold</p>
                                </button>

                                <button onclick="updateBasis('interval')" id="basis-interval-btn" class="flex-1 p-4 border-2 rounded-xl text-left transition-all">
                                    <p class="font-bold text-sm">Time Interval</p>
                                    <p class="text-[10px] text-gray-400">Triggers on a schedule</p>
                                </button>
                            </div>

                            <div id="threshold-info" class="p-5 bg-green-50 rounded-2xl flex justify-between items-center border border-green-100">
                                <div>
                                    <p class="text-[10px] font-bold text-green-600 uppercase">Target Trigger Point</p>
                                    <p id="threshold-desc" class="text-xs text-green-800 mt-1 font-medium italic">Connecting to pond thresholds...</p>
                                </div>
                                <span id="active-threshold-val" class="text-3xl font-black text-green-700">--</span>
                            </div>

                            <div id="interval-settings" class="hidden p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                                <div class="mb-4">
                                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Run Pump Every:</label>
                                    <div class="flex gap-3">
                                        <input type="number" min="1" id="input-interval-value" class="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-sm transition-all" placeholder="e.g. 12">
                                        <select id="input-interval-unit" class="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-sm bg-white transition-all">
                                            <option value="secs">Seconds</option>
                                            <option value="mins">Minutes</option>
                                            <option value="hours" selected>Hours</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">For a Duration Of:</label>
                                    <div class="flex gap-3">
                                        <input type="number" min="1" id="input-duration-value" class="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-sm transition-all" placeholder="e.g. 30">
                                        <select id="input-duration-unit" class="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-sm bg-white transition-all">
                                            <option value="secs">Seconds</option>
                                            <option value="mins" selected>Minutes</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <p class="mt-4 text-[10px] text-gray-400 italic font-medium">Changes will automatically be pending in the top right 'Save' button.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div class="relative z-10">
                            <h3 class="text-[10px] font-black text-green-400 uppercase tracking-widest mb-6">Live Telemetry</h3>
                            <div class="space-y-6">
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase font-bold">System State</p>
                                    <p id="stat-power" class="text-3xl font-black transition-colors">--</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase font-bold">Last Server Sync</p>
                                    <p id="stat-time" class="text-sm font-medium text-gray-300">--</p>
                                </div>
                            </div>
                        </div>
                        <div class="absolute -right-4 -bottom-4 opacity-10">
                            <i data-lucide="cpu" class="w-32 h-32"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <script src="assets/js/water-exchange.js"></script>
</body>
</html>