(function () {
  // Icons
  if (window.lucide) window.lucide.createIcons();

  // Firebase config
  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) {
    console.error("Missing Firebase config: window.__FIREBASE_CONFIG__");
    return;
  }
  if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ----------------------------------------------------
  // The "Brain" for Automatic Threshold Alerts
  // ----------------------------------------------------
  const ALERT_COOLDOWN_HOURS = 0; 
  const _alertCooldown = new Map();

  function _alertKey(pondId, type, parameter) {
    return `${pondId}|${type}|${parameter}`;
  }

  async function _recentlyAlerted(pondId, type, parameter) {
    const key = _alertKey(pondId, type, parameter);
    const now = Date.now();
    const last = _alertCooldown.get(key);
    if (last && (now - last) < ALERT_COOLDOWN_HOURS * 3600 * 1000) return true;

    try {
      const snap = await db.collection("fishponds").doc(pondId).collection("alerts")
        .orderBy("createdAt", "desc").limit(20).get();
      for (const d of snap.docs) {
        const a = d.data();
        if (a?.type === type && a?.parameter === parameter) {
          const t = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          if (t && (now - t) < ALERT_COOLDOWN_HOURS * 3600 * 1000) {
            _alertCooldown.set(key, t);
            return true;
          }
          break;
        }
      }
    } catch (e) {
      console.warn("Alert cooldown check failed:", e?.message || e);
    }
    return false;
  }

  async function _createAlert({ pondId, type, parameter, message, value, threshold, recommendation }) {
    if (!pondId) return;
    if (await _recentlyAlerted(pondId, type, parameter)) return;

    await db.collection("fishponds").doc(pondId).collection("alerts").add({
      type, parameter, message, value: (value ?? null), threshold: threshold ?? null,
      recommendation: recommendation ?? null, read: false, source: "hardware-live",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    _alertCooldown.set(_alertKey(pondId, type, parameter), Date.now());
  }

  function _isFiniteNumber(x) { return Number.isFinite(Number(x)); }
  function _lastNAsc(n) {
    const arr = Array.isArray(currentReadingsAsc) ? currentReadingsAsc : [];
    if (arr.length < n) return [];
    return arr.slice(-n);
  }

  // This evaluates the ESP32 feed and creates notifications
  async function maybeTriggerAlerts(latestReading) {
    if (!currentPondId || !currentPondData || !latestReading) return;

    if (!isSensorLinked) return;

    // 🔴 THE FIX: Absolute Mathematical Timezone Compensation
    let isDataStale = false;
    if (!latestReading.recordedAt) {
        isDataStale = true;
    } else {
        let dataTime = typeof latestReading.recordedAt.toMillis === 'function' 
                       ? latestReading.recordedAt.toMillis() 
                       : new Date(latestReading.recordedAt).getTime();
        
        // Math.abs() prevents the "Future Timezone" bug from generating negative numbers
        if (Number.isNaN(dataTime) || Math.abs(Date.now() - dataTime) > 120000) {
            isDataStale = true;
        }
    }

    // If the data is mathematically older than 2 minutes, ABORT immediately!
    if (isDataStale) return; 

    const t = currentPondData.thresholds || {};
    const ph = Number(latestReading.ph);
    const doVal = Number(latestReading.do);
    const temp = Number(latestReading.temp);

    // CRITICAL ALERTS
    if (_isFiniteNumber(ph) && t.phMin != null && t.phMax != null) {
      if (ph < t.phMin || ph > t.phMax) {
        await _createAlert({
          pondId: currentPondId, type: "critical", parameter: "ph",
          message: `pH level is outside the safe range (${ph}). Immediate correction recommended.`,
          value: ph, threshold: { min: t.phMin, max: t.phMax },
          recommendation: "Check water quality; consider partial water exchange and pH stabilizer if needed."
        });
      }
    }

    if (_isFiniteNumber(doVal) && t.doMin != null && t.doMax != null) {
      if (doVal < t.doMin || doVal > t.doMax) {
        await _createAlert({
          pondId: currentPondId, type: "critical", parameter: "do",
          message: `Dissolved Oxygen is out of safe range (${doVal} mg/L). Immediate aeration recommended.`,
          value: doVal, threshold: { min: t.doMin, max: t.doMax },
          recommendation: "Activate aerators immediately and monitor until DO stabilizes."
        });
      }
    }

    if (_isFiniteNumber(temp) && t.tempMin != null && t.tempMax != null) {
      if (temp < t.tempMin || temp > t.tempMax) {
        await _createAlert({
          pondId: currentPondId, type: "critical", parameter: "temp",
          message: `Water temperature is out of safe range (${temp}°C). Take corrective action.`,
          value: temp, threshold: { min: t.tempMin, max: t.tempMax },
          recommendation: "Reduce feeding; increase aeration; consider shading or partial water exchange."
        });
      }
    }

    // WARNING ALERTS 
    const last3 = _lastNAsc(3);
    if (last3.length === 3) {
      const d0 = Number(last3[0].do), d1 = Number(last3[1].do), d2 = Number(last3[2].do);
      const t0 = Number(last3[0].temp), t1 = Number(last3[1].temp), t2 = Number(last3[2].temp);

      if (_isFiniteNumber(d0) && _isFiniteNumber(d1) && _isFiniteNumber(d2) && t.doMin != null) {
        const decreasing = d0 > d1 && d1 > d2;
        const range = (t.doMax != null && _isFiniteNumber(t.doMax)) ? (Number(t.doMax) - Number(t.doMin)) : 0;
        const buffer = Math.max(0.3, range * 0.10);
        if (decreasing && d2 >= Number(t.doMin) && d2 <= (Number(t.doMin) + buffer)) {
          await _createAlert({
            pondId: currentPondId, type: "warning", parameter: "do",
            message: `Dissolved Oxygen is decreasing and approaching the critical threshold (${d2} mg/L).`,
            value: d2, threshold: { min: t.doMin, max: t.doMax ?? null },
            recommendation: "Prepare to activate aerators; monitor closely."
          });
        }
      }

      if (_isFiniteNumber(t0) && _isFiniteNumber(t1) && _isFiniteNumber(t2) && t.tempMax != null) {
        const increasing = t0 < t1 && t1 < t2;
        const minRef = (t.tempMin != null && _isFiniteNumber(t.tempMin)) ? Number(t.tempMin) : (Number(t.tempMax) - 5);
        const range = Math.max(0.01, Number(t.tempMax) - minRef);
        const buffer = Math.max(0.5, range * 0.10);
        if (increasing && t2 <= Number(t.tempMax) && t2 >= (Number(t.tempMax) - buffer)) {
          await _createAlert({
            pondId: currentPondId, type: "warning", parameter: "temp",
            message: `Water temperature is rising and nearing the maximum safe limit (${t2}°C).`,
            value: t2, threshold: { min: t.tempMin ?? null, max: t.tempMax },
            recommendation: "Increase aeration and consider shading or partial water exchange."
          });
        }
      }
    }
  }

  // Toast & Formatting
  const toastEl = document.getElementById("toast");
  const toastTitleEl = document.getElementById("toastTitle");
  const toastMsgEl = document.getElementById("toastMsg");
  const toastClose = document.getElementById("toastClose");

  function showToast(title, msg) {
    if (!toastEl) return;
    toastTitleEl.textContent = title;
    toastMsgEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3500);
  }
  if (toastClose) toastClose.addEventListener("click", () => toastEl.classList.remove("show"));

  function formatTime(ts) {
    try {
      const date = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date();
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return "--"; }
  }

  function setStatusPill(el, status) {
    if (!el) return;
    el.className = "px-2 py-1 text-xs rounded font-semibold"; 
    if (status === "Normal") el.classList.add("status-normal");
    else if (status === "Warning") el.classList.add("status-warning");
    else el.classList.add("status-critical");
    el.textContent = status;
  }

  function assess(value, min, max) {
    const v = Number(value), a = Number(min), b = Number(max);
    if (!Number.isFinite(v) || !Number.isFinite(a) || !Number.isFinite(b) || a >= b) return "Normal";
    if (v >= a && v <= b) return "Normal";
    const range = Math.max(0.0001, b - a);
    const delta = v < a ? a - v : v - b;
    return delta <= range * 0.10 ? "Warning" : "Critical";
  }

  // DOM refs
  const pondSelect = document.getElementById("pondSelect");
  const phValueEl = document.getElementById("phValue");
  const doValueEl = document.getElementById("doValue");
  const tempValueEl = document.getElementById("tempValue");
  const phTimeEl = document.getElementById("phTime");
  const doTimeEl = document.getElementById("doTime");
  const tempTimeEl = document.getElementById("tempTime");
  const phStatusEl = document.getElementById("phStatus");
  const doStatusEl = document.getElementById("doStatus");
  const tempStatusEl = document.getElementById("tempStatus");
  const phThresholdTextEl = document.getElementById("phThresholdText");
  const doThresholdTextEl = document.getElementById("doThresholdText");
  const tempThresholdTextEl = document.getElementById("tempThresholdText");

  const sensorBadge = document.getElementById("sensorBadge");
  const pumpBadge = document.getElementById("pumpBadge");

  const registerPondBtn = document.getElementById("registerPondBtn");
  const registerModal = document.getElementById("registerModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const pondForm = document.getElementById("pondForm");
  const registerSubmitBtn = document.getElementById("registerSubmitBtn");

  const metricSelect = document.getElementById("metricSelect");
  const rangeSelect = document.getElementById("rangeSelect");
  const chartHint = document.getElementById("chartHint");
  const chartCanvas = document.getElementById("trendChart");
  const metricRangeLegend = document.getElementById("metricRangeLegend");

  function _fmtRange(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return String(n ?? "--");
    return String(parseFloat(x.toFixed(2)));
  }

  function updateMetricRangeLegendLocal(metric, thresholds) {
    if (!metricRangeLegend) return;
    if (!thresholds) { metricRangeLegend.textContent = "No thresholds defined."; return; }

    let min, max, unit = "";
    if (metric === "ph") { min = thresholds.phMin; max = thresholds.phMax; }
    else if (metric === "do") { min = thresholds.doMin; max = thresholds.doMax; unit = " mg/L"; }
    else if (metric === "temp") { min = thresholds.tempMin; max = thresholds.tempMax; unit = " °C"; }
    else { metricRangeLegend.textContent = "Select a metric to view safe and critical ranges."; return; }

    const a = Number(min), b = Number(max);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) {
      metricRangeLegend.textContent = "No thresholds defined."; return;
    }
    const range = b - a;
    const buffer = Math.max(range * 0.10, 0.01); 
    const nearLowMax = a + buffer, nearHighMin = b - buffer;

    metricRangeLegend.innerHTML = `
      <div class="leading-5">
        <span class="font-semibold text-green-700">Normal:</span> ${_fmtRange(a)} – ${_fmtRange(b)}${unit}
        <span class="text-gray-300 px-2">|</span>
        <span class="font-semibold text-yellow-700">Near-critical:</span> ${_fmtRange(a)} – ${_fmtRange(nearLowMax)}${unit} &nbsp;|&nbsp; ${_fmtRange(nearHighMin)} – ${_fmtRange(b)}${unit}
        <span class="text-gray-300 px-2">|</span>
        <span class="font-semibold text-red-700">Critical:</span> &lt; ${_fmtRange(a)}${unit} or &gt; ${_fmtRange(b)}${unit}
      </div>
    `;
  }

  // Subscriptions & State
  let pondsUnsub = null;
  let selectedReadingUnsub = null;
  let selectedChartUnsub = null;
  let hardwareDeviceUnsub = null;

  let currentPondId = "";
  let currentPondData = null;
  let currentReadingsAsc = [];
  
  let isSensorLinked = false; 
  let isPumpLinked = false;
  let currentLatestReading = null;

  function closeModal() { if (registerModal) registerModal.classList.remove("active"); }
  if (registerPondBtn) registerPondBtn.addEventListener("click", () => registerModal.classList.add("active"));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (registerModal) registerModal.addEventListener("click", (e) => { if (e.target === registerModal) closeModal(); });

  function renderSelectedReading(pond, reading) {
    const thresholds = pond?.thresholds || {};

    phThresholdTextEl.textContent = thresholds.phMin != null && thresholds.phMax != null ? `${thresholds.phMin} - ${thresholds.phMax}` : "--";
    doThresholdTextEl.textContent = thresholds.doMin != null && thresholds.doMax != null ? `${thresholds.doMin} - ${thresholds.doMax} mg/L` : "--";
    tempThresholdTextEl.textContent = thresholds.tempMin != null && thresholds.tempMax != null ? `${thresholds.tempMin} - ${thresholds.tempMax}°C` : "--";

    // 🔴 THE UI FIX: Also apply Absolute Math to the UI so it properly turns OFFLINE
    let isDataStale = false;
    if (reading && reading.recordedAt) {
      let dt = typeof reading.recordedAt.toMillis === 'function' ? reading.recordedAt.toMillis() : new Date(reading.recordedAt).getTime();
      if (Number.isNaN(dt) || Math.abs(Date.now() - dt) > 120000) {
          isDataStale = true;
      }
    } else if (!reading) {
      isDataStale = true;
    }

    if ((!isSensorLinked || isDataStale) && currentPondId) {
      phValueEl.textContent = "OFF";
      doValueEl.textContent = "OFF";
      tempValueEl.textContent = "OFF";

      phTimeEl.textContent = "--";
      doTimeEl.textContent = "--";
      tempTimeEl.textContent = "--";

      const offlineClass = "px-2 py-1 text-xs rounded bg-gray-200 text-gray-500 font-bold";
      phStatusEl.className = offlineClass; phStatusEl.textContent = "OFFLINE";
      doStatusEl.className = offlineClass; doStatusEl.textContent = "OFFLINE";
      tempStatusEl.className = offlineClass; tempStatusEl.textContent = "OFFLINE";
      
      if (isSensorLinked && sensorBadge) {
           sensorBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-2 transition-all";
           sensorBadge.innerHTML = '<i data-lucide="cpu" class="w-4 h-4"></i> Sensor: Offline';
      }
      return;
    }

    const phV = reading?.ph, doV = reading?.do, tV = reading?.temp, ts = reading?.recordedAt;

    phValueEl.textContent = phV ?? "--";
    doValueEl.textContent = doV ?? "--";
    tempValueEl.textContent = tV ?? "--";

    const timeStr = ts ? formatTime(ts) : "--";
    phTimeEl.textContent = timeStr;
    doTimeEl.textContent = timeStr;
    tempTimeEl.textContent = timeStr;

    setStatusPill(phStatusEl, assess(phV, thresholds.phMin, thresholds.phMax));
    setStatusPill(doStatusEl, assess(doV, thresholds.doMin, thresholds.doMax));
    setStatusPill(tempStatusEl, assess(tV, thresholds.tempMin, thresholds.tempMax));
  }

  let trendChart = null;
  function statusColor(status) {
    if (status === "Critical") return "#dc2626";
    if (status === "Warning") return "#d97706";
    return "#15803d";
  }

  function buildChart(labels, values, thresholds, metric) {
    if (!chartCanvas || !window.Chart) return;
    const minMax = metric === "ph" ? { min: thresholds.phMin ?? null, max: thresholds.phMax ?? null } :
      metric === "do" ? { min: thresholds.doMin ?? null, max: thresholds.doMax ?? null } :
      { min: thresholds.tempMin ?? null, max: thresholds.tempMax ?? null };

    if (trendChart) { trendChart.destroy(); trendChart = null; }
    chartCanvas.parentElement.style.height = "320px";

    trendChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: metric, data: values, tension: 0.25, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
          segment: { borderColor: (ctx) => statusColor(assess(values[ctx.p1DataIndex], minMax.min, minMax.max)) }
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: true } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(0,0,0,0.06)" } } }
      }
    });
  }

  function clearSelectedListeners() {
    if (selectedReadingUnsub) { selectedReadingUnsub(); selectedReadingUnsub = null; }
    if (selectedChartUnsub) { selectedChartUnsub(); selectedChartUnsub = null; }
    if (hardwareDeviceUnsub) { hardwareDeviceUnsub(); hardwareDeviceUnsub = null; } 
    currentReadingsAsc = [];
  }

  async function subscribeChartReadings(pondId) {
    if (selectedChartUnsub) selectedChartUnsub();
    const take = Number(rangeSelect?.value || 25);
    selectedChartUnsub = db.collection("fishponds").doc(pondId).collection("readings")
      .orderBy("recordedAt", "desc").limit(take)
      .onSnapshot((snap) => {
        const arr = [];
        snap.forEach(doc => arr.push(doc.data()));
        currentReadingsAsc = arr.reverse();
        const metric = metricSelect?.value || "ph";
        const labels = currentReadingsAsc.map(r => formatTime(r.recordedAt));
        const values = currentReadingsAsc.map(r => Number(r[metric]));
        if (chartHint) chartHint.textContent = currentReadingsAsc.length ? `Showing ${currentReadingsAsc.length} reading(s)` : "No readings found for this pond.";
        buildChart(labels, values, currentPondData?.thresholds || {}, metric);
        updateMetricRangeLegendLocal(metric, currentPondData?.thresholds || {});
      });
  }

  function initMonitoring() {
    if (pondsUnsub) pondsUnsub();
    pondsUnsub = db.collection("fishponds").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        const ponds = [];
        snapshot.forEach((doc) => ponds.push({ id: doc.id, ...doc.data() }));

        pondSelect.innerHTML = "";
        if (ponds.length === 0) {
          pondSelect.disabled = true; pondSelect.innerHTML = '<option value="">No ponds yet — register one.</option>';
          clearSelectedListeners(); currentPondId = ""; currentPondData = null; currentLatestReading = null;
          renderSelectedReading({}, null);
          if (chartHint) chartHint.textContent = "No ponds yet.";
          return;
        }

        pondSelect.disabled = false;
        let firstPondId = null;
        for (const p of ponds) {
          const opt = document.createElement("option");
          opt.value = p.id; opt.textContent = `${p.name || "Untitled Pond"} (${p.fishSpecies || "unknown"})`;
          pondSelect.appendChild(opt);
          if (!firstPondId) firstPondId = p.id;
        }

        if (!currentPondId && firstPondId) {
          pondSelect.value = firstPondId;
          pondSelect.dispatchEvent(new Event("change"));
        }
      });

    pondSelect.addEventListener("change", async () => {
      const pondId = pondSelect.value;
      clearSelectedListeners();

      currentPondId = pondId;
      currentPondData = null;
      currentLatestReading = null;
      
      isSensorLinked = false;
      isPumpLinked = false;
      
      if (sensorBadge) {
        sensorBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-2 transition-all";
        sensorBadge.innerHTML = '<i data-lucide="cpu" class="w-4 h-4"></i> Sensor: Checking...';
      }
      if (pumpBadge) {
        pumpBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-2 transition-all";
        pumpBadge.innerHTML = '<i data-lucide="waves" class="w-4 h-4"></i> Pump: Checking...';
      }

      if (!pondId) {
        renderSelectedReading({}, null);
        if (chartHint) chartHint.textContent = "Select a pond to display its readings.";
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const pondRef = db.collection("fishponds").doc(pondId);
      const pondSnap = await pondRef.get();
      if (!pondSnap.exists) { showToast("Not found", "Selected pond no longer exists."); return; }
      currentPondData = pondSnap.data();

      hardwareDeviceUnsub = db.collection("devices").where("assignedPondId", "==", pondId).onSnapshot((snap) => {
        let hasSensor = false;
        let hasPump = false;

        snap.forEach(doc => {
          const data = doc.data();
          if (data.type === "sensor") hasSensor = true;
          if (data.type === "pump") hasPump = true;
        });

        isSensorLinked = hasSensor;
        isPumpLinked = hasPump;

        if (sensorBadge) {
          if (hasSensor) {
            sensorBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-2 transition-all";
            sensorBadge.innerHTML = '<i data-lucide="cpu" class="w-4 h-4"></i> Sensor: Connected';
          } else {
            sensorBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2 transition-all";
            sensorBadge.innerHTML = '<i data-lucide="cpu" class="w-4 h-4"></i> Sensor: Disconnected';
          }
        }

        if (pumpBadge) {
          if (hasPump) {
            pumpBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2 transition-all";
            pumpBadge.innerHTML = '<i data-lucide="waves" class="w-4 h-4"></i> Pump: Connected';
          } else {
            pumpBadge.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-2 transition-all";
            pumpBadge.innerHTML = '<i data-lucide="waves" class="w-4 h-4"></i> Pump: Disconnected';
          }
        }
        
        if (window.lucide) window.lucide.createIcons();
        renderSelectedReading(currentPondData, currentLatestReading);
      });

      selectedReadingUnsub = pondRef.collection("live").doc("current")
        .onSnapshot((docSnap) => {
          if (!docSnap.exists) {
            currentLatestReading = null;
            renderSelectedReading(currentPondData, null);
            return;
          }
          const latestData = docSnap.data();
          currentLatestReading = latestData;
          renderSelectedReading(currentPondData, latestData);
          
          maybeTriggerAlerts(latestData).catch(console.error);
        });

      updateMetricRangeLegendLocal(metricSelect?.value || "ph", currentPondData?.thresholds || {});
      await subscribeChartReadings(pondId);
    });

    if (metricSelect) {
      metricSelect.addEventListener("change", () => {
        if (!currentPondData) return;
        const metric = metricSelect.value || "ph";
        const labels = currentReadingsAsc.map(r => formatTime(r.recordedAt));
        const values = currentReadingsAsc.map(r => Number(r[metric]));
        buildChart(labels, values, currentPondData.thresholds || {}, metric);
        updateMetricRangeLegendLocal(metric, currentPondData.thresholds || {});
      });
    }

    if (rangeSelect) {
      rangeSelect.addEventListener("change", async () => {
        if (currentPondId) await subscribeChartReadings(currentPondId);
      });
    }
  }

  // Register Pond
  if (pondForm)
    pondForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      registerSubmitBtn.disabled = true; registerSubmitBtn.textContent = "Saving...";

      try {
        const name = document.getElementById("pondName").value.trim();
        const fishSpecies = document.getElementById("fishSpecies").value;
        const pondLength = Number(document.getElementById("pondLength").value);
        const pondWidth  = Number(document.getElementById("pondWidth").value);
        const pondDepth  = Number(document.getElementById("pondDepth").value);
        const thresholds = {
          phMin: Number(document.getElementById("phMin").value), phMax: Number(document.getElementById("phMax").value),
          doMin: Number(document.getElementById("doMin").value), doMax: Number(document.getElementById("doMax").value),
          tempMin: Number(document.getElementById("tempMin").value), tempMax: Number(document.getElementById("tempMax").value),
        };

        if (!name) throw new Error("Pond name is required.");
        if (!(thresholds.phMin < thresholds.phMax)) throw new Error("pH min must be less than pH max.");

        const pondRef = await db.collection("fishponds").add({
          name, fishSpecies, pondLength, pondWidth, pondDepth, status: "active",
          thresholds, defaultThresholds: { ...thresholds },
          createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        pondForm.reset(); closeModal(); showToast("Registered", "Fishpond saved.");
      } catch (err) { alert(err.message || "Failed to register pond."); } 
      finally { registerSubmitBtn.disabled = false; registerSubmitBtn.textContent = "Register Pond"; }
    });

  // Auth guard
  auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = "index.php?page=login"; return; }
    initMonitoring();
  });
})();