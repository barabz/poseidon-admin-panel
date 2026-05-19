(function () {
  // Firebase config injected by views/partials/firebase.php
  const firebaseConfig = window.__FIREBASE_CONFIG__;

  function readyFirebase() {
    if (!firebaseConfig) return false;
    if (!window.firebase) return false;

    // Avoid double init
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
    return true;
  }

  const badgeEl = document.getElementById("notifBadge");
  if (!badgeEl) return;

  function setBadgeCount(n) {
    const count = Number(n) || 0;
    if (count <= 0) {
      badgeEl.classList.add("hidden");
      badgeEl.textContent = "0";
      return;
    }
    badgeEl.classList.remove("hidden");
    badgeEl.textContent = count > 99 ? "99+" : String(count);
  }

  let started = false;

  function startListeners() {
    if (started) return;
    if (!readyFirebase()) return;

    started = true;

    const db = firebase.firestore();

    // --- Fallback (per-pond listeners) ---
    let unsubPonds = null;
    let unsubUnreadByPond = [];
    const unreadCounts = new Map(); // pondId -> count

    function clearFallback() {
      if (typeof unsubPonds === "function") unsubPonds();
      unsubPonds = null;
      unsubUnreadByPond.forEach((u) => {
        try { if (typeof u === "function") u(); } catch (_) {}
      });
      unsubUnreadByPond = [];
      unreadCounts.clear();
    }

    function recomputeTotal() {
      let total = 0;
      unreadCounts.forEach((v) => (total += Number(v) || 0));
      setBadgeCount(total);
    }

    function startFallback() {
      clearFallback();

      unsubPonds = db.collection("fishponds").onSnapshot(
        (snap) => {
          // Rebuild listeners each time ponds list changes (rare)
          unsubUnreadByPond.forEach((u) => {
            try { if (typeof u === "function") u(); } catch (_) {}
          });
          unsubUnreadByPond = [];
          unreadCounts.clear();

          snap.forEach((pondDoc) => {
            const pondId = pondDoc.id;
            const unsub = db
              .collection("fishponds")
              .doc(pondId)
              .collection("alerts")
              .where("read", "==", false)
              .onSnapshot(
                (aSnap) => {
                  unreadCounts.set(pondId, aSnap.size);
                  recomputeTotal();
                },
                (err) => {
                  console.warn("notif badge per-pond listener error:", err);
                  unreadCounts.set(pondId, 0);
                  recomputeTotal();
                }
              );
            unsubUnreadByPond.push(unsub);
          });

          recomputeTotal();
        },
        (err) => {
          console.warn("notif badge ponds listener error:", err);
          setBadgeCount(0);
        }
      );
    }

    // --- Primary: collectionGroup (fast, single listener) ---
    // If it fails (permissions/index/etc.), fallback to per-pond listeners.
    try {
      db.collectionGroup("alerts")
        .where("read", "==", false)
        .onSnapshot(
          (snap) => {
            setBadgeCount(snap.size);
          },
          (err) => {
            console.warn("notif badge collectionGroup error (fallback enabled):", err);
            startFallback();
          }
        );
    } catch (e) {
      console.warn("notif badge init failed (fallback enabled):", e);
      startFallback();
    }
  }

  // If auth exists, wait for auth state so Firestore rules won't block early init.
  function boot() {
    if (!readyFirebase()) return;

    try {
      const auth = firebase.auth ? firebase.auth() : null;
      if (auth && typeof auth.onAuthStateChanged === "function") {
        auth.onAuthStateChanged(() => {
          // Start regardless of signed-in user; rules will decide.
          startListeners();
        });
        // Also start after a short delay in case auth callback is slow.
        setTimeout(startListeners, 800);
      } else {
        startListeners();
      }
    } catch (e) {
      // If auth isn't configured, still attempt listeners.
      startListeners();
    }
  }

  // Wait briefly for window.__FIREBASE_CONFIG__ and firebase scripts to be present.
  let tries = 0;
  const t = setInterval(() => {
    tries += 1;
    if (window.__FIREBASE_CONFIG__ && window.firebase) {
      clearInterval(t);
      boot();
    } else if (tries > 40) {
      clearInterval(t);
      // Give up silently
    }
  }, 150);
})();