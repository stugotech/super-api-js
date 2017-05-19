import * as _ from 'lodash';
import QueryOptions from './QueryOptions';

export interface PageInfo {
  number: number;
  size: number;
  count: number;
};


export interface ResourceMeta extends _.Dictionary<any> {
  page?: PageInfo;
  count?: number;
};


export interface ResourceJson {
  links?: ResourceLinks;
  attributes?: any;
  elements?: ResourceJson[];
  includes?: ResourceJson[];
  meta?: ResourceMeta;
  error?: ResourceErrorJson;
};


export interface ResourceLinks extends _.Dictionary<string> {
  $self: string;
  $previous?: string;
  $next?: string;
  $first?: string;
  $last?: string;
};


export interface ResourceFetcher {
  fetch(url: string): PromiseLike<Resource>
};


export interface ResourcePage<T> {
  elements: T[];
  count: number;
  page: PageInfo;
};


export interface ResourceErrorJson {
  name: string;
  message: string;
  status?: number;
};


export class ResourceError extends Error {
  status: number;

  constructor(error: ResourceErrorJson) {
    super(error.message);
    this.name = error.name;
    this.status = error.status;
  }
};


export default class Resource {
  attributes;
  elements: Resource[];
  links: ResourceLinks;
  includes: Resource[];
  includesMap: _.Dictionary<Resource>;
  meta: ResourceMeta;
  status: number;
  error: ResourceErrorJson;


  constructor(json: ResourceJson, status?: number);
  constructor(url: string, contents?, meta?: ResourceMeta);
  constructor(json: ResourceJson | string, contents?, meta?: ResourceMeta) {
    if (typeof json === 'string') {
      this.links = {$self: _.template(json)(contents)};

      if (Array.isArray(contents)) {
        this.elements = contents;
      } else {
        this.attributes = contents;
      }

      if (meta) {
        this.meta = meta;
      }

    } else {
      this.attributes = json.attributes;
      this.meta = json.meta;
      this.links = json.links;
      this.status = contents;
      this.error = json.error;

      this.mapElements('elements', json);
      this.mapElements('includes', json);
      this._refreshIncludeMap();
    }
  }


  private _refreshIncludeMap() {
    this.includesMap = _.mapValues(_.groupBy(this.includes, (resource) => resource.links.$self), (list) => list[0]);
  }


  private mapElements(property: 'elements' | 'includes', json: ResourceJson) {
    if (json[property]) {
      this[property] = json[property].map((element) => new Resource(element))
    }
  }


  getIncludedLinks(include: string[], links: Set<string> = new Set<string>()): Set<string> {
    _(this.links)
      .pick(include)
      .values()
      .forEach((link: string) => links.add(link));

    if (this.elements) {
      this.elements.forEach((element) => element.getIncludedLinks(include, links));
    }
      
    return links;
  }


  addLinks(links: _.Dictionary<string>) {
    for (let k in links) {
      this.addLink(k, links[k]);
    }
    return this;
  }


  addLink(name: string, link: string) {
    this.links[name] = _.template(link)(this.attributes);
    return this;
  }


  toError() {
    return this.error
      ? new ResourceError(this.error)
      : null;
  }


  async toObject<T>(include: string[], fetcher: ResourceFetcher): Promise<T> {
    if (this.error)
      throw this.toError();

    const links = _.intersection(include, Object.keys(this.links));

    const resources = await Promise.all(
      links
        .map(async (link) => {
          const url = this.links[link];
          const resource: Resource = this.includesMap[url] || await fetcher.fetch(url);
          return resource.toObjectOrArray(include, fetcher);
        })
    );

    return {
      ...this.attributes,
      ..._.zipObject(links, resources)
    };
  }


  toArray<T>(include: string[], fetcher: ResourceFetcher): Promise<T[]> {
    if (this.error)
      throw this.toError();
    
    return this.elements 
      ? Promise.all(
        this.elements.map((element) => element.toObject(include, fetcher))
      )
      : Promise.resolve([]);
  }


  async toPage<T>(include: string[], fetcher: ResourceFetcher): Promise<ResourcePage<T>> {
    return {
      elements: await this.toArray<T>(include, fetcher),
      count: this.meta.count,
      page: this.meta.page
    };
  }


  toObjectOrArray(include: string[], fetcher: ResourceFetcher) {
    if (this.attributes) {
      return this.toObject(include, fetcher);

    } else if (this.elements) {
      return this.toArray(include, fetcher);

    } else {
      return null;
    }
  }


  toJSON() {
    let json: ResourceJson = {
      links: this.links
    };

    if (this.attributes)
      json.attributes = this.attributes;

    if (this.elements)
      json.elements = this.elements;

    if (this.meta != null)
      json.meta = this.meta;

    if (this.includes && this.includes.length)
      json.includes = this.includes;

    return json;
  }


  flatten() {
    let includes = {};
    this._flatten(includes);

    if (!this.includes)
      this.includes = [];
    
    this.includes.push(..._.map(includes, (attributes, link) => new Resource(link, attributes)));
    this._refreshIncludeMap();
    return this;
  }


  private _flatten(includes: {[id: string]: Object}) {
    if (this.attributes) {
      let subAttributeNames = _.intersection(Object.keys(this.links), Object.keys(this.attributes));

      _.assign(includes, _.zipObject(
        _.values(_.pick(this.links, subAttributeNames)),
        _.values(_.pick(this.attributes, subAttributeNames))
      ));

      this.attributes = _.omit(this.attributes, subAttributeNames);
    }

    if (this.elements) {
      this.elements.forEach((element) => element._flatten(includes));
    }
  }
};
