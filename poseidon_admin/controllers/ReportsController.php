<?php

class ReportsController {
  public function index() {
    // sidebar expects this key
    $currentPage = 'fishpond-reports';

    $interval = isset($_GET['interval']) ? $_GET['interval'] : 'daily';
    if (!in_array($interval, ['daily', 'monthly', 'yearly'])) {
      $interval = 'daily';
    }

    require 'views/fishpond-reports.php';
  }
}
