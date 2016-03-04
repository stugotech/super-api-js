
export default class NotAuthorisedError extends Error {
  constructor(message='You are not authorised to access this resource.') {
    super(message);
    this.status = 403;
  }
};
