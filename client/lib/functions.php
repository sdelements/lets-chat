<?php

function excerpt($string, $length = 10, $append = '...') {
	if(strlen($string) > $length) {
		$string = substr($string, 0, $length) . $append;
	}
	return htmlspecialchars($string);
}

function put($var) {
	echo htmlspecialchars($var);
}

function ago($timestamp) {
	if (!$timestamp) {
		return 'not sure';
	}
    $etime = time() - $timestamp;
    if ($etime < 1) {
        return 'moments ago';
    }
    $a = array( 12 * 30 * 24 * 60 * 60  =>  'year',
                30 * 24 * 60 * 60       =>  'month',
                24 * 60 * 60            =>  'day',
                60 * 59                 =>  'hour',
                60                      =>  'minute',
                1                       =>  'second'
                );
    foreach ($a as $secs => $str) {
        $d = $etime / $secs;
        if ($d >= 1) {
            $r = round($d);
            return $r . ' ' . $str . ($r > 1 ? 's' : '') . ' ago';
        }
    }
}