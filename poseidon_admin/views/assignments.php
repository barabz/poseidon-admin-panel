<?php
$currentPage = 'assignments';
?>
<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Worker Assignments</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    
    <link rel="stylesheet" href="assets/css/assignments.css">
    
    <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>
<body class="min-h-screen bg-gray-50 text-gray-800 font-sans">
    
    <?php require __DIR__ . '/partials/sidebar.php'; ?>

    <header class="sticky top-0 z-40 card border-b border-color px-4 py-3 bg-white">
        <div id="headerContainer" class="ml-64 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h1 class="text-xl font-semibold">Worker Assignments</h1>
            </div>
            
            <div class="flex items-center gap-2">
                <span id="assignmentCount" class="text-sm text-muted">
                    <span class="font-medium">0</span> ponds found
                </span>
            </div>
        </div>
    </header>

    <main id="mainContainer" class="ml-64 p-6">
        
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="relative flex-1">
                <i data-lucide="search" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                <input type="text" id="searchInput" placeholder="Search ponds..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none">
            </div>

            <div class="w-full sm:w-48">
                <div class="relative">
                    <i data-lucide="filter" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                    <select id="statusFilter" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none bg-white">
                        <option value="active" selected>Active Ponds</option>
                        <option value="inactive">Inactive / Archived</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="assignmentsGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12 text-muted">Loading fishponds...</div>
        </div>
    </main>

    <div id="assignModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 class="font-bold text-lg text-gray-800">Manage Workers</h3>
                <button id="closeAssignModal" class="text-gray-400 hover:text-gray-600 transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                <div>
                    <p class="text-xs font-bold text-muted uppercase mb-2">Selected Pond</p>
                    <div class="flex items-center gap-3 p-3 bg-green-50 rounded border border-green-100">
                        <div class="w-10 h-10 rounded bg-green-200 flex items-center justify-center text-green-700">
                            <i data-lucide="waves" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <p id="modalPondName" class="font-bold text-gray-800">--</p>
                            <p class="text-xs text-green-700">Assign workers to this unit</p>
                        </div>
                    </div>
                </div>

                <div>
                    <p class="text-xs font-bold text-muted uppercase mb-2">Available Workers</p>
                    <div id="workerCheckboxList" class="border border-gray-200 rounded divide-y divide-gray-100 space-y-0 max-h-64 overflow-y-auto bg-white">
                        <div class="text-sm text-muted p-3">Loading workers...</div>
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-800">
                    <div class="flex gap-2">
                        <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                        <p>Multiple workers can be assigned to one pond. Changes will be saved immediately.</p>
                    </div>
                </div>

                <button id="saveAssignmentBtn" class="w-full btn-primary p-3 rounded font-medium mt-2 shadow-lg hover:shadow-xl transition" type="button">
                    Save Assignment
                </button>
            </div>
        </div>
    </div>

    <div id="editPondModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 class="font-bold text-lg text-gray-800">Edit Fishpond</h3>
                <button id="closeEditModal" class="text-gray-400 hover:text-gray-600 transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                <input type="hidden" id="editPondId">
                
                <div>
                    <label class="block text-xs font-bold text-muted uppercase mb-1">Pond Name</label>
                    <input type="text" id="editPondName" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none">
                </div>

                <div>
                    <label class="block text-xs font-bold text-muted uppercase mb-1">Fish Species</label>
                    <input type="text" id="editSpecies" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g. Tilapia">
                </div>

                <div>
                    <label class="block text-xs font-bold text-muted uppercase mb-1">Dimensions</label>
                    <input type="text" id="editDimensions" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g. 50x50m">
                </div>

                <button id="savePondChangesBtn" class="w-full btn-primary p-3 rounded font-medium mt-2 shadow-lg hover:shadow-xl transition" type="button">
                    Save Changes
                </button>
            </div>
        </div>
    </div>

    <div id="toast" class="toast fixed bottom-6 right-6 transform transition-all duration-300 translate-y-20 opacity-0 z-50">
        <div class="bg-white border-l-4 border-green-600 shadow-lg rounded p-4 flex items-start gap-3 min-w-[300px]">
            <i data-lucide="check-circle" class="text-green-600 w-5 h-5 mt-0.5"></i>
            <div>
                <h4 id="toastTitle" class="font-bold text-gray-800 text-sm">Success</h4>
                <p id="toastMsg" class="text-sm text-gray-600 mt-1">Action completed.</p>
            </div>
            <button id="toastClose" class="ml-auto text-gray-400 hover:text-gray-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    </div>

    <script src="assets/js/assignments.js?v=4"></script>
</body>
</html>

