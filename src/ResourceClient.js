
import _ from 'lodash';

function processElement(map, element) {
  for (let name in element.links) {
    if (name[0] !== '$') {
      let relation = map[element.links[name]];

      if (relation) {
        element.attributes[name] = relation.attributes;
      }
    }
  }
}


export default class ResourceClient {
  constructor(resource) {
    this.resource = resource;

    if (resource.includes) {
      this.includedResources = _.keyBy(resource.includes, (x) => x.links.$self);
    } else {
      this.includedResources = {};
    }

    if (resource.attributes) {
      processElement(this.includedResources, resource);
    }

    if (resource.elements) {
      _.forEach(resource.elements, processElement.bind(null, this.includedResources));
    }
  }


  value() {
    return this.resource.attributes;
  }


  toArray() {
    let array;

    if (this.resource.elements) {
      array = this.resource.elements
        .map((x) => x.attributes);

    } else {
      array = [];
    }

    if (this.resource.meta)
      array.meta = this.resource.meta;

    return array;
  }
};
