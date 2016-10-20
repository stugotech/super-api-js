import QueryOptions from './QueryOptions';
import Resource from './Resource';
import { ResourceFormat } from './ResourceFormat';


export interface SuperApi {
  resourceFormat: ResourceFormat;

  resource(name: string): SuperApiResourceCollection;
};


export interface SuperApiResourceCollection {
  parent: SuperApi;

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

export * from './ResourceFormat';

export * from './SuperApiClient';

export * from './SuperApiServer';
