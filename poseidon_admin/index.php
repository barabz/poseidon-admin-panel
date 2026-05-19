<?php
// index.php

require_once __DIR__ . '/session.php';

$page = isset($_GET['page']) ? $_GET['page'] : 'login';

if ($page === 'login') {
    require_once 'controllers/AuthController.php';
    $controller = new AuthController();
    $controller->login();
}
else if ($page === 'register') {
    require_once 'controllers/AuthController.php';
    $controller = new AuthController();
    $controller->register();
}
else if ($page === 'dashboard') {
    require_once 'controllers/DashboardController.php';
    $controller = new DashboardController();
    $controller->index();
}
else if ($page === 'monitoring') {
    require_once 'controllers/MonitoringController.php';
    $controller = new MonitoringController();
    $controller->index();
}
else if ($page === 'accounts') {
    require_once 'controllers/AccountsController.php';
    $controller = new AccountsController();
    $controller->index();
}
else if ($page === 'assignments') {
    require_once 'controllers/AssignmentsController.php';
    $controller = new AssignmentsController();
    $controller->index();
}
else if ($page === 'water-exchange') {
    require_once 'controllers/WaterExchangeController.php';
    $controller = new WaterExchangeController();
    $controller->index();
}
else if ($page === 'water-exchange-register') {
    require_once 'controllers/WaterExchangeController.php';
    $controller = new WaterExchangeController();
    $controller->register();
}
else if ($page === 'sensors') {
    require_once 'controllers/SensorController.php';
    $controller = new SensorController();
    $controller->index();
}
else if ($page === 'fishpond-reports' || $page === 'reports') {
    require_once 'controllers/ReportsController.php';
    $controller = new ReportsController();
    $controller->index();
}
else if ($page === 'aerator-recommendation') {
    require_once 'controllers/AeratorRecommendationController.php';
    $controller = new AeratorRecommendationController();
    $controller->index();
}
else if ($page === 'notifications') {
    require_once 'controllers/NotificationsController.php';
    $controller = new NotificationsController();
    $controller->index();
}
else if ($page === 'profile') {
    require_once 'controllers/ProfileController.php';
    $controller = new ProfileController();
    $controller->index();
}

else {
    echo "Page not found: " . htmlspecialchars($page);
}
