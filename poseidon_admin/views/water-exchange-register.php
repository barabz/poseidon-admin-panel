<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Register Water Exchange Device</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>
<body class="bg-gray-50 min-h-screen">
    <?php require __DIR__ . '/partials/sidebar.php'; ?>

    <div class="ml-64 p-8">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Register Water Exchange Device</h1>
                <p class="text-sm text-gray-500 mt-1">Create a new water exchange IoT device and optionally link it to a fishpond.</p>
            </div>

            <a href="index.php?page=water-exchange"
               class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                Back
            </a>
        </div>

        <!-- Card -->
        <div class="max-w-2xl">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 class="text-lg font-bold text-gray-800 mb-6">Device Details</h2>

                <div class="space-y-5">
                    <div>
                        <label class="block text-xs font-semibold mb-2 text-gray-600">Device Name</label>
                        <input id="newDeviceName" type="text"
                               class="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                               placeholder="e.g. Main Water Exchange">
                        <p class="text-xs text-gray-400 mt-2">Tip: use a name that matches the device label in the pond.</p>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold mb-2 text-gray-600">Assign to Fishpond (optional)</label>
                        <select id="newDevicePond"
                                class="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all">
                            <option value="">Loading ponds...</option>
                        </select>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <div class="text-xs text-gray-500">
                            This will create a document in <span class="font-semibold">iot_devices</span> with type <span class="font-semibold">water_exchange</span>.
                        </div>

                        <button id="confirmRegisterDevice" type="button"
                                class="px-5 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                            Register
                        </button>
                    </div>

                    <p id="registerDeviceError" class="hidden text-sm text-red-600 font-medium"></p>
                    <p id="registerDeviceOk" class="hidden text-sm text-green-700 font-semibold"></p>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/water-exchange-register.js"></script>
</body>
</html>


