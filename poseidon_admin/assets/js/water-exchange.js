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

  let serverState = null;
  let draftState = null;
  let isDirty = false;
  let isSaving = false;
  let pendingSaveToken = null;
  let currentDeviceId = null;
  let deviceUnsub = null;
  let pondUnsub = null;
  let devicesUnsub = null;
  let pondsUnsub = null;
  let companionSensorUnsub = null; 
  let isCompanionSensorLinked = false; 

  const LS_KEY = "poseidon_water_exchange_device";
  const el = (id) => document.getElementById(id);

  function _setModalVisible(visible) {
    const modal = el("registerDeviceModal");
    if (!modal) return;
    if (visible) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    } else {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function _setRegisterError(msg) {
    const e = el("registerDeviceError");
    if (!e) return;
    if (!msg) {
      e.classList.add("hidden");
      e.textContent = "";
      return;
    }
    e.classList.remove("hidden");
    e.textContent = msg;
  }

  function _syncModalPondsFromLinker() {
    const modalSel = el("newDevicePond");
    const linker = el("pondLinker");
    if (!modalSel || !linker) return;
    const current = modalSel.value || "";
    modalSel.innerHTML = linker.innerHTML; 
    const exists = Array.from(modalSel.options).some(o => o.value === current);
    modalSel.value = exists ? current : "";
  }

  function openRegisterModal() {
    _setRegisterError(null);
    const nameInput = el("newDeviceName");
    if (nameInput) nameInput.value = "";
    _syncModalPondsFromLinker();
    _setModalVisible(true);
  }

  function closeRegisterModal() {
    _setRegisterError(null);
    _setModalVisible(false);
  }

  async function registerWaterExchangeDevice() {
    const name = (el("newDeviceName")?.value || "").trim();
    const pondId = (el("newDevicePond")?.value || "");
    if (!name) {
      _setRegisterError("Device name is required.");
      return;
    }
    const btn = el("confirmRegisterDevice");
    if (btn) btn.disabled = true;
    try {
      const payload = {
        type: "pump", 
        name,
        assignedPondId: pondId || "", 
        mode: "manual",
        status: "off",
        drainStatus: "off",
        fillStatus: "off",  
        autoBasis: "threshold",
        intervalValue: null,
        intervalUnit: "hours",
        durationValue: null,
        durationUnit: "mins",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      };
      
      const ref = await db.collection("devices").add(payload);
      const selector = el("deviceSelector");
      if (selector) selector.value = ref.id;
      if (typeof window.switchDevice === "function") {
        window.switchDevice(ref.id);
      }
      closeRegisterModal();
    } catch (e) {
      console.error("Register Water Exchange device failed:", e);
      _setRegisterError(e?.message || "Failed to register device.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function initRegisterDeviceUI() {
    const openBtn = el("registerDeviceBtn");
    const closeBtn = el("closeRegisterDeviceModal");
    const cancelBtn = el("cancelRegisterDevice");
    const confirmBtn = el("confirmRegisterDevice");
    const modal = el("registerDeviceModal");
    if (openBtn) openBtn.addEventListener("click", openRegisterModal);
    if (closeBtn) closeBtn.addEventListener("click", closeRegisterModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeRegisterModal);
    if (confirmBtn) confirmBtn.addEventListener("click", registerWaterExchangeDevice);
    if (modal) {
      modal.addEventListener("click", (ev) => {
        if (ev.target === modal) closeRegisterModal();
      });
    }
  }

  function setDisconnected() {
    const statusBadge = el("connection-status");
    if (statusBadge) {
      statusBadge.innerText = "Disconnected";
      statusBadge.className = "px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200";
    }
  }

  function setConnected() {
    const statusBadge = el("connection-status");
    if (statusBadge) {
      statusBadge.innerText = "Connected";
      statusBadge.className = "px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200";
    }
  }

  function ensureSaveControls() {
    let badge = el("saveStateBadge");
    let btn = el("saveBtn");
    if (badge && btn) return;
    const anchor = el("connection-status");
    if (!anchor || !anchor.parentElement) return;
    const wrap = anchor.parentElement;
    if (!badge) {
      badge = document.createElement("span");
      badge.id = "saveStateBadge";
      badge.className = "hidden px-3 py-1.5 rounded-full text-xs font-bold border";
      wrap.insertBefore(badge, anchor);
    }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "saveBtn";
      btn.type = "button";
      btn.className = "px-5 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
      btn.disabled = true;
      btn.innerText = "Save";
      btn.onclick = () => window.saveChanges && window.saveChanges();
      wrap.insertBefore(btn, anchor);
    }
  }

  function setSaveBadge(state, text) {
    ensureSaveControls();
    initRegisterDeviceUI();
    const badge = el("saveStateBadge");
    if (!badge) return;
    if (!state) {
      badge.classList.add("hidden");
      return;
    }
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
    ensureSaveControls();
    initRegisterDeviceUI();
    const btn = el("saveBtn");
    if (btn) btn.disabled = !isDirty || isSaving || !currentDeviceId;
    if (!currentDeviceId) {
      setSaveBadge(null);
      return;
    }
    if (isSaving) setSaveBadge("saving", pendingSaveToken ? "Verifying..." : "Saving...");
    else if (isDirty) setSaveBadge("dirty", "Unsaved changes");
  }

  function setSaving(saving) {
    isSaving = saving;
    setDirty(isDirty);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function normalizeDevice(data) {
    return {
      type: data.type || null,
      name: data.name || null,
      mode: (data.mode || "manual").toLowerCase(),
      status: (data.status || "off").toLowerCase(),
      drainStatus: (data.drainStatus || "off").toLowerCase(),
      fillStatus: (data.fillStatus || "off").toLowerCase(),
      pondId: data.assignedPondId || "", 
      autoBasis: (data.autoBasis || "threshold").toLowerCase(),
      
      intervalValue: Number.isFinite(Number(data.intervalValue)) ? Number(data.intervalValue) : null,
      intervalUnit: data.intervalUnit || "hours",
      durationValue: Number.isFinite(Number(data.durationValue)) ? Number(data.durationValue) : null,
      durationUnit: data.durationUnit || "mins",

      lastUpdated: data.lastUpdated || null,
      clientSaveToken: data.clientSaveToken || null,
    };
  }

  function payloadFromDraft(d, token) {
    const basis = (d.autoBasis || "threshold").toLowerCase();
    return {
      mode: (d.mode || "manual").toLowerCase(),
      status: (d.status || "off").toLowerCase(),
      drainStatus: (d.drainStatus || "off").toLowerCase(),
      fillStatus: (d.fillStatus || "off").toLowerCase(),
      assignedPondId: d.pondId || "", 
      autoBasis: basis,
      
      intervalValue: d.intervalValue || null,
      intervalUnit: d.intervalUnit || "hours",
      durationValue: d.durationValue || null,
      durationUnit: d.durationUnit || "mins",

      clientSaveToken: token, 
      clientSavedAt: firebase.firestore.FieldValue.serverTimestamp(), 
    };
  }

  function ensureDraft() {
    if (!draftState) {
      if (serverState) {
        draftState = deepClone(serverState);
      } else {
        draftState = {
          mode: "manual",
          status: "off",
          drainStatus: "off",
          fillStatus: "off",
          pondId: "",
          autoBasis: "threshold",
          intervalValue: null,
          intervalUnit: "hours",
          durationValue: null,
          durationUnit: "mins"
        };
      }
    } 
    return true;
  }

  function evaluateSensorWarning() {
    const warning = el("noSensorWarning");
    if (!warning) return;
    
    if (draftState && !isCompanionSensorLinked && draftState.mode === "auto" && draftState.autoBasis === "threshold" && draftState.pondId) {
        warning.style.display = "flex";
    } else {
        warning.style.display = "none";
    }
  }

  function listenToCompanionSensor(pondId) {
    if (companionSensorUnsub) { companionSensorUnsub(); companionSensorUnsub = null; }
    const badge = el("companionSensorBadge");
    
    if (!pondId) {
        isCompanionSensorLinked = false;
        if (badge) {
            badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300";
            badge.innerText = "WAITING FOR POND...";
        }
        evaluateSensorWarning();
        return;
    }

    if (badge) badge.innerText = "CHECKING...";

    companionSensorUnsub = db.collection("devices")
        .where("assignedPondId", "==", pondId)
        .where("type", "==", "sensor")
        .onSnapshot(snap => {
            isCompanionSensorLinked = !snap.empty;
            if (badge) {
                if (isCompanionSensorLinked) {
                    badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200";
                    badge.innerText = "CONNECTED";
                } else {
                    badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200";
                    badge.innerText = "NOT LINKED";
                }
            }
            evaluateSensorWarning();
        });
  }

  function disableUI() {
    currentDeviceId = null;
    if (deviceUnsub) deviceUnsub();
    if (pondUnsub) pondUnsub();
    deviceUnsub = null;
    pondUnsub = null;
    serverState = null;
    draftState = null;
    isDirty = false;
    isSaving = false;
    pendingSaveToken = null;

    const main = el("mainContent");
    if (main) main.classList.add("opacity-50", "pointer-events-none");
    setDisconnected();
    
    const thresh = el("active-threshold-val");
    if (thresh) thresh.innerText = "--";
    const statPower = el("stat-power");
    if (statPower) {
      statPower.innerText = "--";
      statPower.className = "text-3xl font-black transition-colors";
    }
    const statTime = el("stat-time");
    if (statTime) statTime.innerText = "--";
    const powerBtnLabel = el("power-btn-label");
    if (powerBtnLabel) powerBtnLabel.innerText = "OFF";
    setSaveBadge(null);
    ensureSaveControls();
    initRegisterDeviceUI();
    const btn = el("saveBtn");
    if (btn) btn.disabled = true;

    if (companionSensorUnsub) { companionSensorUnsub(); companionSensorUnsub = null; }
    isCompanionSensorLinked = false;
    evaluateSensorWarning();
    const badge = el("companionSensorBadge");
    if (badge) {
        badge.className = "px-2 py-1 rounded text-[10px] font-bold bg-gray-200 text-gray-500 border border-gray-300";
        badge.innerText = "WAITING FOR POND...";
    }
  }

  function enableUI() {
    const main = el("mainContent");
    if (main) main.classList.remove("opacity-50", "pointer-events-none");
  }

  function applyModeUI(mode) {
    const isAuto = (mode || "manual").toLowerCase() === "auto";
    const btnManual = el("btn-manual");
    const btnAuto = el("btn-auto");
    if (btnManual && btnAuto) {
      if (isAuto) {
        btnAuto.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-white shadow text-gray-900";
        btnManual.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500";
      } else {
        btnManual.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-white shadow text-gray-900";
        btnAuto.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500";
      }
    }
    const manual = el("manual-controls");
    const auto = el("auto-controls");
    if (manual) manual.classList.toggle("hidden", isAuto);
    if (auto) auto.classList.toggle("hidden", !isAuto);
    
    evaluateSensorWarning(); 
  }

  function applyModeControlsInteractivity(mode) {
    const isAuto = (mode || "manual").toLowerCase() === "auto";
    const drainBtn = el("drain-btn");
    const fillBtn = el("fill-btn");
    const masterBtn = el("power-btn"); 

    if (isAuto) {
      if (drainBtn) drainBtn.setAttribute("disabled", "true");
      if (fillBtn) fillBtn.setAttribute("disabled", "true");
      if (masterBtn) masterBtn.setAttribute("disabled", "true");
    } else {
      if (drainBtn) drainBtn.removeAttribute("disabled");
      if (fillBtn) fillBtn.removeAttribute("disabled");
      if (masterBtn) masterBtn.removeAttribute("disabled");
    }
  }

  function applyBasisUI(basis) {
    const b = (basis || "threshold").toLowerCase();
    const isInterval = b === "interval";
    const btnThreshold = el("basis-threshold-btn");
    const btnInterval = el("basis-interval-btn");
    if (btnThreshold && btnInterval) {
      if (isInterval) {
        btnInterval.classList.add("border-green-500", "bg-green-50");
        btnInterval.classList.remove("border-gray-200", "bg-white");
        btnThreshold.classList.add("border-gray-200", "bg-white");
        btnThreshold.classList.remove("border-green-500", "bg-green-50");
      } else {
        btnThreshold.classList.add("border-green-500", "bg-green-50");
        btnThreshold.classList.remove("border-gray-200", "bg-white");
        btnInterval.classList.add("border-gray-200", "bg-white");
        btnInterval.classList.remove("border-green-500", "bg-green-50");
      }
    }
    const thresholdInfo = el("threshold-info");
    const intervalSettings = el("interval-settings");
    if (thresholdInfo) thresholdInfo.classList.toggle("hidden", isInterval);
    if (intervalSettings) intervalSettings.classList.toggle("hidden", !isInterval);
    
    evaluateSensorWarning();
  }

  function applyPowerUI(draft) {
    const status = draft.status || "off";
    const drain = draft.drainStatus || "off";
    const fill = draft.fillStatus || "off";

    const statPower = el("stat-power");
    if (statPower) {
      if (status === "on") { 
          statPower.innerText = "RUNNING"; 
          statPower.className = "text-3xl font-black text-green-500"; 
      }
      else if (status === "mixed") { 
          statPower.innerText = "PARTIAL"; 
          statPower.className = "text-3xl font-black text-blue-500"; 
      }
      else { 
          statPower.innerText = "STANDBY"; 
          statPower.className = "text-3xl font-black text-gray-400"; 
      }
    }

    const powerBtn = el("power-btn");
    const masterBtnLabel = el("power-btn-label");
    if (powerBtn && masterBtnLabel) {
        masterBtnLabel.innerText = status === "on" ? "ON" : (status === "mixed" ? "MIXED" : "OFF");
        if (status === "on") {
            powerBtn.className = "w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 mb-8 border-blue-500 bg-blue-50 text-blue-700 disabled:opacity-70 disabled:cursor-not-allowed";
        } else if (status === "mixed") {
            powerBtn.className = "w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 mb-8 border-indigo-400 bg-indigo-50 text-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed";
        } else {
            powerBtn.className = "w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 mb-8 border-gray-200 bg-white text-gray-800 disabled:opacity-70 disabled:cursor-not-allowed";
        }
    }

    const drainBtn = el("drain-btn");
    const drainLabel = el("drain-btn-label");
    if (drainBtn && drainLabel) {
      if (drain === "on") {
         drainBtn.className = "p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-blue-500 bg-blue-50 text-blue-700 disabled:opacity-70 disabled:cursor-not-allowed";
         drainLabel.innerText = "ON"; drainLabel.className = "text-[10px] font-black mt-1 text-blue-700";
      } else {
         drainBtn.className = "p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed";
         drainLabel.innerText = "OFF"; drainLabel.className = "text-[10px] font-black mt-1 text-gray-400";
      }
    }

    const fillBtn = el("fill-btn");
    const fillLabel = el("fill-btn-label");
    if (fillBtn && fillLabel) {
      if (fill === "on") {
         fillBtn.className = "p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-blue-500 bg-blue-50 text-blue-700 disabled:opacity-70 disabled:cursor-not-allowed";
         fillLabel.innerText = "ON"; fillLabel.className = "text-[10px] font-black mt-1 text-blue-700";
      } else {
         fillBtn.className = "p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed";
         fillLabel.innerText = "OFF"; fillLabel.className = "text-[10px] font-black mt-1 text-gray-400";
      }
    }
  }

  function applyTimeUI(lastUpdated) {
    const statTime = el("stat-time");
    if (!statTime) return;
    const t = lastUpdated;
    if (t && typeof t.toDate === "function") statTime.innerText = t.toDate().toLocaleString();
    else if (t) statTime.innerText = String(t);
    else statTime.innerText = "--";
  }

  function renderFromDraft() {
    if (!draftState) return;
    applyModeUI(draftState.mode);
    applyModeControlsInteractivity(draftState.mode);
    applyBasisUI(draftState.autoBasis);
    applyPowerUI(draftState); 
    
    const pondLinker = el("pondLinker");
    if (pondLinker) pondLinker.value = draftState.pondId || "";
    
    const iv = el("input-interval-value"); if (iv) iv.value = draftState.intervalValue || "";
    const iu = el("input-interval-unit"); if (iu) iu.value = draftState.intervalUnit || "hours";
    const dv = el("input-duration-value"); if (dv) dv.value = draftState.durationValue || "";
    const du = el("input-duration-unit"); if (du) du.value = draftState.durationUnit || "mins";

    applyTimeUI(serverState?.lastUpdated || null);
  }

  function init() {
    ensureSaveControls();
    initRegisterDeviceUI();
    const selector = el("deviceSelector");
    if (!selector) return;
    if (devicesUnsub) devicesUnsub();
    
    devicesUnsub = db
      .collection("devices")
      .where("type", "==", "pump")
      .onSnapshot(
        (snap) => {
          selector.innerHTML = '<option value="">Select IoT Device...</option>';
          if (snap.empty) {
            selector.value = "";
            disableUI();
            return;
          }
          const ids = [];
          snap.forEach((doc) => {
            const data = doc.data() || {};
            const label = data.name || doc.id;
            selector.innerHTML += `<option value="${doc.id}">${label}</option>`;
            ids.push(doc.id);
          });
          const saved = localStorage.getItem(LS_KEY);
          let pickId = null;
          if (currentDeviceId && ids.includes(currentDeviceId)) pickId = currentDeviceId;
          else if (saved && ids.includes(saved)) pickId = saved;
          else pickId = ids[0];
          
          if (pickId && pickId !== currentDeviceId) {
            selector.value = pickId;
            window.switchDevice(pickId);
          } else {
            selector.value = pickId || "";
          }
        },
        (err) => console.error("Error loading devices:", err)
      );

    if (pondsUnsub) pondsUnsub();
    pondsUnsub = db.collection("fishponds").onSnapshot(
      (snap) => {
        const linker = el("pondLinker");
        if (!linker) return;
        linker.innerHTML = '<option value="">No Pond Linked</option>';
        _syncModalPondsFromLinker();
        snap.forEach((doc) => {
          const name = (doc.data() || {}).name || doc.id;
          linker.innerHTML += `<option value="${doc.id}">${name}</option>`;
        });
        if (draftState) linker.value = draftState.pondId || "";
        _syncModalPondsFromLinker();
      },
      (err) => console.error("Error loading ponds:", err)
    );
    setDirty(false);
  }

  window.switchDevice = (id) => {
    if (!id) {
      localStorage.removeItem(LS_KEY);
      disableUI();
      return;
    }
    isDirty = false;
    isSaving = false;
    pendingSaveToken = null;
    currentDeviceId = id;
    localStorage.setItem(LS_KEY, id);
    enableUI();
    listenToDevice(id);
  };

  function listenToDevice(id) {
    if (deviceUnsub) deviceUnsub();
    deviceUnsub = db.collection("devices").doc(id).onSnapshot(
      async (doc) => {
        if (!doc.exists) return;
        const raw = doc.data() || {};
        if (raw.type && raw.type !== "pump") {
          disableUI();
          return;
        }
        setConnected();
        serverState = normalizeDevice(raw);
        if (pendingSaveToken && serverState.clientSaveToken === pendingSaveToken) {
          const now = new Date().toLocaleTimeString();
          setSaveBadge("saved", `Saved (${now})`);
          pendingSaveToken = null;
          setSaving(false);
          isDirty = false;
          try {
            await db.collection("devices").doc(currentDeviceId).update({
              clientSaveToken: firebase.firestore.FieldValue.delete(),
            });
          } catch (_) {}
        }
        if (!isDirty && !isSaving) {
          draftState = deepClone(serverState);
          listenToCompanionSensor(draftState.pondId); 
          renderFromDraft();
          if (!pendingSaveToken) setSaveBadge("saved", "Saved");
          setDirty(false);
        } else {
          applyTimeUI(serverState.lastUpdated || null);
        }
      },
      (err) => console.error("Error listening to device:", err)
    );
  }

  window.toggleMasterPower = () => {
    if (!currentDeviceId || !ensureDraft() || draftState.mode === "auto") return;
    const isCurrentlyOn = draftState.status === "on";
    
    draftState.status = isCurrentlyOn ? "off" : "on";
    draftState.drainStatus = draftState.status;
    draftState.fillStatus = draftState.status;
    
    setDirty(true);
    renderFromDraft();
    window.saveChanges();
  };

  window.toggleDrain = () => {
    if (!currentDeviceId || !ensureDraft() || draftState.mode === "auto") return;
    draftState.drainStatus = draftState.drainStatus === "on" ? "off" : "on";
    
    if (draftState.drainStatus === "on" && draftState.fillStatus === "on") draftState.status = "on";
    else if (draftState.drainStatus === "off" && draftState.fillStatus === "off") draftState.status = "off";
    else draftState.status = "mixed";
    
    setDirty(true);
    renderFromDraft();
    window.saveChanges();
  };

  window.toggleFill = () => {
    if (!currentDeviceId || !ensureDraft() || draftState.mode === "auto") return;
    draftState.fillStatus = draftState.fillStatus === "on" ? "off" : "on";
    
    if (draftState.drainStatus === "on" && draftState.fillStatus === "on") draftState.status = "on";
    else if (draftState.drainStatus === "off" && draftState.fillStatus === "off") draftState.status = "off";
    else draftState.status = "mixed";
    
    setDirty(true);
    renderFromDraft();
    window.saveChanges();
  };

  window.updateMode = (m) => {
    if (!currentDeviceId) return;
    if (!ensureDraft()) return;
    draftState.mode = (m || "manual").toLowerCase();
    setDirty(true);
    renderFromDraft();
  };

  window.linkPond = (pid) => {
    if (!currentDeviceId) return;
    if (!ensureDraft()) return;
    draftState.pondId = pid || "";
    setDirty(true);
    listenToCompanionSensor(draftState.pondId); 
    renderFromDraft();
  };

  window.updateBasis = (basis) => {
    if (!currentDeviceId) return;
    if (!ensureDraft()) return;
    draftState.autoBasis = (basis || "threshold").toLowerCase();
    setDirty(true);
    renderFromDraft();
  };

  (function bindIntervalInputsToDraftDelegated() {
    const onTimingChange = (ev) => {
      const t = ev && ev.target;
      if (!t || !['input-interval-value', 'input-interval-unit', 'input-duration-value', 'input-duration-unit'].includes(t.id)) return;
      if (!currentDeviceId) return;
      ensureDraft();
      
      if (t.id === 'input-interval-value') {
          const v = Number(t.value);
          draftState.intervalValue = (Number.isFinite(v) && v > 0) ? v : null;
      }
      if (t.id === 'input-interval-unit') draftState.intervalUnit = t.value;
      
      if (t.id === 'input-duration-value') {
          const v = Number(t.value);
          draftState.durationValue = (Number.isFinite(v) && v > 0) ? v : null;
      }
      if (t.id === 'input-duration-unit') draftState.durationUnit = t.value;
      
      setDirty(true);
    };
    document.addEventListener("input", onTimingChange, true);
    document.addEventListener("change", onTimingChange, true);
  })();

  window.saveChanges = async () => {
    if (!currentDeviceId) return;
    if (!ensureDraft()) return;

    if (draftState.autoBasis === "interval") {
      if (!draftState.intervalValue || draftState.intervalValue <= 0 || !draftState.durationValue || draftState.durationValue <= 0) {
        setSaveBadge("error", "Values required");
        return;
      }
    }

    const token = `wx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    pendingSaveToken = token;
    const payload = payloadFromDraft(draftState, token);

    try {
      setSaving(true);
      setSaveBadge("saving", "Saving...");

      await db.collection("devices").doc(currentDeviceId).update(payload);

      setSaveBadge("saving", "Verifying...");
      isDirty = false;
      const btn = el("saveBtn");
      if (btn) btn.disabled = true;
    } catch (e) {
      console.error("Save failed:", e);
      pendingSaveToken = null;
      setSaving(false);
      setDirty(true);
      setSaveBadge("error", "Save failed");
      alert("Save failed. Check console for error.");
    }
  };

  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "index.php?page=login";
      return;
    }
    init();
  });

  disableUI();
})();