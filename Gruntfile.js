//
// Gruntfile
//
var fs = require('fs'),
    yaml = require('js-yaml'),
    bundles = yaml.safeLoad(fs.readFileSync('bundles.yml', 'utf8'));

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
                    layout: 'byComponent',
                }
            }
        },
        less: {
            build: {
                files: {
                    'media/css/style.css': 'media/less/style.less',
                    'media/css/vendor.css': 'media/less/vendor.less'
                }
            }
        },
        concat: bundles,
        cssmin: {
            target: {
                files: Object.keys(bundles)
                            .filter(function(key) {
                                return key.indexOf('_css') > -1;
                            })
                            .map(function(key) {
                                return {
                                    src: bundles[key].dest,
                                    dest: bundles[key].dest
                                };
                            })
            }
        },
        uglify: {
            dist: {
                files: Object.keys(bundles)
                            .filter(function(key) {
                                return key.indexOf('_js') > -1;
                            })
                            .map(function(key) {
                                return {
                                    src: bundles[key].dest,
                                    dest: bundles[key].dest
                                };
                            })
            }
        },
        watch: {
            less: {
                files: ['media/less/**/*.less'],
                tasks: ['less'],
                options: {
                    atBegin: true,
                    spawn: false
                },
            },
        },
    });
    grunt.task.registerTask('build', ['concat', 'cssmin', 'uglify']);
    grunt.task.registerTask('default', ['watch']);
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
