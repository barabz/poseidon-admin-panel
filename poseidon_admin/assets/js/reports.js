/* assets/js/reports.js */

(function () {
  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig || !window.firebase) {
    console.error("Firebase config missing. Check partials/firebase.php");
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (_) {}

  const db = firebase.firestore();

  // --- Configuration from PHP ---
  const config = window.__REPORT_CONFIG__ || {};
  const intervalMode = config.interval || "daily"; // daily, monthly, yearly, custom
  const initialPondFromPhp = (config.pond || "").trim();
  
  // DOM Elements
  const pondSelect = document.getElementById("pondSelect");
  const pondMeta = document.getElementById("pondMeta");
  
  const inputStartDate = document.getElementById("inputStartDate");
  const inputEndDate = document.getElementById("inputEndDate");
  const btnApplyFilter = document.getElementById("btnApplyFilter");

  const btnDaily = document.getElementById("btnDaily");
  const btnMonthly = document.getElementById("btnMonthly");
  const btnYearly = document.getElementById("btnYearly");

  const kpiAlerts = document.getElementById("kpiAlerts");
  const kpiAvgPh = document.getElementById("kpiAvgPh");
  const kpiAvgDo = document.getElementById("kpiAvgDo");
  const kpiAvgTemp = document.getElementById("kpiAvgTemp");

  const trendHint = document.getElementById("trendHint");
  const readingsTbody = document.getElementById("readingsTbody");
  const exportCsvBtn = document.getElementById("exportCsvBtn");

  // Chart instances
  let trendChart = null;
  let donutChart = null;

  // State
  let currentPondId = "";
  let currentPondData = null;
  let pondThresholds = null;
  let readingsUnsub = null;
  let pondsUnsub = null;
  
  // CSV Data buffer
  let currentExportData = [];

  // LocalStorage Key for Persistence
  const POND_STORAGE_KEY = "poseidon_reports_selected_pond";

  // --- 1. Date Range Logic ---

  /**
   * Calculates the exact Start and End Date objects based on the mode.
   * - Daily: Today 00:00 to 23:59
   * - Monthly: 1st of this month to end of this month
   * - Yearly: Jan 1st to Dec 31st
   * - Custom: Uses the HTML inputs
   */
  function getQueryRange() {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (intervalMode === 'custom') {
      // Parse inputs (YYYY-MM-DD)
      const sVal = inputStartDate.value;
      const eVal = inputEndDate.value;
      
      start = sVal ? new Date(sVal + "T00:00:00") : now;
      end = eVal ? new Date(eVal + "T23:59:59.999") : now;
    } 
    else if (intervalMode === 'monthly') {
      start.setDate(1);
      start.setHours(0,0,0,0);
      
      end.setMonth(end.getMonth() + 1, 0); // Last day of month
      end.setHours(23,59,59,999);
    } 
    else if (intervalMode === 'yearly') {
      start.setMonth(0, 1);
      start.setHours(0,0,0,0);
      
      end.setFullYear(end.getFullYear(), 11, 31);
      end.setHours(23,59,59,999);
    } 
    else { 
      // Default: Daily
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    }

    return { start, end };
  }

  /**
   * Determine chart grouping bucket based on duration
   */
  function determineBucket(start, end) {
    const diffMs = end - start;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) return "hour";   // Hourly if < 48 hours
    if (diffDays <= 60) return "day";   // Daily if < 2 months
    if (diffDays <= 365) return "week"; // Weekly if < 1 year
    return "month";                     // Monthly otherwise
  }

  function bucketKey(dateObj, bucketType) {
    if (bucketType === "hour") return `${dateObj.getHours().toString().padStart(2,'0')}:00`;
    if (bucketType === "day") return dateObj.toLocaleDateString(undefined, { month:'short', day:'numeric' });
    if (bucketType === "week") {
      // Simple week number approximation
      const onejan = new Date(dateObj.getFullYear(), 0, 1);
      const week = Math.ceil((((dateObj - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return `W${week}`;
    }
    return dateObj.toLocaleDateString(undefined, { month:'short', year:'2-digit' });
  }

  // --- 2. Charting & Helpers ---

  function fmt(n, d = 2) {
    return (n === null || n === undefined || Number.isNaN(n)) ? "—" : Number(n).toFixed(d);
  }

  function inRange(v, min, max) {
    if (v == null) return false;
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
    return true;
  }

  function stats(arr) {
    const valid = arr.filter(v => typeof v === 'number');
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  function setEmpty(msg) {
    if (trendHint) trendHint.textContent = msg;
    if (readingsTbody) readingsTbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-muted">${msg}</td></tr>`;
    if (kpiAlerts) kpiAlerts.textContent = "0";
    ["kpiAvgPh", "kpiAvgDo", "kpiAvgTemp"].forEach(id => document.getElementById(id).textContent = "—");
    
    // Clear charts if they exist
    if (trendChart) { trendChart.data.labels=[]; trendChart.data.datasets.forEach(d => d.data=[]); trendChart.update(); }
    if (donutChart) { donutChart.data.datasets[0].data=[0,0,0]; donutChart.update(); }
  }

  function renderCharts(labels, phData, doData, tempData, alerts) {
    // 1. Trend Line Chart
    const ctxT = document.getElementById("trendChart");
    if (ctxT) {
      if (trendChart) trendChart.destroy();
      trendChart = new Chart(ctxT, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'pH', data: phData, borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.3 },
            { label: 'DO (mg/L)', data: doData, borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.3 },
            { label: 'Temp (°C)', data: tempData, borderColor: '#f59e0b', backgroundColor: '#f59e0b', tension: 0.3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: { y: { beginAtZero: false } }
        }
      });
    }

    // 2. Donut Chart
    const ctxD = document.getElementById("alertDonut");
    if (ctxD) {
      if (donutChart) donutChart.destroy();
      const hasData = alerts.temp > 0 || alerts.ph > 0 || alerts.do > 0;
      donutChart = new Chart(ctxD, {
        type: 'doughnut',
        data: {
          labels: ['Temperature', 'pH', 'DO'],
          datasets: [{
            data: hasData ? [alerts.temp, alerts.ph, alerts.do] : [1,0,0], // fallback grey if empty?
            backgroundColor: hasData 
              ? ['#f59e0b', '#3b82f6', '#10b981'] 
              : ['#e5e7eb', '#e5e7eb', '#e5e7eb']
          }]
        },
        options: {
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  // --- 3. Data Processing ---

  function processReadings(readings) {
    if (!readings.length) {
      setEmpty("No readings found in this range.");
      return;
    }

    const { start, end } = getQueryRange();
    const bucket = determineBucket(start, end);

    // Thresholds
    const th = pondThresholds || {}; 
    const range = (v, min, max) => inRange(v, min, max);

    // Aggregates
    let phSum=0, phCount=0, phViol=0;
    let doSum=0, doCount=0, doViol=0;
    let tempSum=0, tempCount=0, tempViol=0;

    // Trend grouping
    const groupMap = new Map();

    readings.forEach(r => {
      // Global Stats
      if (r.ph != null) { phSum+=r.ph; phCount++; if(!range(r.ph, th.phMin, th.phMax)) phViol++; }
      if (r.do != null) { doSum+=r.do; doCount++; if(!range(r.do, th.doMin, th.doMax)) doViol++; }
      if (r.temp != null) { tempSum+=r.temp; tempCount++; if(!range(r.temp, th.tempMin, th.tempMax)) tempViol++; }

      // Trend Bucketing
      const k = bucketKey(r.recordedAt, bucket);
      if (!groupMap.has(k)) groupMap.set(k, { ph:[], do:[], temp:[] });
      const g = groupMap.get(k);
      if (r.ph != null) g.ph.push(r.ph);
      if (r.do != null) g.do.push(r.do);
      if (r.temp != null) g.temp.push(r.temp);
    });

    // Update KPIs
    kpiAlerts.textContent = (phViol + doViol + tempViol).toLocaleString();
    kpiAvgPh.textContent = phCount ? fmt(phSum/phCount) : "—";
    kpiAvgDo.textContent = doCount ? fmt(doSum/doCount) : "—";
    kpiAvgTemp.textContent = tempCount ? fmt(tempSum/tempCount, 1) : "—";

    // Prepare Chart Data
    // Sort keys based on time (bucketKey logic might result in non-chrono string keys, so we rely on map order if inserted sequentially, 
    // but Firestore returns desc. We need to reverse for chart left-to-right)
    
    // To sort buckets correctly, we might need the raw date. 
    // Simplified: Reverse the readings first (asc), then bucket.
    const ascReadings = [...readings].reverse();
    const chartMap = new Map();
    ascReadings.forEach(r => {
      const k = bucketKey(r.recordedAt, bucket);
      if (!chartMap.has(k)) chartMap.set(k, { ph:[], do:[], temp:[] });
      const g = chartMap.get(k);
      if(r.ph!=null) g.ph.push(r.ph);
      if(r.do!=null) g.do.push(r.do);
      if(r.temp!=null) g.temp.push(r.temp);
    });

    const labels = Array.from(chartMap.keys());
    const phData = labels.map(k => stats(chartMap.get(k).ph));
    const doData = labels.map(k => stats(chartMap.get(k).do));
    const tempData = labels.map(k => stats(chartMap.get(k).temp));

    renderCharts(labels, phData, doData, tempData, { ph: phViol, do: doViol, temp: tempViol });
    if (trendHint) trendHint.textContent = `Showing data by ${bucket} (${readings.length} records)`;

    // Render Table (Top 100 max for performance)
    readingsTbody.innerHTML = readings.slice(0, 100).map(r => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="py-2 pr-2 border-b border-gray-100">${r.recordedAt.toLocaleString()}</td>
        <td class="py-2 pr-2 border-b border-gray-100">${fmt(r.ph)}</td>
        <td class="py-2 pr-2 border-b border-gray-100">${fmt(r.do)}</td>
        <td class="py-2 pr-2 border-b border-gray-100">${fmt(r.temp)}</td>
        <td class="py-2 pr-2 border-b border-gray-100 text-xs text-muted">${r.source||'—'}</td>
      </tr>
    `).join("");
  }

  // --- 4. Firestore Listener ---

  function listenReadings(pondId) {
    if (readingsUnsub) readingsUnsub();
    
    currentPondId = pondId;
    updateUrlPond(pondId);
    setEmpty("Loading...");

    // 1. Get Metadata (Thresholds)
    db.collection("fishponds").doc(pondId).get().then(doc => {
      if(!doc.exists) return;
      const data = doc.data();
      currentPondData = data;
      pondThresholds = data.thresholds || data.defaultThresholds;
      if (pondMeta) pondMeta.textContent = `${data.name || pondId} ${data.fishSpecies ? '· '+data.fishSpecies : ''}`;
    });

    // 2. Query Readings based on Date Range
    const { start, end } = getQueryRange();
    
    // Firestore Query: Range on recordedAt
    const query = db.collection("fishponds").doc(pondId).collection("readings")
      .where("recordedAt", ">=", start)
      .where("recordedAt", "<=", end)
      .orderBy("recordedAt", "desc");
      // Note: No limit(2000) here to ensure accurate historical reports, 
      // but be mindful if you have millions of docs. 
      // For a real prod app, maybe add .limit(5000) safety net.

    readingsUnsub = query.onSnapshot(snap => {
      const list = [];
      snap.forEach(d => {
        const v = d.data();
        list.push({
          recordedAt: v.recordedAt ? v.recordedAt.toDate() : new Date(),
          ph: v.ph,
          do: v.do,
          temp: v.temp,
          source: v.source
        });
      });
      
      currentExportData = list; // Save for CSV
      processReadings(list);
    }, err => {
      console.error(err);
      setEmpty("Error loading data. Ensure Firestore indexes are built.");
    });
  }

  // --- 5. Selection & Navigation Logic ---

  function updateUrlPond(pondId) {
    const url = new URL(window.location.href);
    if(pondId) url.searchParams.set("pond", pondId);
    window.history.replaceState({}, "", url.toString());
    
    // Sync other tabs hrefs
    [btnDaily, btnMonthly, btnYearly].forEach(btn => {
      if(!btn) return;
      const u = new URL(btn.href);
      if(pondId) u.searchParams.set("pond", pondId);
      btn.href = u.toString();
    });
    
    localStorage.setItem(POND_STORAGE_KEY, pondId);
  }

  function init() {
    // 1. Apply Filter Button Logic
    if (btnApplyFilter) {
      btnApplyFilter.addEventListener("click", () => {
        const pond = pondSelect.value;
        const s = inputStartDate.value;
        const e = inputEndDate.value;
        if (!s || !e) { alert("Please select start and end dates."); return; }
        
        // Navigate to Custom View
        const u = new URL(window.location.href);
        u.searchParams.set("page", "fishpond-reports");
        u.searchParams.set("interval", "custom");
        u.searchParams.set("start_date", s);
        u.searchParams.set("end_date", e);
        if (pond) u.searchParams.set("pond", pond);
        window.location.href = u.toString();
      });
    }

    // 2. Load Ponds
    pondsUnsub = db.collection("fishponds").orderBy("createdAt", "desc").onSnapshot(snap => {
      pondSelect.innerHTML = "";
      const ponds = [];
      snap.forEach(d => ponds.push({id: d.id, ...d.data()}));

      if (!ponds.length) {
        pondSelect.innerHTML = "<option>No ponds found</option>";
        return;
      }

      ponds.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name || p.id;
        pondSelect.appendChild(opt);
      });

      pondSelect.disabled = false;

      // Determine initial selection
      let target = initialPondFromPhp;
      if (!target) target = localStorage.getItem(POND_STORAGE_KEY);
      if (!target || !ponds.find(p => p.id === target)) target = ponds[0].id;
      
      pondSelect.value = target;
      listenReadings(target);

      // Bind change event
      pondSelect.addEventListener("change", (e) => listenReadings(e.target.value));
    });

    // 3. Export CSV
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => {
        if (!currentExportData.length) return;
        const csvContent = [
          ["Date", "pH", "DO", "Temp", "Source"],
          ...currentExportData.map(r => [
            r.recordedAt.toISOString(), 
            r.ph, r.do, r.temp, r.source
          ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `report_${currentPondId}_${intervalMode}.csv`;
        link.click();
      });
    }
  }

  init();
})();