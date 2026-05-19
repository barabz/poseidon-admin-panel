(function () {
  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) return;

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const pondFilter = document.getElementById("pondFilter");
  const severityFilter = document.getElementById("severityFilter");
  const readFilter = document.getElementById("readFilter");
  const notifList = document.getElementById("notifList");
  const notifHint = document.getElementById("notifHint");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  let ponds = [];
  let alertsByPond = {}; // pondId -> array alerts
  let unsubAlerts = [];
  let unsubPonds = null;

  function iconFor(type, param) {
    if (type === "critical") return "alert-octagon";
    if (type === "warning") return "alert-triangle";
    return "info";
  }

  function badgeClass(type) {
    if (type === "critical") return "bg-red-100 text-red-700 border border-red-200";
    if (type === "warning") return "bg-amber-100 text-amber-700 border border-amber-200";
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }

  function formatDate(ts) {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  }

  function getPondName(pondId) {
    const p = ponds.find(x => x.id === pondId);
    return p?.name || "Unknown Pond";
  }

  function mergeAlerts() {
    let all = [];
    Object.keys(alertsByPond).forEach(pid => {
      all = all.concat(alertsByPond[pid] || []);
    });

    // Sort newest first
    all.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    return all;
  }

  function applyFilters(alerts) {
    const pondVal = pondFilter.value;
    const sevVal = severityFilter.value;
    const readVal = readFilter.value;

    return alerts.filter(a => {
      if (pondVal !== "all" && a.pondId !== pondVal) return false;
      if (sevVal !== "all" && a.type !== sevVal) return false;
      if (readVal === "unread" && a.read) return false;
      if (readVal === "read" && !a.read) return false;
      return true;
    });
  }

  async function setAlertRead(alert, read) {
    await db.collection("fishponds").doc(alert.pondId).collection("alerts").doc(alert.id).update({
      read: !!read
    });
  }

  async function markAllRead() {
    const all = applyFilters(mergeAlerts()).filter(a => !a.read);
    if (!all.length) return;

    const ok = confirm(`Mark ${all.length} alert(s) as read?`);
    if (!ok) return;

    // Batch in chunks
    let idx = 0;
    while (idx < all.length) {
      const chunk = all.slice(idx, idx + 400);
      const batch = db.batch();

      chunk.forEach(a => {
        const ref = db.collection("fishponds").doc(a.pondId).collection("alerts").doc(a.id);
        batch.update(ref, { read: true });
      });

      await batch.commit();
      idx += chunk.length;
    }
  }

  function render() {
    const filtered = applyFilters(mergeAlerts());

    notifList.innerHTML = "";
    notifHint.textContent = filtered.length
      ? `Showing ${filtered.length} alert(s).`
      : "No alerts match your filters.";

    filtered.forEach(a => {
      const pondName = getPondName(a.pondId);
      const icon = iconFor(a.type, a.parameter);
      const badge = badgeClass(a.type);

      const wrapper = document.createElement("div");
      wrapper.className = "card p-4 flex items-start justify-between gap-3";

      wrapper.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="mt-1">
            <i data-lucide="${icon}" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-1 text-xs rounded ${badge}">
                ${a.type.toUpperCase()}
              </span>
              <span class="text-xs text-muted">${pondName}</span>
              <span class="text-xs text-muted">•</span>
              <span class="text-xs text-muted">${(a.parameter || "").toUpperCase()}</span>
              ${a.read ? `<span class="text-xs text-muted">• Read</span>` : `<span class="text-xs font-semibold text-gray-800">• Unread</span>`}
            </div>

            <div class="mt-1 text-sm font-semibold">${a.message || "—"}</div>

            <div class="mt-2 text-xs text-muted">
              Value: <b>${a.value ?? "—"}</b>
              ${a.threshold ? ` • Threshold: <b>${a.threshold.min} - ${a.threshold.max}</b>` : ""}
              • ${formatDate(a.createdAt)}
            </div>

            ${a.recommendation ? `
              <div class="mt-2 text-xs">
                <span class="px-2 py-1 rounded bg-gray-100 border border-gray-200">
                  Recommended Action: ${a.recommendation}
                </span>
              </div>` : ""}
          </div>
        </div>

        <div>
          <button class="btn btn-primary text-xs px-3 py-2">
            ${a.read ? "Mark Unread" : "Mark Read"}
          </button>
        </div>
      `;

      const btn = wrapper.querySelector("button");
      if (btn) {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            await setAlertRead(a, !a.read);
          } catch (e) {
            console.error(e);
            btn.disabled = false;
          }
        });
      }

      notifList.appendChild(wrapper);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function clearAlertListeners() {
    unsubAlerts.forEach(fn => fn && fn());
    unsubAlerts = [];
    alertsByPond = {};
  }

  function listenAlertsForAllPonds() {
    clearAlertListeners();

    ponds.forEach(p => {
      const unsub = db.collection("fishponds").doc(p.id).collection("alerts")
        .orderBy("createdAt", "desc")
        .limit(80)
        .onSnapshot((snap) => {
          const arr = [];
          snap.forEach(doc => arr.push({ id: doc.id, pondId: p.id, ...doc.data() }));
          alertsByPond[p.id] = arr;
          render();
        });

      unsubAlerts.push(unsub);
    });
  }

  // Load ponds, then attach alert listeners
  unsubPonds = db.collection("fishponds")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      ponds = [];
      snap.forEach(doc => ponds.push({ id: doc.id, ...doc.data() }));

      // Build pond dropdown
      const current = pondFilter.value;
      pondFilter.innerHTML = `<option value="all">All Ponds</option>`;
      ponds.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name || "Untitled Pond";
        pondFilter.appendChild(opt);
      });
      pondFilter.value = current && (current === "all" || ponds.some(p => p.id === current)) ? current : "all";

      listenAlertsForAllPonds();
    });

  pondFilter.addEventListener("change", render);
  severityFilter.addEventListener("change", render);
  readFilter.addEventListener("change", render);
  if (markAllReadBtn) markAllReadBtn.addEventListener("click", markAllRead);
})();
