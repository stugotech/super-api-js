
import _ from 'lodash';
import qs from 'qs';

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
      this.url = _.curry(urlFn);

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

      this._data = data;
      this._elements = resourcify(data, this.url(this._type), links).elements;
      this._links.$self = this.url(this._type, null);

      if (this._querystring) {
        this._links.$self += '?' + qs.stringify(this._querystring.qs);
      }

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

      if (this._querystring) {
        this._links.$self += '?' + qs.stringify(this._querystring.qs);
      }

      return this;
    }
  }


  querystring(qs) {
    if (arguments.length === 0) {
      return this._querystring;

    } else {
      this._querystring = qs;
      return this;
    }
  }


  paging(count, exists) {
    let page;

    if (this._querystring && (page = this._querystring.page())) {
      let pageCount = Math.ceil(count / page.size);
      let l = this._links;

      switch (page.method) {
        case 'number':
          l.first = this.pagingLink({number: 1});
          l.last = this.pagingLink({number: pageCount});

          if (page.number > 1)
            l.prev = this.pagingLink({number: page.number - 1});

          if (page.number < pageCount)
            l.next = this.pagingLink({number: page.number + 1});

          break;

        case 'offset':
          l.first = this.pagingLink({offset: 0});
          l.last = this.pagingLink({offset: (pageCount -  1) * page.size});

          if (page.offset > 0)
            l.prev = this.pagingLink({offset: Math.max(0, page.offset - page.size)});

          if (page.offset < count - page.size)
            l.next = this.pagingLink({offset: page.offset + page.size});

          break;

        case 'after':
          let prev, next;

          if (page.reverse) {
            prev = exists;
            next = typeof page.after !== 'undefined';

          } else {
            prev = typeof page.after !== 'undefined';
            next = exists;
          }

          l.first = this.pagingLink({after: ''});
          l.last = this.pagingLink({before: ''});

          if (prev)
            l.prev = this.pagingLink({before: JSON.stringify(this._data[0][page.field])});

          if (next)
            l.next = this.pagingLink({after: JSON.stringify(this._data[this._data.length-1][page.field])});

          break;
      }

      this.meta({count, pageCount});
    }

    return this;
  }


  pagingLink(page) {
    let querystring = {page};
    _.defaults(querystring, this._querystring.qs);
    querystring.page.size = this._querystring.page().size;
    return this.url(this._type, null) + '?' + qs.stringify(querystring);
  }


  links(template) {
    if (arguments.length === 0) {
      return this._links;

    } else {
      let links = compileLinks(template)(this._attributes);
      _.assign(this._links, links);
      return this;
    }
  }


  meta(data) {
    if (arguments.length === 0) {
      return this._meta;

    } else {
      this._meta = _.assign(this._meta, data);
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


  self() {
    let self = {
      links: this._links
    };

    if (_.keys(this._meta).length) {
      self.meta = this._meta;
    }

    if (this._attributes) {
      self.attributes = this._attributes;
    }

    if (this._elements) {
      self.elements = this._elements;
    }

    return self;
  }


  toJSON() {
    let obj = {
      $self: this.self()
    };

    _.assign(obj, this._includes);
    return obj;
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
    let template = _.mapValues(links, (x) => _.isFunction(x) ? x : _.template(x));
    return (x) => _.mapValues(template, (fn) => fn(x));
  }
};
