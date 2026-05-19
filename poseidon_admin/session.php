<?php
// session.php
// Shared session bootstrap for all pages.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check whether a user is authenticated via PHP session.
 * This can be extended later to store user data or permissions.
 */
function isAuthenticated(): bool {
    return !empty($_SESSION['authenticated']) || !empty($_SESSION['user_id']);
}

/**
 * Redirect unauthenticated requests to the login page.
 */
function createAuthSession(string $userId = ''): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    if ($userId !== '') {
        $_SESSION['user_id'] = $userId;
    }
}

function requireLogin(): void {
    if (!isAuthenticated()) {
        $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        if (basename($basePath) === 'views') {
            $basePath = dirname($basePath);
        }

        header('Location: ' . $basePath . '/index.php?page=login');
        exit;
    }
}
