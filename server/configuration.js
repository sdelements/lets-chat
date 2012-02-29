function get(setting) {
	var settings = {
		port: 8111
	}
	return settings[setting];
}
module.exports.get = get;