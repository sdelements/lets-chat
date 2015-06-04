;(function (root, factory) {
	'use strict';

	if (typeof define === "function" && define.amd) {
		define(factory)
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory()
	} else {
		root.CryptoJS = factory()
	}

}(this, function () {
	'use strict';
