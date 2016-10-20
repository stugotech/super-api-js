import QueryOptions, { FilterSpec, PageSpec } from './QueryOptions';
import escapeStringRegexp = require('escape-string-regexp');

/**
 * Provides methods for generating resource URLs and extracting certain information.
 */
export interface ResourceFormat {
  /**
   * Generate a URL for a resource.
   * @param attributes attributes of the resource to generate a link for
   * @param type the type of resource
   * @param id the ID of the resource
   * @param options any other query options
   */
  getUrl(type?: string, queryOptions?: QueryOptions, attributes?: _.Dictionary<string>, id?): string;

  /**
   * Gets the ID key for the specified type.
   */
  getIdKey(type: string);

  /**
   * Gets a resource key from a URL.
   */
  getResourceKey(url: string);
};


/**
 * A transport-independent locator for a resource.
 */
export interface ResourceKey {
  type: string;
  id?: any;
};


/**
 * Default implementation of ResourceFormat: assumes the ID key is called `id`,
 * and resources are to be found at `<baseUrl>/<type>/<id>`.
 */
export class DefaultResourceFormat implements ResourceFormat {
  private regex: RegExp;

  constructor(private baseUrl: string, private idKey: string = 'id') {
    this.regex = new RegExp('^' + escapeStringRegexp(baseUrl) + '/([^/]+)(/([^?]+))?(\\?.*)?$');
  }

  getUrl(type?: string, queryOptions?: QueryOptions, attributes?: _.Dictionary<any>, id?: any) {
    let url = this.baseUrl + '/' + type;
    let filter = queryOptions && queryOptions.filter();

    if (id == null) {
      if (filter && filter[this.idKey] != null) {
        id = filter[this.idKey];
        delete filter[this.idKey];

      } else if (attributes) {
        id = attributes[this.idKey];
      }
    }

    if (id != null) {
      url += '/' + id
    }

    return url + ((queryOptions && queryOptions.toString() || ''));
  }


  getIdKey(type: string) {
    return this.idKey;
  }


  getResourceKey(url: string): ResourceKey {
    let match = url.match(this.regex);

    if (match) {
      let key: ResourceKey = {type: match[1]};
      
      if (typeof match[3] !== 'undefined') {
        key.id = match[3];
      }

      return key;

    } else {
      throw new Error('not a valid resource URL');
    }
  }
};