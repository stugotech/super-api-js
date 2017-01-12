import * as _ from 'lodash';
import QueryOptions from './QueryOptions';


export interface ResourceJson {
  links: ResourceLinks;
  attributes?: any;
  elements?: ResourceJson[];
  includes?: ResourceJson[];
  meta?: any;
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


export interface ResourceCollection {
  list(queryOptions?: QueryOptions): PromiseLike<Resource>;

  get(id, queryOptions?: QueryOptions): PromiseLike<Resource>;

  create(body): PromiseLike<Resource>;

  replace(id, body): PromiseLike<Resource>;

  update(id, body): PromiseLike<Resource>;

  delete(id): PromiseLike<Resource>;
};


export default class Resource {
  attributes;
  elements: Resource[];
  links: ResourceLinks;
  includes: Resource[];
  meta;


  constructor(json: ResourceJson);
  constructor(url: string, contents?);
  constructor(json: ResourceJson | string, contents?) {
    if (typeof json === 'string') {
      this.links = {$self: _.template(json)(contents)};

      if (Array.isArray(contents)) {
        this.elements = contents;
      } else {
        this.attributes = contents;
      }

    } else {
      this.attributes = json.attributes;
      this.meta = json.meta;
      this.links = json.links;

      this.mapElements('elements', json);
      this.mapElements('includes', json);
    }
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
  }


  addLink(name: string, link: string) {
    this.links[name] = _.template(link)(this.attributes);
  }


  async toObject(include: string[], fetcher: ResourceFetcher) {
    let resources = await Promise.all(
      include
        .map((link) => fetcher.fetch(this.links[link]))
    );

    return {
      ...this.attributes,
      ..._.zipObject(include, resources)
    };
  }


  async toArray(include: string[], fetcher: ResourceFetcher) {
    return await Promise.all(
      this.elements.map((element) => element.toObject(include, fetcher))
    );
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
};
