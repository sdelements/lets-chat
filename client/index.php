<?php

include 'configuration.php';
include 'lib/functions.php';
include 'lib/template.class.php';

session_start();

// $mysqli = new MySQLi(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_SCHEMA);

$tpl = new Template();

// Ghetto routing

$raw_parts = explode('/', (isset($_GET['url']) ? $_GET['url'] : ''));

switch($raw_parts[0]) {
	case '':
		$tpl->set('page_title', 'Chat');
		$tpl->load('chat');
		break;
	default:
		$tpl->set('page_title', '404 - Not Found');
		header('HTTP/1.0 404 Not Found'); 
		$tpl->load('errors/404');
		break;
}