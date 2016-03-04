
export default class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
  }
};
