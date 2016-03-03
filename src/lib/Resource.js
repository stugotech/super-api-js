
import _ from 'lodash/fp';


export default class Resource {
  constructor(type, urlFn, idField='id') {
    this._type = type;
    this._links = {};
    this._meta = {};
    this._includes = {};

    if (_.isString(urlFn)) {
      this.url = _.curry((resourceType, resource) => {
        let url = urlFn + '/' + resourceType;
        if (resource) url += '/' + _.property(idField)(resource);
        return url;
      });

    } else if (_.isFunction(urlFn)) {
      this.url = urlFn;

    } else {
      throw new Error('urlFn should be a string or function');
    }
  }


  elements(data, links) {
    if (arguments.length === 0) {
      return this._elements;

    } else {
      if (!_.isArray(data))
        throw new Error('data must be an array');

      this._elements = resourcify(data, this.url(this._type), links).elements;
      this._links.$self = this.url(this._type, null);
      return this;
    }
  }


  attributes(data) {
    if (arguments.length === 0) {
      return this._attributes;

    } else {
      if (!_.isObject(data) || _.isArray(data))
        throw new Error('data must be an object and not an array');

      this._attributes = resourcify(data).attributes;
      this._links.$self = this.url(this._type, data);
      return this;
    }
  }


  links(links) {
    if (arguments.length === 0) {
      return this._links;

    } else {
      _.assign(this._links, compileLinks(links)(this._attributes));
      return this;
    }
  }


  meta(data) {
    if (arguments.length === 0) {
      return this._meta;

    } else {
      _.assign(this._meta, data);
      return this;
    }
  }


  include(resource) {
    if (arguments.length === 0) {
      return this._includes;

    } else {
      if (_.isArray(resource)) {
        for (let r of resource) {
          this.include(r);
        }

      } else {
        if (resource instanceof Resource) {
          resource = resource.toJSON().$self;
        }

        resource = _.cloneDeep(resource);
        this._includes[resource.links.$self] = resource;
        delete resource.links.$self;

        if (!_.keys(resource.links).length) {
          delete resource.links;
        }
      }

      return this;
    }
  }


  toJSON() {
    let obj = {
      $self: {
        links: this._links
      }
    };

    if (_.keys(this._meta).length) {
      obj.$self.meta = this._meta;
    }

    if (this._attributes) {
      obj.$self.attributes = this._attributes;
    }

    if (this._elements) {
      obj.$self.elements = this._elements;
    }

    return _.assign(obj, this._includes);
  }
};


export function resourcify(data, keyBy, links) {
  links = compileLinks(links);

  if (Array.isArray(data)) {
    return {
      elements: _(data).keyBy(keyBy).mapValues(resourcifyElement(links)).value()
    }

  } else {
    return resourcifyElement(links, data);
  }
};


const resourcifyElement = _.curry(function (linksTemplate, data) {
  let obj = {attributes: data};

  if (linksTemplate)
    obj.links = linksTemplate(data);

  return obj;
});


export function compileLinks(links) {
  if (links && !_.isFunction(links)) {
    let template = _.mapValues((x) => _.isFunction(x) ? x : _.template(x), links);
    return (x) => _.mapValues((fn) => fn(x), template);
  }
};
