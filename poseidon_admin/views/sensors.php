<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Sensors</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>
<body class="bg-gray-50 min-h-screen">
    <?php require __DIR__ . '/partials/sidebar.php'; ?>

    <div class="ml-64 p-8">
        <div class="flex justify-between items-end mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Sensor Management</h1>
                <div class="mt-3 flex items-center gap-3">
                    <label class="text-xs font-bold text-gray-400 uppercase">Active Pond:</label>
                    <select id="pondSelector"
                            onchange="switchPond(this.value)"
                            class="p-2 border rounded-lg bg-white shadow-sm font-medium text-green-700 outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Select Fishpond.</option>
                    </select>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <span id="saveStateBadge"
                      class="hidden px-3 py-1.5 rounded-full text-xs font-bold border">
                    --
                </span>

                <button id="saveBtn"
                        onclick="saveChanges()"
                        class="px-5 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled>
                    Save Thresholds
                </button>

                <div id="connection-status"
                     class="px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                    Disconnected
                </div>
            </div>
        </div>

        <div id="mainContent" class="opacity-50 pointer-events-none transition-all duration-300">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-6">
                    
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="p-2 bg-indigo-100 rounded-lg">
                                <i data-lucide="cpu" class="w-5 h-5 text-indigo-700"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-gray-800">Hardware Node Binding</h2>
                                <p class="text-xs text-gray-400">Link a physical ESP32 sensor node to this pond.</p>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Assigned Sensor Device</label>
                            <select id="deviceSelector"
                                    onchange="handleDeviceChange(this.value)"
                                    class="w-full p-3 border-2 rounded-xl focus:border-indigo-500 outline-none font-bold bg-white cursor-pointer transition">
                                <option value="">-- No Hardware Linked --</option>
                            </select>
                            <p class="mt-2 text-[10px] text-gray-400 font-medium mb-4">Changes here save automatically and update the hardware's data routing instantly.</p>
                            
                            <div class="pt-4 border-t border-gray-200 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="waves" class="w-4 h-4 text-gray-400"></i>
                                    <span class="text-xs font-bold text-gray-500 uppercase">Companion Pump:</span>
                                </div>
                                <div id="companionPumpBadge" class="px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300">
                                    WAITING FOR POND...
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-lg font-bold text-gray-800">Threshold Configuration</h2>
                            <button onclick="resetToDefault()"
                                    class="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition text-sm">
                                Reset to Default
                            </button>
                        </div>

                        <p class="text-xs text-gray-400 mb-6">
                            These values trigger warnings. No auto-save — click Save to apply.
                        </p>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                                <div class="flex items-center gap-2 mb-4">
                                    <i data-lucide="droplet" class="w-5 h-5 text-green-700"></i>
                                    <h3 class="font-black text-gray-800">pH</h3>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Min</label>
                                        <input id="phMinInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Max</label>
                                        <input id="phMaxInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                </div>
                            </div>

                            <div class="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                                <div class="flex items-center gap-2 mb-4">
                                    <i data-lucide="wind" class="w-5 h-5 text-green-700"></i>
                                    <h3 class="font-black text-gray-800">Dissolved Oxygen (mg/L)</h3>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Min</label>
                                        <input id="doMinInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Max</label>
                                        <input id="doMaxInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                </div>
                            </div>

                            <div class="p-5 rounded-2xl border border-gray-100 bg-gray-50 md:col-span-2">
                                <div class="flex items-center gap-2 mb-4">
                                    <i data-lucide="thermometer" class="w-5 h-5 text-green-700"></i>
                                    <h3 class="font-black text-gray-800">Temperature (°C)</h3>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Min</label>
                                        <input id="tempMinInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Max</label>
                                        <input id="tempMaxInput" type="number" step="0.1" class="w-full p-3 border-2 rounded-xl focus:border-green-500 outline-none font-bold bg-white">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div class="relative z-10">
                            <div class="flex justify-between items-start mb-6">
                                <h3 class="text-[10px] font-black text-green-400 uppercase tracking-widest">Live Values</h3>
                                <div id="hardware-link-status" class="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                    NO HARDWARE LINKED
                                </div>
                            </div>

                            <div class="space-y-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-[10px] text-gray-400 uppercase font-bold">pH</p>
                                        <p id="live-ph" class="text-3xl font-black">--</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-[10px] text-gray-400 uppercase font-bold">Temp</p>
                                        <p id="live-temp" class="text-3xl font-black">--</p>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-[10px] text-gray-400 uppercase font-bold">DO</p>
                                        <p id="live-do" class="text-3xl font-black">--</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-[10px] text-gray-400 uppercase font-bold">Pond Status</p>
                                        <p id="pond-status" class="text-sm font-bold text-gray-200">--</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="absolute -right-4 -bottom-4 opacity-10">
                            <i data-lucide="activity" class="w-32 h-32"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <script src="assets/js/sensors.js"></script>
</body>
</html>