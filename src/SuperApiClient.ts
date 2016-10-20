import QueryOptions, { FilterSpec } from './QueryOptions';
import Resource from './Resource';
import { ResourceFormat, DefaultResourceFormat } from './ResourceFormat';
import { SuperApi, SuperApiResourceCollection } from './SuperApi';
import 'isomorphic-fetch';


export default class SuperApiClient implements SuperApi {
  resourceFormat: ResourceFormat;
  auth: string;

  constructor(public baseUrl: string, urlGenerator: ResourceFormat = null) {
    this.resourceFormat = urlGenerator || new DefaultResourceFormat(baseUrl);
  }

  resource(name: string): SuperApiResourceCollection {
    return {
      parent: this,
      list: this.list.bind(this, name),
      get: this.get.bind(this, name),
      create: this.create.bind(this, name),
      replace: this.replace.bind(this, name),
      update: this.update.bind(this, name),
      delete: this.delete.bind(this, name)
    };
  }

  private url(name: string, id?, queryOptions?: QueryOptions) {
    return this.resourceFormat.getUrl(name, queryOptions, null, id);
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
    let headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (this.auth) {
      headers['Authentication'] = this.auth;
    }

    let request: RequestInit = {
      method,
      headers
    };

    if (data) {
      request.body = JSON.stringify(data);
    }

    return fetch(url, request)
      .then((response) => response.json())
      .then((data) => {
        return new Resource(this).set(data);
      });
  }
};
