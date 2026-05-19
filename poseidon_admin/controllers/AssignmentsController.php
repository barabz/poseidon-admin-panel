<?php

class AssignmentsController {
    public function index() {
        $currentPage = 'assignments';
        require 'views/assignments.php';
    }
}