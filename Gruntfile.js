
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    babel: {
      dist: {
        files: [{
          expand: true,
          flatten: true,
          src: ['src/lib/*.js'],
          dest: 'dist/lib'
        }]
      }
    }
  });

  grunt.registerTask('default', ['babel']);
};
