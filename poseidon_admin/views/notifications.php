<?php
$currentPage = 'notifications';
?>
<?php require_once __DIR__ . '/../session.php'; ?>
<?php requireLogin(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>POSEIDON - Notifications</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

  <link rel="stylesheet" href="assets/css/monitoring.css">
  <?php require __DIR__ . '/partials/firebase.php'; ?>
</head>

<body class="min-h-screen bg-gray-50">
<?php require __DIR__ . '/partials/sidebar.php'; ?>

<header class="sticky top-0 z-40 bg-white border-b px-6 py-4 ml-64">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <i data-lucide="bell" class="w-6 h-6"></i>
        Notifications
      </h1>
      <p class="text-sm text-muted mt-1">
        Real-time alerts generated from water quality readings (simulation)
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button id="markAllReadBtn" class="btn btn-primary flex items-center gap-2" type="button">
        <i data-lucide="check-check" class="w-4 h-4"></i>
        Mark All Read
      </button>
    </div>
  </div>
</header>

<main class="ml-64 px-6 py-6 space-y-6">

  <!-- Filters -->
  <div class="card p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs text-muted">Fishpond</label>
        <select id="pondFilter" class="w-full mt-1 p-2 rounded border border-color bg-white text-sm">
          <option value="all">All Ponds</option>
        </select>
      </div>

      <div>
        <label class="text-xs text-muted">Severity</label>
        <select id="severityFilter" class="w-full mt-1 p-2 rounded border border-color bg-white text-sm">
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      <div>
        <label class="text-xs text-muted">Status</label>
        <select id="readFilter" class="w-full mt-1 p-2 rounded border border-color bg-white text-sm">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
    </div>

    <div class="text-xs text-muted mt-3" id="notifHint">Loading alerts…</div>
  </div>

  <!-- List -->
  <div id="notifList" class="space-y-3"></div>

</main>

<script>lucide.createIcons();</script>
<script src="assets/js/notifications.js?v=1"></script>
</body>
</html>


