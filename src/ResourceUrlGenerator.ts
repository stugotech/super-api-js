import QueryOptions, { FilterSpec, PageSpec } from './QueryOptions';

/**
 * Method of generating URLs for resources.
 */
export interface ResourceUrlGenerator {
  /**
   * Generate a URL for a resource.
   * @param attributes attributes of the resource to generate a link for
   * @param type the type of resource
   * @param id the ID of the resource
   * @param options any other query options
   */
  generateUrl(type?: string, queryOptions?: QueryOptions, attributes?: _.Dictionary<string>, id?): string;

  /**
   * Gets the ID key for the specified type.
   */
  getIdKey(type: string);
};


/**
 * Default implementation of ResourceUrlGenerator: assumes the ID key is called `id`,
 * and resources are to be found at `<baseUrl>/<type>/<id>`.
 */
export class DefaultResourceUrlGenerator implements ResourceUrlGenerator {
  constructor(private baseUrl: string, private idKey: string = 'id') {
  }

  generateUrl(type?: string, queryOptions?: QueryOptions, attributes?: _.Dictionary<any>, id?: any) {
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
};