module.exports = function(grunt) {
    grunt.initConfig({
        jekyll: {
            main: {
                options: {
                    src: '.',
                    dest: '_site',
                    watch: true,
                    serve: true
                }
            }
        },
        less: {
            main: {
                files: {
                    'assets/css/style.css': 'assets/less/style.less'
                }
            }
        },
        watch: {
            options: {
                spawn: false, 
            },
            main: {
                files: ['assets/less/**/*'],
                tasks: ['less']
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            main: {
                tasks: ['jekyll', 'watch']
            }
        }
    });
    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['concurrent:main']);
}