/* assets/js/assignments.js */
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

  const db = firebase.firestore();

  // DOM References
  const assignmentsGrid = document.getElementById("assignmentsGrid");
  const assignmentCount = document.getElementById("assignmentCount");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter"); 

  // Modal references
  const assignModal = document.getElementById("assignModal");
  const closeAssignModal = document.getElementById("closeAssignModal");
  const modalPondName = document.getElementById("modalPondName");
  const workerCheckboxList = document.getElementById("workerCheckboxList");
  const saveAssignmentBtn = document.getElementById("saveAssignmentBtn");

  // Edit Modal references
  const editPondModal = document.getElementById("editPondModal");
  const closeEditModal = document.getElementById("closeEditModal");
  const editPondId = document.getElementById("editPondId");
  const editPondName = document.getElementById("editPondName");
  const editSpecies = document.getElementById("editSpecies");
  const editDimensions = document.getElementById("editDimensions");
  const savePondChangesBtn = document.getElementById("savePondChangesBtn");

  // Toast
  const toastEl = document.getElementById("toast");
  const toastTitleEl = document.getElementById("toastTitle");
  const toastMsgEl = document.getElementById("toastMsg");
  const toastClose = document.getElementById("toastClose");

  // Cache
  let allPonds = [];
  let allWorkers = [];
  let currentPondId = null;
  let workersUnsub = null;

  // ================ LOAD PONDS ================
  function listenPonds() {
    db.collection("fishponds")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snap) => {
          allPonds = [];
          snap.forEach((doc) => {
            allPonds.push({ id: doc.id, ...doc.data() });
          });
          renderGrid();
        },
        (err) => {
          console.error("Ponds listener error:", err);
          showToast("Error", "Failed to load ponds.");
        }
      );
  }

  // ================ LOAD WORKERS ================
  function listenWorkers() {
    if (workersUnsub) workersUnsub();

    workersUnsub = db
      .collection("users")
      .where("role", "==", "worker")
      .onSnapshot(
        (snap) => {
          allWorkers = [];
          snap.forEach((doc) => {
            const data = doc.data();
            if (data.status !== "inactive") {
              allWorkers.push({ id: doc.id, ...data });
            }
          });

          allWorkers.sort((a, b) =>
            String(a.displayName || a.email || "").localeCompare(
              String(b.displayName || b.email || "")
            )
          );
          
          renderGrid();
        },
        (err) => {
          console.error("Workers listener error:", err);
          showToast("Error", "Failed to load workers.");
        }
      );
  }

  // ================ RENDER GRID ================
  function renderGrid() {
    if (!assignmentsGrid) return;

    const term = (searchInput.value || "").toLowerCase();
    const statusMode = statusFilter ? statusFilter.value : "active";

    const filtered = allPonds.filter((p) => {
      const pName = (p.name || "").toLowerCase();
      const pSpecies = (p.fishSpecies || "").toLowerCase();
      const matchesSearch = pName.includes(term) || pSpecies.includes(term);
      
      const pStatus = p.status || 'active';
      const matchesStatus = (pStatus === statusMode);

      return matchesSearch && matchesStatus;
    });

    if (assignmentCount) {
      assignmentCount.innerHTML = `<span class="font-medium">${filtered.length}</span> ${statusMode} ponds`;
    }

    if (filtered.length === 0) {
      assignmentsGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-muted">
          <p>No ${statusMode} fishponds found.</p>
        </div>`;
      return;
    }

    assignmentsGrid.innerHTML = filtered.map((p) => {
      // ✅ FIX: Use 'assignedWorkers' instead of 'assignedWorkerIds'
      const assignedIds = p.assignedWorkers || [];

      // Map IDs to Names
      const assignedNames = assignedIds.map((uid) => {
        const w = allWorkers.find((wk) => wk.id === uid);
        return w ? (w.displayName || w.email) : "Unknown";
      });

      let workerListStr = "No workers yet";
      if (assignedNames.length > 0) {
        const displayLimit = 2;
        const visible = assignedNames.slice(0, displayLimit).join(", ");
        const remainder = assignedNames.length - displayLimit;
        workerListStr = visible + (remainder > 0 ? ` +${remainder} more` : "");
      }

      const isInactive = (p.status === 'inactive');
      const toggleIcon = isInactive ? 'refresh-ccw' : 'power'; 
      const toggleColor = isInactive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50';
      const toggleTitle = isInactive ? 'Reactivate' : 'Deactivate';

      return `
        <div class="card bg-white border border-color rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
          
          <div class="flex items-start justify-between">
            <div>
                <h3 class="font-bold text-lg text-gray-800 leading-tight">${p.name || "Unnamed Pond"}</h3>
                <p class="text-xs text-muted mt-1">${p.fishSpecies || "Unknown Species"}</p>
                <p class="text-xs text-gray-400">${p.dimensions || "No size info"}</p>
            </div>
            <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-full ${isInactive ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}">
                ${isInactive ? 'Inactive' : 'Active'}
            </span>
          </div>

          <hr class="border-gray-100">

          <div class="flex items-start gap-3">
             <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <i data-lucide="users" class="w-4 h-4"></i>
             </div>
             <div>
               <p class="text-xs text-muted uppercase font-bold mb-0.5">Workforce</p>
               <p class="text-sm text-gray-800 line-clamp-2" title="${assignedNames.join(", ")}">
                 ${workerListStr}
               </p>
             </div>
          </div>

          <div class="mt-auto pt-2 flex items-center gap-2">
            <button type="button" class="btn-action flex-1 btn-primary py-2 px-3 rounded text-xs font-medium text-white shadow-sm flex items-center justify-center gap-2 transition hover:opacity-90"
                data-action="assign" data-id="${p.id}">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                Assign
            </button>

            <button type="button" class="btn-action w-9 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
                data-action="edit" data-id="${p.id}" title="Edit Info">
                <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button type="button" class="btn-action w-9 h-9 flex items-center justify-center rounded border border-gray-200 ${toggleColor} transition"
                data-action="toggleStatus" data-id="${p.id}" data-current="${p.status || 'active'}" title="${toggleTitle}">
                <i data-lucide="${toggleIcon}" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  }

  // ================ CLICK DELEGATION ================
  assignmentsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'assign') openAssignModal(id);
    if (action === 'edit') openEditModal(id);
    if (action === 'toggleStatus') {
        const current = btn.getAttribute('data-current');
        togglePondStatus(id, current);
    }
  });

  // ================ 1. ASSIGN LOGIC ================
  function openAssignModal(pondId) {
    if (!assignModal) return;
    currentPondId = pondId;
    const pond = allPonds.find(p => p.id === pondId);
    if (!pond) return;

    modalPondName.textContent = pond.name || "Untitled Pond";
    
    // ✅ FIX: Read from 'assignedWorkers' to check boxes
    const assignedIds = pond.assignedWorkers || [];
    
    if (allWorkers.length === 0) {
      workerCheckboxList.innerHTML = `<div class="p-4 text-center text-sm text-muted">No workers found.</div>`;
    } else {
      workerCheckboxList.innerHTML = allWorkers.map((w) => {
        const isChecked = assignedIds.includes(w.id) ? "checked" : "";
        return `
          <label class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-50 last:border-0">
            <div class="flex items-center gap-3">
               <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                 ${(w.displayName || w.email || "U").charAt(0).toUpperCase()}
               </div>
               <div>
                 <div class="text-sm font-medium text-gray-800">${w.displayName || "Unnamed"}</div>
                 <div class="text-xs text-gray-500">${w.email}</div>
               </div>
            </div>
            <input type="checkbox" class="worker-checkbox w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                   value="${w.id}" ${isChecked}>
          </label>
        `;
      }).join("");
    }
    assignModal.classList.remove("hidden");
  }

  // Save Assignment
  if(saveAssignmentBtn) {
    saveAssignmentBtn.addEventListener("click", async () => {
      if (!currentPondId) return;
      const checkedBoxes = document.querySelectorAll(".worker-checkbox:checked");
      const selectedIds = Array.from(checkedBoxes).map((cb) => cb.value);

      const oldText = saveAssignmentBtn.innerText;
      saveAssignmentBtn.disabled = true;
      saveAssignmentBtn.innerText = "Saving...";

      try {
        // ✅ FIX: Write to 'assignedWorkers'
        await db.collection("fishponds").doc(currentPondId).update({
          assignedWorkers: selectedIds,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast("Success", "Assignments updated successfully.");
        assignModal.classList.add("hidden");
      } catch (err) {
        console.error("Save error:", err);
        showToast("Error", "Failed to save.");
      } finally {
        saveAssignmentBtn.disabled = false;
        saveAssignmentBtn.innerText = oldText;
      }
    });
  }
  
  // ================ 2. EDIT LOGIC ================
  function openEditModal(pondId) {
    if (!editPondModal) return;
    const pond = allPonds.find(p => p.id === pondId);
    if (!pond) return;

    editPondId.value = pondId;
    editPondName.value = pond.name || "";
    editSpecies.value = pond.fishSpecies || "";
    editDimensions.value = pond.dimensions || "";

    editPondModal.classList.remove("hidden");
  }

  if(savePondChangesBtn) {
    savePondChangesBtn.addEventListener("click", async () => {
        const id = editPondId.value;
        if (!id) return;

        const oldText = savePondChangesBtn.innerText;
        savePondChangesBtn.disabled = true;
        savePondChangesBtn.innerText = "Saving...";

        try {
            await db.collection("fishponds").doc(id).update({
                name: editPondName.value.trim(),
                fishSpecies: editSpecies.value.trim(),
                dimensions: editDimensions.value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast("Success", "Fishpond details updated.");
            editPondModal.classList.add("hidden");
        } catch (err) {
            console.error(err);
            showToast("Error", err.message);
        } finally {
            savePondChangesBtn.disabled = false;
            savePondChangesBtn.innerText = oldText;
        }
    });
  }

  // ================ 3. TOGGLE STATUS LOGIC ================
  async function togglePondStatus(pondId, currentStatus) {
    const isInactive = (currentStatus === 'inactive');
    const newStatus = isInactive ? 'active' : 'inactive';
    const verb = isInactive ? "reactivate" : "deactivate";

    if (!confirm(`Are you sure you want to ${verb} this fishpond?`)) return;

    try {
        await db.collection("fishponds").doc(pondId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(isInactive ? "Reactivated" : "Deactivated", `Pond status updated.`);
    } catch (err) {
        console.error(err);
        showToast("Error", err.message);
    }
  }

  // ================ HELPERS ================
  if(searchInput) searchInput.addEventListener("input", renderGrid);
  if(statusFilter) statusFilter.addEventListener("change", renderGrid);
  if(closeAssignModal) closeAssignModal.addEventListener("click", () => assignModal.classList.add("hidden"));
  if(closeEditModal) closeEditModal.addEventListener("click", () => editPondModal.classList.add("hidden"));

  if (toastClose) {
    toastClose.addEventListener("click", () => {
      toastEl.classList.add("translate-y-20", "opacity-0");
    });
  }

  function showToast(title, msg) {
    if(!toastEl) return;
    toastTitleEl.textContent = title;
    toastMsgEl.textContent = msg;
    toastEl.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => {
      toastEl.classList.add("translate-y-20", "opacity-0");
    }, 3000);
  }

  // Init
  listenPonds();
  listenWorkers();

})();