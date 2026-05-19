<?php

class AccountsController {
    public function index() {
        $currentPage = 'accounts';
        require 'views/accounts.php';
    }
}
