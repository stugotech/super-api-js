import QueryOptions, { FilterSpec } from './QueryOptions';
import Resource from './Resource';
import { ResourceUrlGenerator, DefaultResourceUrlGenerator } from './ResourceUrlGenerator';
import { SuperApi, SuperApiResourceCollection } from './SuperApi';


export default class SuperApiClient implements SuperApi {
  urlGenerator: ResourceUrlGenerator;
  auth: string;

  constructor(public baseUrl: string, urlGenerator: ResourceUrlGenerator = null) {
    this.urlGenerator = urlGenerator || new DefaultResourceUrlGenerator(baseUrl);
  }

  resource(name: string): SuperApiResourceCollection {
    return {
      list: this.list.bind(this, name),
      get: this.get.bind(this, name),
      create: this.create.bind(this, name),
      replace: this.replace.bind(this, name),
      update: this.update.bind(this, name),
      delete: this.delete.bind(this, name)
    };
  }

  private url(name: string, id?, queryOptions?: QueryOptions) {
    return this.urlGenerator.generateUrl(name, queryOptions, null, id);
  }

  list(name: string, queryOptions?: QueryOptions) {
    return this.request('GET', this.url(name, queryOptions));
  }

  get(name: string, id, queryOptions?: QueryOptions) {
    return this.request('GET', this.url(name, id, queryOptions));
  }

  create(name: string, attributes) {
    return this.request('POST', this.url(name), {attributes});
  }

  replace(name: string, id, attributes) {
    return this.request('PUT', this.url(name, id), {attributes});
  }

  update(name: string, id, attributes) {
    return this.request('PATCH', this.url(name, id), {attributes});
  }

  delete(name: string, id) {
    return this.request('DELETE', this.url(name, id));
  }

  request(method: string, url: string, data=null): PromiseLike<Resource> {
    throw new Error('not implemented');
  }
};
