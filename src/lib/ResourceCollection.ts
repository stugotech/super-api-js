import QueryOptions from './QueryOptions';
import Resource from './Resource';


export interface ResourceCollection {
  list(queryOptions?: QueryOptions): PromiseLike<Resource>;

  get(id, queryOptions?: QueryOptions): PromiseLike<Resource>;

  create(attributes): PromiseLike<Resource>;

  replace(id, attributes): PromiseLike<Resource>;

  update(id, attributes): PromiseLike<Resource>;

  delete(id): PromiseLike<Resource>;
};
