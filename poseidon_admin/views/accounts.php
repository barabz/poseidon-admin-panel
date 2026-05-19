<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POSEIDON Admin - Account Management</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

  <link rel="stylesheet" href="assets/css/accounts.css">

  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen">
  <?php require __DIR__ . '/partials/sidebar.php'; ?>

  <!-- Header -->
  <header class="sticky top-0 z-40 card border-b border-color px-4 py-3">
    <div id="headerContainer" class="ml-64 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold">Account Management</h1>
      </div>

      <!-- Keep design button (we will show info; we won't create Auth users from client) -->
      <button id="addAccountBtn" class="btn-primary px-4 py-2 rounded text-sm flex items-center gap-2 hover:opacity-90" type="button">
        <i data-lucide="plus" class="w-4 h-4"></i> Add Worker
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main id="mainContainer" class="ml-64 px-4 py-6">
    <!-- Worker Cards Grid -->
    <div id="accountsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- JS will inject worker cards here -->
      <div class="text-sm text-muted">Loading worker accounts...</div>
    </div>
  </main>

  <!-- Add Worker Modal (Design kept; informational only) -->
  <div id="addAccountModal" class="modal">
    <div class="card rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Add New Worker</h2>
        <button id="closeAddAccount" class="bg-transparent hover:bg-gray-100 p-1 rounded" type="button">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-4 text-sm">
        <p class="text-muted">
          For security, creating login accounts should be done in <b>Firebase Authentication</b>.
          Then create a matching Firestore document in <code>users/{UID}</code> with <code>role = worker</code>.
        </p>

        <div class="bg-white border border-color rounded p-3 text-xs text-muted">
          Required Firestore fields (example):
          <div class="mt-2">
            <code>role: "worker"</code><br>
            <code>status: "active"</code><br>
            <code>displayName: "Worker Name"</code><br>
            <code>email: "worker@email.com"</code>
          </div>
        </div>

        <button id="closeAddAccount2" class="w-full btn-primary p-3 rounded font-medium hover:opacity-90" type="button">
          Got it
        </button>
      </div>
    </div>
  </div>

  <!-- Toast (simple) -->
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

  <script src="assets/js/accounts.js"></script>
</body>
</html>


