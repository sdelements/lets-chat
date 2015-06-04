
	// This provides backwards compatibility with CryptoJS 3.0.2
	// CryptoJS.enc.Base64.parse used to do this by default.
	var _base64Parse = CryptoJS.enc.Base64.parse
	CryptoJS.enc.Base64.parse = function (base64Str) {
		return _base64Parse.call(CryptoJS.enc.Base64, base64Str.replace(/\s/g, ''))
	}

	return CryptoJS

}))