
export default class BadRequestError extends Error {
  constructor(message='The request is malformed.') {
    super(message);
    this.status = 400;
  }
};
