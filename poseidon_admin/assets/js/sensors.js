// assets/js/sensors.js
(function () {
  if (window.lucide) window.lucide.createIcons();

  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) {
    console.error("Missing Firebase config: window.__FIREBASE_CONFIG__");
    return;
  }
  if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  const LS_KEY = "poseidon_sensor_active_pond";
  const el = (id) => document.getElementById(id);

  let currentPondId = null;
  let pondsUnsub = null;
  let pondDocUnsub = null;
  let devicesUnsub = null; 
  let companionPumpUnsub = null; // Listener for the companion pump
  let allDevices = [];     

  // Draft/save state
  let serverState = null; 
  let draftState = null;  
  let isDirty = false;
  let isSaving = false;
  let pendingSaveToken = null;

  // ---------------- UI helpers ----------------
  function setDisconnected() {
    const badge = el("connection-status");
    if (!badge) return;
    badge.innerText = "Disconnected";
    badge.className = "px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200";
  }

  function setConnected() {
    const badge = el("connection-status");
    if (!badge) return;
    badge.innerText = "Connected";
    badge.className = "px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200";
  }

  function disableUI() {
    const main = el("mainContent");
    if (main) main.classList.add("opacity-50", "pointer-events-none");

    currentPondId = null;
    serverState = null;
    draftState = null;
    isDirty = false;
    isSaving = false;
    pendingSaveToken = null;

    if (el("saveBtn")) el("saveBtn").disabled = true;
    if (el("deviceSelector")) el("deviceSelector").disabled = true;

    setSaveBadge(null);
    setDisconnected();

    setText("live-ph", "--");
    setText("live-temp", "--");
    setText("live-do", "--");
    setText("pond-status", "--");
    
    setInput("phMinInput", "");
    setInput("phMaxInput", "");
    setInput("doMinInput", "");
    setInput("doMaxInput", "");
    setInput("tempMinInput", "");
    setInput("tempMaxInput", "");

    // Reset Companion Pump UI
    if (companionPumpUnsub) { companionPumpUnsub(); companionPumpUnsub = null; }
    const badge = el("companionPumpBadge");
    if (badge) {
        badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300";
        badge.innerText = "WAITING FOR POND...";
    }
  }

  function enableUI() {
    const main = el("mainContent");
    if (main) main.classList.remove("opacity-50", "pointer-events-none");
    if (el("deviceSelector")) el("deviceSelector").disabled = false;
  }

  function setText(id, val) {
    const node = el(id);
    if (node) node.innerText = val;
  }

  function setInput(id, val) {
    const node = el(id);
    if (node) node.value = val;
  }

  function setSaveBadge(state, text) {
    const badge = el("saveStateBadge");
    if (!badge) return;
    if (!state) { badge.classList.add("hidden"); return; }

    badge.classList.remove("hidden");
    badge.className = "px-3 py-1.5 rounded-full text-xs font-bold border";

    if (state === "dirty") badge.classList.add("bg-amber-100", "text-amber-700", "border-amber-200");
    if (state === "saving") badge.classList.add("bg-blue-100", "text-blue-700", "border-blue-200");
    if (state === "saved") badge.classList.add("bg-green-100", "text-green-700", "border-green-200");
    if (state === "error") badge.classList.add("bg-red-100", "text-red-700", "border-red-200");

    badge.innerText = text || "";
  }

  function setDirty(dirty) {
    isDirty = dirty;
    const saveBtn = el("saveBtn");
    if (saveBtn) saveBtn.disabled = !isDirty || isSaving || !currentPondId;

    if (!currentPondId) { setSaveBadge(null); return; }
    if (isSaving) setSaveBadge("saving", pendingSaveToken ? "Verifying…" : "Saving…");
    else if (isDirty) setSaveBadge("dirty", "Unsaved changes");
  }

  function setSaving(saving) {
    isSaving = saving;
    setDirty(isDirty);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  // ---------------- Data normalization ----------------
  function normalizePond(data) {
    const thresholds = data.thresholds || {};
    const defaults = data.defaultThresholds || {};
    const readings = data.readings || {};
    const staticValues = data.staticValues || {};

    return {
      name: data.name || null,
      status: data.status || null,
      updatedAt: data.updatedAt || null,
      thresholdsSaveToken: data.thresholdsSaveToken || null,
      thresholds: {
        phMin: thresholds.phMin ?? null, phMax: thresholds.phMax ?? null,
        doMin: thresholds.doMin ?? null, doMax: thresholds.doMax ?? null,
        tempMin: thresholds.tempMin ?? null, tempMax: thresholds.tempMax ?? null,
      },
      defaultThresholds: {
        phMin: defaults.phMin ?? null, phMax: defaults.phMax ?? null,
        doMin: defaults.doMin ?? null, doMax: defaults.doMax ?? null,
        tempMin: defaults.tempMin ?? null, tempMax: defaults.tempMax ?? null,
      },
      live: {
        ph: readings.ph ?? staticValues.ph ?? null,
        temp: readings.temp ?? staticValues.temp ?? null,
        do: readings.do ?? staticValues.do ?? null,
      },
    };
  }

  // ---------------- Hardware Binding Logic ----------------
  function listenToDevices() {
    if (devicesUnsub) devicesUnsub();
    devicesUnsub = db.collection("devices").where("type", "==", "sensor").onSnapshot(snap => {
      allDevices = [];
      snap.forEach(doc => {
        allDevices.push({ id: doc.id, ...doc.data() });
      });
      renderDeviceSelector();
    });
  }

  // Search for a pump on the same pond
  function listenToCompanionPump(pondId) {
    if (companionPumpUnsub) companionPumpUnsub();
    const badge = el("companionPumpBadge");
    if (!badge) return;

    if (!pondId) {
        badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300";
        badge.innerText = "WAITING FOR POND...";
        return;
    }

    badge.innerText = "CHECKING...";

    companionPumpUnsub = db.collection("devices")
        .where("assignedPondId", "==", pondId)
        .where("type", "==", "pump")
        .onSnapshot(snap => {
            if (!snap.empty) {
                badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200";
                badge.innerText = "CONNECTED";
            } else {
                badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200";
                badge.innerText = "NOT LINKED";
            }
        }, err => {
            console.error("Companion Pump Check Error: ", err);
        });
  }

  function renderDeviceSelector() {
    const sel = el("deviceSelector");
    const linkBadge = el("hardware-link-status");
    if (!sel || !currentPondId) return;

    const currentAssigned = allDevices.find(d => d.assignedPondId === currentPondId);

    let html = `<option value="">-- No Hardware Linked --</option>`;
    allDevices.forEach(d => {
      let label = `${d.name || "Unknown Device"} (${d.id})`;
      if (d.assignedPondId && d.assignedPondId !== currentPondId) {
        label += ` - [In use elsewhere]`;
      }
      const selected = (currentAssigned && currentAssigned.id === d.id) ? "selected" : "";
      html += `<option value="${d.id}" ${selected}>${label}</option>`;
    });

    sel.innerHTML = html;

    if (linkBadge) {
      if (currentAssigned) {
        linkBadge.innerText = "HARDWARE LINKED";
        linkBadge.className = "px-2 py-0.5 rounded text-[9px] font-bold bg-green-900 text-green-300 border border-green-700";
      } else {
        linkBadge.innerText = "NO HARDWARE LINKED";
        linkBadge.className = "px-2 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-gray-400 border border-gray-700";
      }
    }
  }

  window.handleDeviceChange = async function(newDeviceId) {
    if (!currentPondId) return;
    const sel = el("deviceSelector");
    sel.disabled = true;

    try {
      const currentAssigned = allDevices.find(d => d.assignedPondId === currentPondId);
      if (currentAssigned && currentAssigned.id !== newDeviceId) {
        await db.collection("devices").doc(currentAssigned.id).update({ assignedPondId: null });
      }

      if (newDeviceId) {
        await db.collection("devices").doc(newDeviceId).update({ 
          assignedPondId: currentPondId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Hardware bind failed:", e);
      alert("Failed to bind hardware. Check connection.");
    } finally {
      sel.disabled = false;
    }
  }

  // ---------------- Rendering Thresholds ----------------
  function renderFromDraft() {
    if (!draftState) return;
    setInput("phMinInput", draftState.thresholds.phMin ?? "");
    setInput("phMaxInput", draftState.thresholds.phMax ?? "");
    setInput("doMinInput", draftState.thresholds.doMin ?? "");
    setInput("doMaxInput", draftState.thresholds.doMax ?? "");
    setInput("tempMinInput", draftState.thresholds.tempMin ?? "");
    setInput("tempMaxInput", draftState.thresholds.tempMax ?? "");
  }

  function renderTelemetryFromServer() {
    if (!serverState) return;
    const l = serverState.live || {};
    setText("live-ph", l.ph != null ? String(l.ph) : "--");
    setText("live-temp", l.temp != null ? String(l.temp) : "--");
    setText("live-do", l.do != null ? String(l.do) : "--");
    setText("pond-status", serverState.status || "--");
  }

  // ---------------- Pond dropdown + listener ----------------
  function initPondsDropdown() {
    const selector = el("pondSelector");
    if (!selector) return;

    if (pondsUnsub) pondsUnsub();
    pondsUnsub = db.collection("fishponds").onSnapshot((snap) => {
      selector.innerHTML = '<option value="">Select Fishpond.</option>';
      if (snap.empty) { disableUI(); return; }

      const ids = [];
      snap.forEach((doc) => {
        const name = (doc.data() || {}).name || doc.id;
        selector.innerHTML += `<option value="${doc.id}">${name}</option>`;
        ids.push(doc.id);
      });

      const saved = localStorage.getItem(LS_KEY);
      let pickId = null;
      if (currentPondId && ids.includes(currentPondId)) pickId = currentPondId;
      else if (saved && ids.includes(saved)) pickId = saved;
      else pickId = ids[0];

      selector.value = pickId || "";
      if (pickId && pickId !== currentPondId) window.switchPond(pickId);
    });
  }

  window.switchPond = function switchPond(id) {
    if (!id) {
      localStorage.removeItem(LS_KEY);
      disableUI();
      return;
    }
    currentPondId = id;
    localStorage.setItem(LS_KEY, id);
    isDirty = false;
    isSaving = false;
    pendingSaveToken = null;

    enableUI();
    renderDeviceSelector(); 
    listenToPondDoc(id);
    listenToCompanionPump(id); // TRIGGERS THE PUMP CHECK
  };

  function listenToPondDoc(pondId) {
    if (pondDocUnsub) pondDocUnsub();
    setSaveBadge("saving", "Loading…");
    setDisconnected();

    pondDocUnsub = db.collection("fishponds").doc(pondId).onSnapshot(async (doc) => {
      if (!doc.exists) return;
      setConnected();
      serverState = normalizePond(doc.data() || {});
      renderTelemetryFromServer();

      if (pendingSaveToken && serverState.thresholdsSaveToken === pendingSaveToken) {
        setSaveBadge("saved", `Saved ✓`);
        pendingSaveToken = null;
        setSaving(false);
        isDirty = false;
        try {
          await db.collection("fishponds").doc(currentPondId).update({ thresholdsSaveToken: firebase.firestore.FieldValue.delete() });
        } catch (_) {}
      }

      if (!isDirty && !isSaving) {
        draftState = deepClone(serverState);
        renderFromDraft();
        setSaveBadge("saved", "Saved ✓");
        setDirty(false);
      }
    });
  }

  // ---------------- Input binding (draft only) ----------------
  function bindInputs() {
    const bind = (id, key) => {
      const input = el(id);
      if (!input) return;
      input.addEventListener("input", () => {
        if (!draftState) return;
        const v = input.value === "" ? null : Number(input.value);
        draftState.thresholds[key] = Number.isFinite(v) ? v : null;
        setDirty(true);
      });
    };
    bind("phMinInput", "phMin"); bind("phMaxInput", "phMax");
    bind("doMinInput", "doMin"); bind("doMaxInput", "doMax");
    bind("tempMinInput", "tempMin"); bind("tempMaxInput", "tempMax");
  }

  window.resetToDefault = function resetToDefault() {
    if (!draftState) return;
    draftState.thresholds = deepClone(draftState.defaultThresholds);
    setDirty(true);
    renderFromDraft();
  };

  function validateThresholds(th) {
    const num = (x) => x != null && Number.isFinite(Number(x));
    const lt = (a, b) => num(a) && num(b) && Number(a) < Number(b);

    if (th.phMin != null || th.phMax != null) if (!lt(th.phMin, th.phMax)) return "pH Min must be less than pH Max.";
    if (th.doMin != null || th.doMax != null) if (!lt(th.doMin, th.doMax)) return "DO Min must be less than DO Max.";
    if (th.tempMin != null || th.tempMax != null) if (!lt(th.tempMin, th.tempMax)) return "Temp Min must be less than Temp Max.";
    return null;
  }

  window.saveChanges = async function saveChanges() {
    if (!currentPondId || !draftState) return;
    const err = validateThresholds(draftState.thresholds);
    if (err) { setSaveBadge("error", "Invalid"); alert(err); return; }

    const token = `th_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    pendingSaveToken = token;

    try {
      setSaving(true);
      await db.collection("fishponds").doc(currentPondId).update({
        thresholds: deepClone(draftState.thresholds),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        thresholdsSaveToken: token,
      });
      isDirty = false;
      el("saveBtn").disabled = true;
    } catch (e) {
      console.error("Save failed:", e);
      pendingSaveToken = null;
      setSaving(false);
      setDirty(true);
      setSaveBadge("error", "Save failed");
    }
  };

  // ---------------- Auth guard + init ----------------
  auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = "index.php?page=login"; return; }
    bindInputs();
    listenToDevices(); 
    initPondsDropdown();
  });

  disableUI();
})();