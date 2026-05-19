<?php
// logout.php
// Ends any PHP session (if used) and signs out Firebase Auth, then redirects to login.

require_once __DIR__ . '/session.php';

// Clear PHP session data
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'], $params['secure'], $params['httponly']
    );
}
@session_destroy();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Logging out…</title>
</head>
<body>
  <p style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#374151; padding:16px;">Logging out…</p>

  <?php require_once __DIR__ . '/views/partials/firebase.php'; ?>

  <script>
    (function () {
      try {
        var cfg = window.__FIREBASE_CONFIG__;
        if (cfg && window.firebase) {
          if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(cfg);
          var auth = firebase.auth();
          auth.signOut().finally(function () {
            window.location.href = 'index.php?page=login';
          });
          return;
        }
      } catch (e) {
        // fallthrough
      }

      // Fallback: redirect anyway
      window.location.href = 'index.php?page=login';
    })();
  </script>
</body>
</html>
