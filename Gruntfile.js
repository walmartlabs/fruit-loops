/*global grunt */
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: [
        'lib/**/*.js',
        'test/**/*.js,!test/artifacts/*.js'
      ]
    },

    mochacov: {
      test: {
        options: {
          reporter: 'spec',
          grep: grunt.option('grep')
        }
      },
      cov: {
        options: {
          reporter: 'html-cov',
          output: 'cov.html'
        }
      },
      options: {
        require: ['./test/lib'],
        files: ['test/dom/*.js', 'test/exec/*.js', 'test/jquery/*.js', 'test/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('test', ['jshint', 'mochacov:test']);
  grunt.registerTask('cov', ['mochacov:cov']);
};
