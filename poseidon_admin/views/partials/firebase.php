<?php
// views/partials/firebase.php

// Keep this config exactly as your existing working project config.
$firebaseConfig = [
  "apiKey" => "AIzaSyDrzg4HoUMyS4dWA5ouA-IKElbc4FFHHsc",
  "authDomain" => "poseidon-database-c9f18.firebaseapp.com",
  "projectId" => "poseidon-database-c9f18",
  "storageBucket" => "poseidon-database-c9f18.firebasestorage.app",
  "messagingSenderId" => "943407574162",
  "appId" => "1:943407574162:web:12f0576e279f3134f64a4b",
  "measurementId" => "G-Z92JV15HV7",
  "databaseURL" => "https://poseidon-database-c9f18-default-rtdb.asia-southeast1.firebasedatabase.app"
  
];
?>

<!-- Firebase (Compat) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>

<script>
  // Expose config to external JS file (no logic here)
  window.__FIREBASE_CONFIG__ = <?php echo json_encode($firebaseConfig, JSON_UNESCAPED_SLASHES); ?>;
</script>
