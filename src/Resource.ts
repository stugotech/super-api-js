import * as _ from 'lodash';
import QueryOptions, { FilterSpec, PageSpec } from './QueryOptions';
import { ResourceFormat, DefaultResourceFormat } from './ResourceFormat';
import { SuperApi } from './SuperApi';
import SuperApiClient from './SuperApiClient';


export interface ResourceJson {
  links: ResourceLinks;
  attributes?: any;
  elements?: ResourceJson[];
  includes?: ResourceJson[];
  meta?: any;
};


export interface ResourceData {
  links?: _.Dictionary<Relationship | string>;
  attributes?: any;
  elements?: (ResourceData | Resource)[];
  includes?: (ResourceData | Resource)[];
  meta?: any;
};


export interface ResourceLinks {
  $self: string;
  $previous?: string;
  $next?: string;
  $first?: string;
  $last?: string;
  [id: string]: string | RelationshipLink;
};


/**
 * 
 */
export class Relationship {
  constructor(public sourceKey: string, public destKey: string, public resource: string,
    public discard: boolean) {

  }
};


export class RelationshipLink {
  single: boolean;

  constructor(private resourceFormat: ResourceFormat, public relationship: Relationship, public id) {
    this.single = resourceFormat.getIdKey(relationship.resource) === relationship.destKey;
  }

  toString() {
    return this.resourceFormat.getUrl(this.relationship.resource, new QueryOptions({filter: {
      [this.relationship.sourceKey]: this.id
    }}));
  }
};

export type PagingInfo = {count: number, exists?: boolean};



export default class Resource {
  private json: ResourceJson;
  private resourceFormat?: ResourceFormat;
  private includedResources: _.Dictionary<Resource>;

  constructor(private superApiClient?: SuperApi, public type?: string, public queryOptions?: QueryOptions) {
    if (superApiClient) {
      this.resourceFormat = superApiClient.resourceFormat;
    }
  }


  set(data: ResourceData, pagingInfo?: PagingInfo) {
    this.json = _.merge(
      {
        links: this.getLinks(data),
        attributes: this.getAttributes(data),
        elements: this.getElements(data),
        includes: this.getIncludes(data),
        meta: data.meta
      },
      this.getPagingData(data, pagingInfo)
    );

    return this;
  }


  setIncludedResources() {
    if (this.queryOptions && this.queryOptions.include()) {
      let include = this.queryOptions.include();
      let relationships = _.pick(this.json.links, include);

      let promisedResources = _
        .values(relationships)
        .map((link: RelationshipLink) => {
          let options = _.pick(this.queryOptions.qs, ['include', 'fields']);

          if (link.single) {
            return this.superApiClient
              .resource(link.relationship.resource)
              .get(link.id, new QueryOptions(options));

          } else {
            return this.superApiClient
              .resource(link.relationship.resource)
              .list(new QueryOptions(options));
          }
        });

      if (this.json.elements && this.json.elements.length) {
        [].push.apply(
          promisedResources,
          _.flatMap(
            this.json.elements,
            (element) => new Resource(this.superApiClient)
              .set(<ResourceData>element)
              .setIncludedResources()
              .then((resource) => {
                let includes = resource.json.includes;
                delete resource.json.includes;
                return includes;
              })
          )
        );
      }

      return Promise.all(promisedResources)
        .then((resources) => {
          let includes = this.getIncludes({includes: resources});

          if (!this.json.includes) {
            this.json.includes = includes;

          } else {
            [].push.apply(this.json.includes, includes);
          }
          
          return this;
        });
    } else {
      return Promise.resolve(this);
    }
  }


  toJSON(): ResourceJson {
    // don't return nulls, undefineds or empty objects
    let json = <ResourceJson>_.pickBy(
      this.json,
      (x) => (x != null) && (typeof x !== 'object' || Object.keys(x).length > 0)
    );
    
    json.links = <ResourceLinks> _.mapValues(json.links, (link) => link.toString());

    return json;
  }


  /**
   * Gets a promise for a named relation defined in the `links` field.
   */
  getRelation(name: string): PromiseLike<Resource> {
    if (this.includedResources && this.json.links && this.json.links[name]) {
      return Promise.resolve(this.includedResources[this.json.links[name].toString()] || null);

    } else if (this.json.links[name]) {
      let url = this.json.links[name].toString();
      let key = this.resourceFormat.getResourceKey(url);
      
      if (typeof key.id !== 'undefined') {
        return this.superApiClient.resource(key.type).get(key.id);

      } else {
        return this.superApiClient.resource(key.type).list();
      }

    } else {
      return Promise.resolve(null);
    }
  }


  private getAttributes(data: ResourceData) {
    if (data.attributes) { 
      if (data.links) {
        let links = _.values(data.links);

        return _.omit(
          data.attributes,

          _.filter(links, (x) => x instanceof Relationship && x.discard)
            .map((x) => (<Relationship>x).sourceKey)
        );
      } else {
        return data.attributes;
      }
      
    } else {
      return null;
    }
  }

  private getElements(data: ResourceData) {
    if (data.elements) {
      let includes = [];

      let elements = data.elements.map((element) => {
        if (element instanceof Resource) {
          return element.toJSON();

        } else {
          let elementResource = new Resource(this.superApiClient, this.type, this.queryOptions)
            .set(_.merge({}, element, {links: data.links}))
            .toJSON();

          if (elementResource.includes) {
            [].push.apply(includes, elementResource.includes);
            delete elementResource.includes;
          }

          return elementResource;
        }
      });

      if (includes.length) {
        if (!data.includes) {
          data.includes = includes;
        } else {
          [].push.apply(data.includes, includes);
        }
      }
      
      return elements;

    } else {
      return null;
    }
  }

  private getIncludes(data: ResourceData) {
    if (data.includes) {
      this.includedResources = {};

      return data.includes.map((includes) => {
        if (!(includes instanceof Resource)) {
          includes = new Resource(
              this.superApiClient,
              this.type,
              new QueryOptions(_.pick(this.queryOptions.qs, ['include', 'fields']), this.queryOptions.options)
            )
            .set(includes);
        }

        let _includes = <Resource>includes;
        this.includedResources[_includes.json.links.$self] = _includes;
        return _includes.toJSON();
      });

    } else {
      return null;
    }
  }


  private getLinks(data: ResourceData) {
    let links: ResourceLinks = {
      $self: this.resourceFormat.getUrl(this.type, this.queryOptions, data.attributes)
    };

    for (let k in data.links) {
      let link = data.links[k];

      if (link instanceof Relationship) {
        if (data.attributes && data.attributes[link.sourceKey] != null) {
          links[k] = new RelationshipLink(
            this.resourceFormat,
            link,
            data.attributes[link.sourceKey]
          );
        }

      } else {
        links[k] = _.template(link)(data.attributes);
      }
    }

    return links;
  }


  private getPagingData(data: ResourceData, info?: PagingInfo) {
    let page = this.queryOptions && this.queryOptions.page();
    let links: _.Dictionary<string> = {};
    let meta;

    if (page && info) {
      let pageCount = Math.ceil(info.count / page.size);
      meta = {count: info.count, page: {size: page.size, count: pageCount}};

      switch (page.method) {
        case 'number':
          links['$first'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {number: 1}}));
          links['$last'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {number: pageCount}}));

          if (page.number > 1) {
            links['$previous'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {number: page.number - 1}}));
          }

          if (page.number < pageCount) {
            links['$next'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {number: page.number + 1}}));
          }

          meta.page.number = page.number;
          break;

        case 'offset':
          links['$first'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {offset: 0}}));
          links['$last'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {offset: (pageCount - 1) * page.size}}));

          if (page.offset > 0) {
            links['$previous'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {
              offset: Math.max(0, page.offset - page.size)
            }}));
          }

          if (page.offset < info.count - page.size) {
            links['$next'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {offset: page.offset + page.size}}));
          }

          meta.page.offset = page.offset;
          break;

        case 'after':
          let prev = false, next = false;

          if (data.elements.length) {
            if (page.reverse) {
              prev = info.exists;
              next = typeof page.after !== 'undefined';

            } else {
              prev = typeof page.after !== 'undefined';
              next = info.exists;
            }
          }

          links['$first'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {after: ''}}));
          links['$last'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {before: ''}}));

          if (prev) {
            links['$previous'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {
              before: data.elements[0][page.field]
            }}));
          }

          if (next) {
            links['$next'] = this.resourceFormat.getUrl(this.type, new QueryOptions({page: {
              after: data.elements[data.elements.length - 1][page.field]
            }}));
          }

          meta.page.after = page.after;
          break;
      }
    }

    return {
      links,
      meta
    };
  }
};
