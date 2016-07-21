
import QueryStringParser from './QueryStringParser';
import Resource from './Resource';
import {Request} from 'serene';


export default class SereneRequest extends Request {
  constructor(serene, operationName, resourceName, id) {
    super(serene, operationName, resourceName, id);
  }

  async dispatch() {
    if (!(this.query instanceof QueryStringParser))
      this.query = new QueryStringParser(this.query, SereneRequest.options);

    if (this.operationName !== 'delete') {
      this.response.result = new Resource(this.resourceName, this.baseUrl);
    }

    let response = await super.dispatch();

    if (this.resource && this.resource.relationships) {
      response.result = response.result
        .relationships(this.resource.relationships);

      let related = response.result.relatedResources();
      let includes = this.query.include();

      if (includes) {
        for (let url in related) {
          let {operation, resource, name, key} = related[url];

          if (includes.indexOf(name) > -1) {
            let request = this.subrequest(operation, resource, key);
            request.query.fields = this.query.qs.fields;

            let {result} = await request.dispatch();
            response.result = response.result.includes(result);
          }
        }
      }
    }

    return response;
  }
};


SereneRequest.options = {};
