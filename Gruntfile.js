//
// Gruntfile
//
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
                    'media/css/style.css': 'media/less/style.less'
                }
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
    grunt.task.registerTask('default', ['bower', 'less']);
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
