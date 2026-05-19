<?php
// session_bind.php
// Bind a PHP session after successful client-side login.

require_once __DIR__ . '/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$payload = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];
} else {
    $payload = $_POST;
}

$userId = isset($payload['uid']) ? trim($payload['uid']) : '';

session_regenerate_id(true);
$_SESSION['authenticated'] = true;
if ($userId !== '') {
    $_SESSION['user_id'] = $userId;
}

header('Content-Type: application/json');
echo json_encode(['success' => true]);
exit;
