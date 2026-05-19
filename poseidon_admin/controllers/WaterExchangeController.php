<?php
class WaterExchangeController {
    public function index() {
        $pageTitle = "Water Exchange Control";
        $currentPage = 'water-exchange';
        require 'views/water-exchange.php';
    }

    // New page: Register Water Exchange Device (no modal)
    public function register() {
        $pageTitle = "Register Water Exchange Device";
        // Keep IoT dropdown expanded + Water Exchange highlighted
        $currentPage = 'water-exchange';
        require 'views/water-exchange-register.php';
    }
}
