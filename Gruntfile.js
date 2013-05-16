/*global grunt */
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        force: true
      },
      files: [
        'lib/**/*.js',
        'test/**/*.js'
      ]
    },

    mochacov: {
      test: {
        options: {
          reporter: 'spec'
        }
      },
      cov: {
        options: {
          reporter: 'html-cov'
        }
      },
      options: {
        require: ['./test/lib']
      },
      src: ['test/**/*.js,!test/artifacts/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('test', ['jshint', 'mochacov:test']);
  grunt.registerTask('cov', ['mochacov:cov']);
};
