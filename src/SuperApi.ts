import QueryOptions from './QueryOptions';
import Resource from './Resource';
import { ResourceUrlGenerator } from './ResourceUrlGenerator';


export interface SuperApi {
  urlGenerator: ResourceUrlGenerator;

  resource(name: string): SuperApiResourceCollection;

  request(method: string, url: string, data?): PromiseLike<Resource>;
};


export interface SuperApiResourceCollection {
  list(queryOptions?: QueryOptions): PromiseLike<Resource>;

  get(id, queryOptions?: QueryOptions): PromiseLike<Resource>;

  create(attributes): PromiseLike<Resource>;

  replace(id, attributes): PromiseLike<Resource>;

  update(id, attributes): PromiseLike<Resource>;

  delete(id): PromiseLike<Resource>;
};


export * from './QueryOptions';
export {default as QueryOptions} from './QueryOptions';

export * from './Resource';
export {default as Resource} from './Resource';

export * from './ResourceUrlGenerator';
