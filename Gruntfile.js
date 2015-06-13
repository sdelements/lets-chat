//
// Gruntfile
//

'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    install: true,
                    cleanTargetDir: true,
                    verbose: true,
                    targetDir: 'media/js/vendor',
                    layout: 'byComponent'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-bower-task');
};
