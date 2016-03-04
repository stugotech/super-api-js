
export default class NotAuthenticatedError extends Error {
  constructor(message='You are not authenticated: please authenticate and try again.') {
    super(message);
    this.status = 401;
  }
};
