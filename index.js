
module.exports = {
  Resource: require('./dist/Resource')['default'],
  ResourceClient: require('./dist/ResourceClient')['default'],
  QueryStringParser: require('./dist/QueryStringParser')['default'],
  SereneRequest: require('./dist/SereneRequest')['default'],
  querystringify: require('./dist/QueryStringParser')['querystringify']
};
