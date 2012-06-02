all: lint

lint:
	jshint *.js
	jshint media/js/*.js
