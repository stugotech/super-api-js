import * as _ from 'lodash';
import { SuperApi, SuperApiResourceCollection } from './SuperApi';
import { ResourceFormat, DefaultResourceFormat } from './ResourceFormat';
import { NotFoundError } from 'http-status-errors';

export type SuperApiService = _.Dictionary<SuperApiResourceCollection>;


export default class SuperApiServer implements SuperApi {
  resourceFormat: ResourceFormat;

  constructor(public baseUrl: string, private resources: SuperApiService, urlGenerator: ResourceFormat = null) {
    this.resourceFormat = urlGenerator || new DefaultResourceFormat(baseUrl);

    for (let k in resources) {
      resources[k].parent = this;
    }
  }

  resource(type: string): SuperApiResourceCollection {
    if (!_.has(this.resources, type)) {
      throw new NotFoundError(`type ${type} not found`);

    } else {
      return this.resources[type];
    }
  }
};
