<?php

class MonitoringController {
    public function index() {
        // Placeholder: server-side auth checks could go here later.
        // For now, client-side Firebase Auth guard is used in the view.

        $currentPage = 'monitoring';

        require 'views/monitoring.php';
    }
}

?>
