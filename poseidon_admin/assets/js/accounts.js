// assets/js/accounts.js
(function () {
  if (window.lucide) window.lucide.createIcons();

  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) {
    console.error("Missing Firebase config: window.__FIREBASE_CONFIG__");
    return;
  }

  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // Toast
  const toastEl = document.getElementById("toast");
  const toastTitleEl = document.getElementById("toastTitle");
  const toastMsgEl = document.getElementById("toastMsg");
  const toastClose = document.getElementById("toastClose");

  function showToast(title, msg) {
    if (!toastEl) return;
    toastTitleEl.textContent = title;
    toastMsgEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3000);
  }
  if (toastClose) toastClose.addEventListener("click", () => toastEl.classList.remove("show"));

  // Modal (Add Worker info)
  const addAccountBtn = document.getElementById("addAccountBtn");
  const addAccountModal = document.getElementById("addAccountModal");
  const closeAddAccount = document.getElementById("closeAddAccount");
  const closeAddAccount2 = document.getElementById("closeAddAccount2");

  function openModal(modal) { modal.classList.add("show"); }
  function closeModal(modal) { modal.classList.remove("show"); }

  if (addAccountBtn) addAccountBtn.addEventListener("click", () => openModal(addAccountModal));
  if (closeAddAccount) closeAddAccount.addEventListener("click", () => closeModal(addAccountModal));
  if (closeAddAccount2) closeAddAccount2.addEventListener("click", () => closeModal(addAccountModal));
  if (addAccountModal) {
    addAccountModal.addEventListener("click", (e) => {
      if (e.target === addAccountModal) closeModal(addAccountModal);
    });
  }

  // DOM
  const accountsList = document.getElementById("accountsList");

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c]));
  }

  function initialsAvatar(nameOrEmail) {
    const s = String(nameOrEmail || "").trim();
    if (!s) return "W";
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }

  function statusLabel(status) {
    return String(status || "active").toLowerCase() === "inactive" ? "Inactive" : "Active";
  }

  function isInactive(status) {
    return String(status || "active").toLowerCase() === "inactive";
  }

  function renderWorkerCard(userId, data) {
    const displayName = data.displayName || data.name || "Unnamed Worker";
    const email = data.email || "No email";
    const status = statusLabel(data.status);
    const inactive = isInactive(data.status);

    const statusPillClass = inactive ? "status-inactive" : "status-active";
    const dotClass = inactive ? "offline" : "online";

    const actionText = inactive ? "Activate" : "Deactivate";
    const actionClass = inactive
      ? "flex-1 text-green-600 hover:bg-green-50 rounded p-2 text-sm font-medium"
      : "flex-1 text-red-600 hover:bg-red-50 rounded p-2 text-sm font-medium";

    const assigned = Array.isArray(data.assignedPonds) ? data.assignedPonds : [];
    const assignedText = assigned.length ? `Pond #${assigned.join(", #")}` : "No ponds assigned";

    return `
      <div class="card rounded-lg p-6 profile-card" data-user-id="${escapeHtml(userId)}">
        <div style="position: relative; display: inline-block; margin-bottom: 1rem;">
          <div class="profile-avatar flex items-center justify-center text-xl font-semibold">
            ${escapeHtml(initialsAvatar(displayName))}
          </div>
          <div class="status-badge ${dotClass}"></div>
        </div>

        <h3 class="font-semibold text-lg mb-1">${escapeHtml(displayName)}</h3>
        <p class="text-sm text-muted mb-3">${escapeHtml(email)}</p>

        <span class="${statusPillClass} px-3 py-1 text-xs rounded inline-block mb-3">${status}</span>

        <p class="text-xs text-muted mb-4">Worker • ${escapeHtml(assignedText)}</p>

        <div class="w-full flex gap-2">
          <button class="flex-1 text-blue-600 hover:bg-blue-50 rounded p-2 text-sm font-medium" data-action="edit" type="button">Edit</button>
          <button class="${actionClass}" data-action="toggle" type="button">${actionText}</button>
        </div>
      </div>
    `;
  }

  async function toggleStatus(userId, currentStatus) {
    const inactive = isInactive(currentStatus);
    const nextStatus = inactive ? "active" : "inactive";

    await db.collection("users").doc(userId).set(
      { status: nextStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    showToast("Updated", `Account set to ${nextStatus}.`);
  }

  function listenWorkers() {
    // ✅ Removed orderBy to avoid index requirement
    return db.collection("users")
      .where("role", "==", "worker")
      .onSnapshot((snap) => {
        if (!accountsList) return;

        if (snap.empty) {
          accountsList.innerHTML = `<div class="text-sm text-muted">No worker accounts found. Add workers in Firebase Auth + Firestore.</div>`;
          return;
        }

        // ✅ Client-side sort (same output, no Firestore index)
        const rows = [];
        snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
        rows.sort((a, b) => String(a.displayName || a.email || "")
          .localeCompare(String(b.displayName || b.email || ""), undefined, { sensitivity: "base" })
        );

        accountsList.innerHTML = rows.map(r => renderWorkerCard(r.id, r)).join("");
        if (window.lucide) window.lucide.createIcons();
      }, (err) => {
        console.error("Workers listener error:", err);
        const msg = (err && err.code) ? `${err.code}: ${err.message}` : (err.message || "Unknown error");
        if (accountsList) {
          accountsList.innerHTML = `<div class="text-sm text-muted">Failed to load workers. ${escapeHtml(msg)}</div>`;
        }
      });
  }

  function bindActions() {
    if (!accountsList) return;

    accountsList.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const card = e.target.closest("[data-user-id]");
      if (!card) return;

      const userId = card.getAttribute("data-user-id");
      const action = btn.getAttribute("data-action");

      if (action === "edit") {
        showToast("Info", "Edit feature will be handled in the next step.");
        return;
      }

      if (action === "toggle") {
        try {
          btn.disabled = true;

          const snap = await db.collection("users").doc(userId).get();
          if (!snap.exists) {
            showToast("Error", "User profile missing in Firestore.");
            return;
          }

          const data = snap.data();
          const ok = confirm(`Set ${data.displayName || data.email || "this worker"} to ${isInactive(data.status) ? "ACTIVE" : "INACTIVE"}?`);
          if (!ok) return;

          await toggleStatus(userId, data.status);
        } catch (err) {
          console.error(err);
          showToast("Error", err.message || "Failed to update status.");
        } finally {
          btn.disabled = false;
        }
      }
    });
  }

  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "index.php?page=login";
      return;
    }

    bindActions();
    listenWorkers();
  });
})();
