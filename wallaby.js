
module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts'
    ],

    tests: [
      'test/**/*.ts'
    ],

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({module: 'commonjs'}) 
    },

    testFramework: 'ava',

    env: {
      type: 'node'
    }
  }
};

