module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                
            },
            target: {
                files: {
                    'build/deepselect.min.js': ['src/*.js']
                }
            }
        },
        banner: ''
            + '/**\n'
            + ' * Configurable deep sub-select maker\n'
            + ' * Not requires jQuery or other libs\n'
            + ' * @author Sergey Sedyshev\n'
            + ' * @see repository https://github.com/io-developer/deepselect.js\n'
            + ' * @see find more on github https://github.com/io-developer\n'
            + ' * @build <%= grunt.template.today("yyyy-mm-dd") %>\n'
            + ' */\n',
        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: [
                        'build/*.js',
                        'build/*.css'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-banner');

    grunt.registerTask('default', ['uglify', 'usebanner']);
};