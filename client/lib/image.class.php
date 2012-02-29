<?php

class Image {
	private $_image, $_ext, $_file;
	
	public $valid = false;
	
	const
		CENTER = 0,
		CENTER_LEFT = 1,
		CENTER_RIGHT = 2,
		TOP_CENTER = 3,
		TOP_LEFT = 4,
		TOP_RIGHT = 5,
		BOTTOM_CENTER = 6,
		BOTTOM_LEFT = 7,
		BOTTOM_RIGHT = 8;
	
	public function __construct($im=NULL)
	{	
		if(empty($im))
			return true;
		$info = @getimagesize($im);
		if(!$info)
		{
			$this->valid = false;
			//$this->throw_error("'$im' is not a valid image resource");
		}
		else
		{
			$this->_ext = end(explode('/', $info['mime']));
			$func = 'imagecreatefrom' . $this->_ext;
			$this->_image = @$func($im);
			$this->valid = true;
			//return $this->_file = $im;
		}
	}
	
	public function set($im)
	{
		$info = @getimagesize($this->_file);
		if(!$info)
			$this->throw_error("'$im' is not a valid image resource");
		$this->_ext = end(explode('/', $info['mime']));
		$func = 'imagecreatefrom' . $this->_ext;
		$this->_image = @$func($im);
		return $this->_file = $im;
	}
	
	public function resize($width, $height, $proportional=FALSE, $percent=NULL, $max=NULL)
	{
		if(empty($this->_image)) 
			$this->throw_error('Invalid call to Image()->resize, no image is set');
		$info = Array(imagesx($this->_image), imagesy($this->_image));
		if($proportional)
		{
			if(!empty($percent))
			{
				$new_width = $info[0] * ($percent/100);
				$new_height = $info[1] * ($percent/100);
			}
			else if(!empty($max))
			{
				if($info[0] < $max && $info[1] < $max)
					return false;
				$new_width = ($info[0] > $info[1]) ? $max : ($info[0]/$info[1]) * $max;
				$new_height = ($info[0] > $info[1]) ? ($info[1]/$info[0]) * $max : $max;
			}
			else
			{
				if(!empty($width) && !empty($height) || empty($width) && empty($height))
					return false;
				$new_width = (!empty($width)) ? $width : $height/$info[1]*$info[0];
				$new_height = (!empty($height)) ? $height : $width/$info[0]*$info[1];
			}
		}
		else
		{
			$new_width = $width;
			$new_height = $height;
		}
		$new_image = imagecreatetruecolor($new_width, $new_height);
		imagecopyresampled($new_image, $this->_image, 0, 0, 0, 0, $new_width, $new_height, $info[0], $info[1]);
		return $this->_image = $new_image;
	}
	
	public function crop($width, $height, $x, $y, $position=NULL, $pad = false)
	{
		if(empty($this->_image))
			$this->throw_error('Invalid call to Image()->crop, no image is set');
		$info = Array(imagesx($this->_image), imagesy($this->_image));
		if(($width > $info[0] || $height > $info[1]) && !$pad)
			return false;
		switch($position)
		{
			case Image::CENTER:
				$x = ($info[0] - $width)/2;
				$y = ($info[1] - $height)/2;
			break;
			case Image::CENTER_LEFT:
				$x = 0;
				$y = ($info[1] - $height)/2;
			break;
			case Image::CENTER_RIGHT:
				$x = ($info[0] - $height);
				$y = ($info[1] - $height)/2;
			break;
			case Image::TOP_CENTER:
				$x = ($info[0] - $width)/2;
				$y = 0;
			break;
			case Image::TOP_LEFT:
				$x = 0;
				$y = 0;
			break;
			case Image::TOP_RIGHT:
				$x = ($info[0] - $width);
				$y = 0;
			break;
			case Image::BOTTOM_CENTER:
				$x = ($info[0] - $width)/2;
				$y = ($info[1] - $height);
			break;
			case Image::BOTTOM_LEFT:
				$x = 0;
				$y = ($info[1] - $height);
			break;
			case Image::BOTTOM_RIGHT:
				$x = ($info[0] - $width);
				$y = ($info[1] - $height);
			break;
			default:
			break;
		}
		$new_image = imagecreatetruecolor($width, $height);
		imagecopyresampled($new_image, $this->_image, 0, 0, $x, $y, $width, $height, $width, $height);
		return $this->_image = $new_image;
	}
	
	public function watermark($wm, $position=NULL, $alpha=50)
	{
		if(empty($this->_image))
			$this->throw_error('Invalid call to Image()->crop, no image is set');
		$info = @getimagesize($wm);
		if(!$info)
			$this->throw_error("'$wm' (watermark) is not a valid image resource");
		elseif(end(explode('/', $info['mime'])) != $this->_ext)
			$this->throw_error("The watermark must have the same mime type as the base image");
		$func = 'imagecreatefrom' . end(explode('/', $info['mime']));
		$wmr = $func($wm);
		$info = Array(imagesx($this->_image), imagesy($this->_image));
		$wm_info = Array(imagesx($wmr), imagesy($wmr));
		switch($position)
		{
			case Image::CENTER:
				$x = ($info[0] - $wm_info[0]) / 2;
				$y = ($info[1] - $wm_info[1]) / 2;
			break;
			case Image::CENTER_LEFT:
				$x = 0;
				$y = ($info[1] - $wm_info[1]) / 2;
			break;
			case Image::CENTER_RIGHT:
				$x = $info[0] - $wm_info[1];
				$y = ($info[1] - $wm_info[1]) / 2;
			break;
			case Image::TOP_CENTER:
				$x = ($info[0] - $wm_info[0]) / 2;
				$y = 0;
			break;
			case Image::TOP_LEFT:
				$x = 0;
				$y = 0;
			break;
			case Image::TOP_RIGHT:
				$x = ($info[0] - $wm_info[0]);
				$y = 0;
			break;
			case Image::BOTTOM_CENTER:
				$x = ($info[0] - $wm_info[0]) / 2;
				$y = ($info[1] - $wm_info[1]);
			break;
			case Image::BOTTOM_LEFT:
				$x = 0;
				$y = ($info[1] - $wm_info[1]);
			break;
			case Image::BOTTOM_RIGHT:
				$x = ($info[0] - $wm_info[0]);
				$y = ($info[1] - $wm_info[1]);
			break;
			default:
				$x = ($info[0] - $wm_info[0]);
				$y = ($info[1] - $wm_info[1]);
			break;
		}
		return imagecopymerge($this->_image, $wmr, $x, $y, 0, 0, $wm_info[0], $wm_info[1], $alpha);
	}
	
	public function save($loc, $compression=100)
	{
		if(empty($this->_image)) {
			$this->throw_error('Invalid call to Image()->save, no image is set');
		}
		$quality = 0;
		switch($this->_ext) {
			case 'gif': break;
			case 'jpeg': $quality = $compression; break;
			case 'png': $quality = ($compression == 0) ? 9 : 9 - round(($compression-10)/10); break;
		}
		$func = 'image' . $this->_ext;
		if($this->_ext == 'gif') {
			return $func($this->_image, $loc);
		} else {
			return $func($this->_image, $loc, $quality);
		}
	}
	
	public function output()
	{
		if(empty($this->_image)) 
			$this->throw_error('Invalid call to Image()->output, no image is set');
		header('Content-type: image/' . $this->_ext);
		$func = 'image' . $this->_ext;
		$func($this->_image);
	}
	
	public function get_width() {
		return imagesx($this->_image);
	}
	
	public function get_height() {
		return imagesy($this->_image);
	}
	
	private function throw_error($err)
	{
		$backtrace = debug_backtrace();
			die('<b>Fatal error:</b> ' . $err . ' <b>on line ' . $backtrace[1]['line'] . ' [' . $backtrace[1]['file'] . ']</b>');
	}
}