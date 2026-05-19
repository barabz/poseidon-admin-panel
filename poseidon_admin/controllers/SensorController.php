<?php
class SensorController {
    public function index() {
        $pageTitle = "Sensor Thresholds";
        $currentPage = 'sensors';
        require 'views/sensors.php';
    }
}
