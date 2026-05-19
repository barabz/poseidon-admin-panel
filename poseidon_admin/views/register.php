<?php require_once __DIR__ . '/../session.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Register</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

    <style>
        :root {
            --background: #ffffff;
            --foreground: #374151;
            --card: #f0fdf4;
            --primary: #15803d;
            --border: #e5e7eb;
        }
        body { 
            background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .card { background-color: var(--card); border: 1px solid var(--border); }
        .btn-primary { background-color: var(--primary); color: white; }
        .btn-primary:hover { background-color: #166534; }
        
        /* Google Button Style */
        .btn-google {
            background-color: white;
            color: #374151;
            border: 1px solid #e5e7eb;
            transition: all 0.2s;
        }
        .btn-google:hover {
            background-color: #f9fafb;
            border-color: #d1d5db;
        }
    </style>
</head>
<body class="p-4">
    <div class="card w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="sprout" class="w-8 h-8 text-green-700"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Create Account</h1>
            <p class="text-gray-500 text-sm mt-2">Join the POSEIDON system</p>
        </div>

        <button id="googleBtn" type="button" class="btn-google w-full py-2.5 rounded-lg font-medium shadow-sm flex items-center justify-center gap-3 mb-4">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
            <span>Sign up with Google</span>
        </button>

        <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-green-50 text-gray-500">Or continue with email</span>
            </div>
        </div>

        <form id="registerForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div class="relative">
                        <i data-lucide="user" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                        <input type="text" id="fullName" class="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="John Doe" required>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div class="relative">
                        <i data-lucide="at-sign" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                        <input type="text" id="username" class="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="johnd" required>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div class="relative">
                    <i data-lucide="mail" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                    <input type="email" id="email" class="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="name@example.com" required>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="relative">
                    <i data-lucide="lock" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                    <input type="password" id="password" class="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="12+ chars, 1 Cap, 1 Special" required>
                </div>
                <p class="text-xs text-gray-500 mt-1">Must be 12+ chars, include 1 Capital & 1 Special char.</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div class="relative">
                    <i data-lucide="check-circle" class="absolute left-3 top-3 w-4 h-4 text-gray-400"></i>
                    <input type="password" id="confirmPassword" class="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="••••••••" required>
                </div>
            </div>

            <button type="submit" id="registerBtn" class="btn-primary w-full py-2.5 rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02]">
                Create Account
            </button>
        </form>

        <p class="text-center text-sm text-gray-600 mt-6">
            Already have an account? <a href="index.php?page=login" class="text-green-700 font-bold hover:underline">Sign in</a>
        </p>
    </div>

    <?php require __DIR__ . '/partials/firebase.php'; ?>

    <script>
        lucide.createIcons();

        // Initialize Firebase
        const firebaseConfig = window.__FIREBASE_CONFIG__;
        if (!firebaseConfig) {
            console.error("Firebase Config missing!");
        } else {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
        }

        const auth = firebase.auth();
        const db = firebase.firestore();
        const googleProvider = new firebase.auth.GoogleAuthProvider();

        // --- 1. HANDLE GOOGLE SIGN UP ---
        const googleBtn = document.getElementById('googleBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const originalContent = googleBtn.innerHTML;
                googleBtn.style.opacity = "0.7";
                googleBtn.innerHTML = `<span>Checking...</span>`;
                googleBtn.disabled = true;

                try {
                    const result = await auth.signInWithPopup(googleProvider);
                    const user = result.user;
                    
                    // Check if user document ALREADY exists
                    const userDoc = await db.collection("users").doc(user.uid).get();

                    if (userDoc.exists) {
                        // ❌ EXISTS: Prevent Signup logic
                        await auth.signOut();
                        alert("Account already exists! Please go to Login.");
                        window.location.href = 'index.php?page=login';
                    } else {
                        // ✅ NEW: Create Account
                        await db.collection("users").doc(user.uid).set({
                            fullName: user.displayName || "Google User",
                            username: user.email.split('@')[0], 
                            email: user.email,
                            role: 'admin', 
                            status: 'active',
                            photoURL: user.photoURL,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        alert('Account created successfully!');
                        window.location.href = 'index.php?page=dashboard';
                    }

                } catch (error) {
                    console.error("Google Sign-In Error:", error);
                    alert("Sign-Up Failed: " + error.message);
                    googleBtn.style.opacity = "1";
                    googleBtn.innerHTML = originalContent;
                    googleBtn.disabled = false;
                }
            });
        }

        // --- 2. HANDLE EMAIL/PASSWORD SIGN UP ---
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btn = document.getElementById('registerBtn');
                const fullName = document.getElementById('fullName').value;
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                // --- VALIDATIONS ---

                // 1. Password Match
                if (password !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }

                // 2. Password Strength (12+ chars, 1 Capital, 1 Special)
                // Regex: At least 1 Capital (?=.*[A-Z]), At least 1 Special (?=.*[\W_]), 12+ chars (.{12,})
                const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{12,}$/;
                if (!passwordRegex.test(password)) {
                    alert('Password Security Violation:\n\n- Must be at least 12 characters long\n- Must contain at least one Capital letter\n- Must contain at least one Special character');
                    return;
                }

                btn.disabled = true;
                btn.innerText = "Creating Account...";

                try {
                    // Step A: Create the user in Firebase Auth
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    // Step B: Save extra data in Firestore
                    await db.collection("users").doc(user.uid).set({
                        fullName: fullName,
                        username: username,
                        email: email,
                        role: 'admin',
                        status: 'active',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    alert('Account Created Successfully!');
                    window.location.href = 'index.php?page=login';

                } catch (error) {
                    console.error(error);
                    
                    // Specific Error Handling for Duplicate Email
                    if (error.code === 'auth/email-already-in-use') {
                        alert("This email is already registered. Please Login instead.");
                    } else {
                        alert("Error: " + error.message);
                    }
                    
                    btn.disabled = false;
                    btn.innerText = "Create Account";
                }
            });
        }
    </script>
</body>
</html>
