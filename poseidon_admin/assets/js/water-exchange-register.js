// assets/js/water-exchange-register.js
(function () {
  if (window.lucide) window.lucide.createIcons();

  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) {
    console.error("Missing Firebase config: window.__FIREBASE_CONFIG__");
    showError("Missing Firebase config. Check views/partials/firebase.php.");
    return;
  }

  try {
    if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("Firebase init warning:", e);
  }

  if (!firebase.firestore) {
    console.error("Firestore SDK missing. Make sure firebase.php includes firestore.");
    showError("Firestore SDK missing. Please include firebase-firestore.js in firebase.php.");
    return;
  }

  const db = firebase.firestore();

  const els = {
    name: document.getElementById("newDeviceName"),
    pond: document.getElementById("newDevicePond"),
    btn: document.getElementById("confirmRegisterDevice"),
    err: document.getElementById("registerDeviceError"),
    ok: document.getElementById("registerDeviceOk"),
  };

  function showError(msg) {
    if (!els.err) return;
    els.err.textContent = msg;
    els.err.classList.remove("hidden");
    if (els.ok) els.ok.classList.add("hidden");
  }

  function showOk(msg) {
    if (!els.ok) return;
    els.ok.textContent = msg;
    els.ok.classList.remove("hidden");
    if (els.err) els.err.classList.add("hidden");
  }

  function setBusy(busy) {
    if (els.btn) els.btn.disabled = busy;
    if (els.btn) els.btn.textContent = busy ? "Registering..." : "Register";
  }

  async function loadPonds() {
    if (!els.pond) return;

    els.pond.innerHTML = '<option value="">No Pond Linked</option>';

    try {
      const snap = await db.collection("fishponds").get();
      if (snap.empty) return;

      snap.forEach((doc) => {
        const d = doc.data() || {};
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = d.name || doc.id;
        els.pond.appendChild(opt);
      });
    } catch (e) {
      console.error("Failed to load ponds:", e);
      els.pond.innerHTML = '<option value="">No Pond Linked (failed to load)</option>';
      showError("Could not load fishpond list. You can still register without linking a pond.");
    }
  }

  async function registerDevice() {
    const name = (els.name?.value || "").trim();
    const pondId = els.pond?.value || "";

    if (!name) {
      showError("Device name is required.");
      els.name?.focus();
      return;
    }

    setBusy(true);

    try {
      const payload = {
        type: "water_exchange",
        name,
        pondId: pondId || "",
        mode: "manual",
        status: "off",
        autoBasis: "threshold",
        intervalMinutes: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("iot_devices").add(payload);

      showOk("Device registered successfully. ID: " + ref.id);

      setTimeout(() => {
        window.location.href = "index.php?page=water-exchange";
      }, 800);
    } catch (e) {
      console.error("Register device failed:", e);
      showError(e?.message || "Failed to register device. Check Console for details.");
    } finally {
      setBusy(false);
    }
  }

  els.btn?.addEventListener("click", registerDevice);

  loadPonds();
})();
