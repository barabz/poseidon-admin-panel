<?php
// poseidon_admin/views/profile.php
$currentPage = 'profile'; 
?>
<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>POSEIDON Admin - My Profile</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <link rel="stylesheet" href="assets/css/monitoring.css">

    <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen bg-gray-50 text-gray-800 font-sans">

    <?php require __DIR__ . '/partials/sidebar.php'; ?>

    <main class="ml-64 p-6 space-y-6">
        
        <header class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
                <p class="text-sm text-muted">Manage your admin account settings</p>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-1">
                <div class="card bg-white border border-color rounded-lg shadow-sm p-6 text-center">
                    <div class="w-24 h-24 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="user" class="w-12 h-12"></i>
                    </div>
                    <h2 id="displayTitle" class="text-xl font-bold text-gray-900">Loading...</h2>
                    <p id="displayEmail" class="text-sm text-gray-500 mb-4">...</p>
                    
                    <div class="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                        Administrator
                    </div>
                </div>
                
                <div class="card bg-white border border-color rounded-lg shadow-sm p-6 mt-6">
                    <h3 class="text-md font-bold text-gray-900 mb-3">Security</h3>
                    <button id="btnResetPassword" class="w-full py-2 px-4 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <i data-lucide="lock" class="w-4 h-4"></i> Send Password Reset
                    </button>
                    <p class="text-xs text-gray-400 mt-2 text-center">We'll send an email to your address.</p>
                </div>
            </div>

            <div class="lg:col-span-2">
                <div class="card bg-white border border-color rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-100">Account Details</h3>
                    
                    <form id="profileForm" class="space-y-5">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" id="inputFirstName" required
                                    class="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                                    placeholder="Juan">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" id="inputLastName" required
                                    class="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                                    placeholder="Dela Cruz">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" id="inputPhone" 
                                    class="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                                    placeholder="+63 900 000 0000">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="inputEmail" disabled
                                    class="w-full p-2.5 border border-gray-200 bg-gray-100 rounded text-gray-500 cursor-not-allowed">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Farm Name / Location</label>
                            <div class="relative">
                                <i data-lucide="map-pin" class="absolute left-3 top-3 w-5 h-5 text-gray-400"></i>
                                <input type="text" id="inputLocation" 
                                    class="w-full pl-10 p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                                    placeholder="e.g. Poseidon Main Farm, Concepcion">
                            </div>
                            <p class="text-xs text-gray-500 mt-1">This location will appear on your generated reports.</p>
                        </div>

                        <div class="pt-4 flex items-center justify-end gap-3">
                            <button type="submit" id="btnSave" class="btn-primary px-6 py-2.5 rounded text-white font-medium hover:bg-green-800 transition shadow-sm flex items-center gap-2">
                                <i data-lucide="save" class="w-4 h-4"></i> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <div id="toast" class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-20 opacity-0">
        <div class="bg-gray-800 text-white shadow-lg rounded px-4 py-3 flex items-center gap-3">
            <i data-lucide="check-circle" class="text-green-400 w-5 h-5"></i>
            <div>
                <h4 id="toastTitle" class="font-bold text-sm">Success</h4>
                <p id="toastMsg" class="text-xs text-gray-300">Profile updated.</p>
            </div>
        </div>
    </div>

    <script>lucide.createIcons();</script>
    <script src="assets/js/profile.js"></script>
</body>
</html>

