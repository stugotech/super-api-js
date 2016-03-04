
module.exports = {
  Resource: require('./dist/Resource')['default'],
  QueryStringParser: require('./dist/QueryStringParser')['default'],

  BadRequestError: require('./dist/errors/BadRequestError')['default'],
  ConflictError: require('./dist/errors/ConflictError')['default'],
  NotAuthenticatedError: require('./dist/errors/NotAuthenticatedError')['default'],
  NotAuthorisedError: require('./dist/errors/NotAuthorisedError')['default'],
  NotFoundError: require('./dist/errors/NotFoundError')['default']
};
