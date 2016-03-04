
export default class NotFoundError extends Error {
  constructor(message='Resource not found.') {
    super(message);
    this.status = 404;
  }
};
