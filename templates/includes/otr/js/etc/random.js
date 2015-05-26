if (typeof Otr === 'undefined') {
	Otr = function() {}
}

;(function (root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory({}, require('../lib/SeedGeneration.js'), true)
	} else {
		if (typeof root.Otr === 'undefined') {
			root.Otr = function () {}
		}
		factory(root.Otr, root.SeedGeneration, false)
	}
}(this, function (Otr, SeedGeneration, node) {
'use strict';

Otr.random = {}

var state

Otr.random.generateSeed = function() {
	var buffer, crypto
	// Node.js ... for tests
	if (typeof window === 'undefined' && typeof require !== 'undefined') {
		crypto = require('crypto')
		try {
			buffer = crypto.randomBytes(40)
		} catch (e) { throw e }
	}
	else {
		buffer = new Uint8Array(40)
		window.crypto.getRandomValues(buffer)
	}
	return buffer
}

Otr.random.setSeed = function(s) {
	if (!s) { return false }
	state = new SeedGeneration(
		[
			s[ 0],s[ 1],s[ 2],s[ 3],s[ 4],s[ 5],s[ 6],s[ 7],
			s[ 8],s[ 9],s[10],s[11],s[12],s[13],s[14],s[15],
			s[16],s[17],s[18],s[19],s[20],s[21],s[22],s[23],
			s[24],s[25],s[26],s[27],s[28],s[29],s[30],s[31]
		],
		[
			s[32],s[33],s[34],s[35],s[36],s[37],s[38],s[39]
		]
	)
}

Otr.random.getBytes = function(i) {
	if (i.constructor !== Number || i < 1) {
		throw new Error('Expecting a number greater than 0.')
	}
	return state.getBytes(i)
}

Otr.random.bitInt = function(k) {
	if (k > 31) {
		throw new Error('That\'s more than JS can handle.')
	}
	var i = 0, r = 0
	var b = Math.floor(k / 8)
	var mask = (1 << (k % 8)) - 1
	if (mask) {
		r = Otr.random.getBytes(1)[0] & mask
	}
	for (; i < b; i++) {
		r = (256 * r) + Otr.random.getBytes(1)[0]
	}
	return r
}

Otr.random.decimal = function() {
	var r = 250;
	while ( r > 249 ) {
		r = Otr.random.getBytes(1)[0]
	}
	return r % 10;
}

Otr.random.rawBytes = function(bytes) {
	var sa = String.fromCharCode.apply(null, Otr.random.getBytes(bytes))
	return CryptoJS.enc.Latin1.parse(sa)
}

Otr.random.encodedBytes = function(bytes, encoding) {
	return Otr.random.rawBytes(bytes).toString(encoding)
}

if (node) {
	// Seed RNG in tests.
	Otr.random.setSeed(Otr.random.generateSeed())
}

return Otr

}))
