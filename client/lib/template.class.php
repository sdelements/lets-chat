<?php

class Template {

	private $_vars;
	
	public function __construct() {
		$this->_vars = array();
		// Template global variables
		$this->_vars['media_url'] = URL_MEDIA;
		$this->_vars['minify_url'] = URL_MINIFY;
		$this->_vars['site_title'] = SITE_TITLE;
		$this->_vars['site_url'] = SITE_URL;
		$this->_vars['template_dir'] = PATH_ROOT  . '/template';
		$this->_vars['js_template_dir'] = PATH_ROOT . '/template/js';
		$this->_vars['css_template_dir'] = PATH_ROOT  . '/template/css';
	}
	
	public function load($tpl_name) {
		include $this->_vars['template_dir'] . "/$tpl_name.php";
	}
	
	// We can use the js/css methods to automagically minify stuff later on
	public function load_js($tpl_name) {
		include $this->_vars['js_template_dir'] . "/$tpl_name.js.php";
	}
	
	public function load_css($tpl_name) {
		include $this->_vars['css_template_dir'] . "/$tpl_name.css.php";
	}

	/*
		named kinda bad.. This basically loads the file in the current scope (so variables work), but returns instead of including..
	*/
	public function get_load($tpl_name) {
		ob_start();
		include "template/$tpl_name.php";
		return ob_get_clean();
	}
	
	public function set($var, $val) {
		$this->_vars[$var] = $val;
	}
	
	public function get($var) {
		if(substr($var, 0, 8) == 'session.') {
			return isset($_SESSION[substr($var, 8)]) ? $_SESSION[substr($var, 8)] : false;
		} else {
			return isset($this->_vars[$var]) ? $this->_vars[$var] : false;
		}
	}
	
	public function put($var) {
		echo htmlspecialchars($this->get($var));
	}
	
	public function number_format($var) {
		echo htmlspecialchars(number_format($this->get($var)));
	}
	
}