/* assets/js/profile.js */
(function () {
  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) return console.error("Config missing");
  
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Elements
  const displayTitle = document.getElementById("displayTitle");
  const displayEmail = document.getElementById("displayEmail");
  
  const inputFirstName = document.getElementById("inputFirstName");
  const inputLastName = document.getElementById("inputLastName");
  
  const inputEmail = document.getElementById("inputEmail");
  const inputPhone = document.getElementById("inputPhone");
  const inputLocation = document.getElementById("inputLocation");
  
  const btnSave = document.getElementById("btnSave");
  const btnResetPassword = document.getElementById("btnResetPassword");
  const form = document.getElementById("profileForm");

  let currentUserUid = null;

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUserUid = user.uid;
      loadProfile(user);
    } else {
      window.location.href = "index.php?page=login";
    }
  });

  async function loadProfile(firebaseUser) {
    try {
      inputEmail.value = firebaseUser.email;
      displayEmail.textContent = firebaseUser.email;

      const doc = await db.collection("users").doc(firebaseUser.uid).get();

      if (doc.exists) {
        const data = doc.data();
        
        // 1. Handle Names (Priority: specific fields -> split displayName -> empty)
        if (data.firstName && data.lastName) {
            inputFirstName.value = data.firstName;
            inputLastName.value = data.lastName;
            displayTitle.textContent = `${data.firstName} ${data.lastName}`;
        } else {
            // Fallback for existing users with only 'displayName'
            const fullName = data.displayName || data.name || "";
            const parts = fullName.split(" ");
            inputFirstName.value = parts[0] || "";
            // Join the rest as last name (in case of multiple middle names)
            inputLastName.value = parts.slice(1).join(" ") || "";
            
            displayTitle.textContent = fullName || "Admin User";
        }

        inputPhone.value = data.phoneNumber || data.phone || "";
        inputLocation.value = data.farmLocation || data.address || "";
        
      } else {
        displayTitle.textContent = "Admin User";
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showToast("Error", "Failed to load profile data.");
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUserUid) return;

    btnSave.disabled = true;
    btnSave.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Saving...';
    lucide.createIcons();

    try {
      const fName = inputFirstName.value.trim();
      const lName = inputLastName.value.trim();
      const fullName = `${fName} ${lName}`.trim();

      const updates = {
        firstName: fName,
        lastName: lName,
        displayName: fullName, // We keep this for backward compatibility
        phoneNumber: inputPhone.value.trim(),
        farmLocation: inputLocation.value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(currentUserUid).set(updates, { merge: true });
      
      displayTitle.textContent = fullName;
      
      showToast("Success", "Profile information saved successfully.");
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Error", error.message);
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Save Changes';
      lucide.createIcons();
    }
  });

  btnResetPassword.addEventListener("click", async () => {
    const email = inputEmail.value;
    if (!email) return;

    if (confirm(`Send a password reset email to ${email}?`)) {
      try {
        await auth.sendPasswordResetEmail(email);
        showToast("Email Sent", "Check your inbox for password reset instructions.");
      } catch (error) {
        showToast("Error", error.message);
      }
    }
  });

  function showToast(title, msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastMsg").textContent = msg;
    el.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => el.classList.add("translate-y-20", "opacity-0"), 3000);
  }

})();