<?php require_once __DIR__ . '/../session.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSEIDON Admin - Login</title>
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
        .input-field { border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; background: white; }
        
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
<body>
    <div class="w-full max-w-md p-4">
        <div class="card rounded-lg p-8 shadow-xl">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="waves" class="w-8 h-8 text-green-700"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-800">Welcome Back</h1>
                <p class="text-sm text-gray-500 mt-2">Log in to POSEIDON Admin</p>
            </div>

            <button id="googleBtn" type="button" class="btn-google w-full py-2.5 rounded-lg font-medium shadow-sm flex items-center justify-center gap-3 mb-4">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
                <span>Sign in with Google</span>
            </button>

            <div class="relative mb-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-200"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-green-50 text-gray-500">Or continue with email</span>
                </div>
            </div>

            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
                    <input type="email" id="email" class="w-full input-field focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="admin@poseidon.com" required>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1 text-gray-700">Password</label>
                    <input type="password" id="password" class="w-full input-field focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="••••••••" required>
                </div>

                <div class="flex items-center justify-between text-xs">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" class="w-4 h-4 border-gray-300 rounded text-green-600 focus:ring-green-500">
                        <span class="text-gray-600">Remember me</span>
                    </label>
                    <a href="#" class="text-green-700 hover:underline">Forgot password?</a>
                </div>

                <button type="submit" id="loginBtn" class="w-full btn-primary p-3 rounded font-medium mt-6 shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02]">
                    Login
                </button>
            </form>

            <div class="text-center mt-6 pt-6 border-t border-gray-200">
                <p class="text-sm text-gray-600">
                    Don't have an account?
                    <a href="index.php?page=register" class="text-green-700 hover:underline font-bold">Sign up here</a>
                </p>
            </div>
        </div>
    </div>

    <?php require __DIR__ . '/partials/firebase.php'; ?>

    <script>
        lucide.createIcons();

        // 1. Initialize Firebase
        const firebaseConfig = window.__FIREBASE_CONFIG__;
        if (!firebaseConfig) {
            console.error("Firebase Config missing! Check partials/firebase.php");
            alert("System Error: Database configuration missing.");
        } else {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
        }

        const auth = firebase.auth();
        const db = firebase.firestore();
        const googleProvider = new firebase.auth.GoogleAuthProvider();

        async function bindSession(uid) {
            try {
                const response = await fetch('session_bind.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid })
                });

                const body = await response.json();
                if (!response.ok || !body.success) {
                    throw new Error(body.message || 'Session bind failed');
                }
            } catch (error) {
                console.error('Session bind error:', error);
                alert('Login failed while creating session. Please try again.');
                throw error;
            }
        }

        // --- 2. HANDLE GOOGLE LOGIN (Updated) ---
        const googleBtn = document.getElementById('googleBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const originalContent = googleBtn.innerHTML;
                googleBtn.style.opacity = "0.7";
                googleBtn.innerHTML = `<span>Checking...</span>`;
                googleBtn.disabled = true;

                try {
                    // 1. Open Google Popup
                    const result = await auth.signInWithPopup(googleProvider);
                    const user = result.user;

                    // 2. Check if user exists in Firestore
                    const userDoc = await db.collection("users").doc(user.uid).get();

                    if (!userDoc.exists) {
                        // ❌ DOES NOT EXIST: Sign out immediately and show error
                        await auth.signOut();
                        
                        alert("This Google account is not registered.\nPlease sign up first.");
                        
                        // Reset button
                        googleBtn.style.opacity = "1";
                        googleBtn.innerHTML = originalContent;
                        googleBtn.disabled = false;
                        
                        // Optional: Redirect to register page
                        // window.location.href = 'index.php?page=register'; 
                    } else {
                        // ✅ EXISTS: Set server session and redirect to Dashboard
                        await bindSession(user.uid);
                        window.location.href = 'index.php?page=dashboard';
                    }

                } catch (error) {
                    console.error("Google Login Error:", error);
                    alert("Login Failed: " + error.message);
                    googleBtn.style.opacity = "1";
                    googleBtn.innerHTML = originalContent;
                    googleBtn.disabled = false;
                }
            });
        }

        // --- 3. HANDLE EMAIL LOGIN ---
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('loginBtn');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerText = "Authenticating...";

            try {
                const credential = await auth.signInWithEmailAndPassword(email, password);
                await bindSession(credential.user.uid);
                
                // For email login, we trust Auth, but you could also check 'users' doc here if needed.
                // Generally, if they have a password, they are registered.
                window.location.href = 'index.php?page=dashboard';
            } catch (error) {
                console.error(error);
                alert("Login Error: " + error.message);
                btn.disabled = false;
                btn.innerText = "Login";
            }
        });
    </script>
</body>
</html>
