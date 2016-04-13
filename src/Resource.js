
import _ from 'lodash';
import qs from 'qs';

export default class Resource {
  constructor(type, urlFn, idField='id') {
    this._type = type;
    this._links = {};
    this._meta = {};
    this._includes = [];

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
      this._links.$self = this.pagingLink();
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
      this._links.$self = this.pagingLink(undefined, data);
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
          l.$first = this.pagingLink({number: 1});
          l.$last = this.pagingLink({number: pageCount});

          if (page.number > 1)
            l.$previous = this.pagingLink({number: page.number - 1});

          if (page.number < pageCount)
            l.$next = this.pagingLink({number: page.number + 1});

          break;

        case 'offset':
          l.$first = this.pagingLink({offset: 0});
          l.$last = this.pagingLink({offset: (pageCount -  1) * page.size});

          if (page.offset > 0)
            l.$previous = this.pagingLink({offset: Math.max(0, page.offset - page.size)});

          if (page.offset < count - page.size)
            l.$next = this.pagingLink({offset: page.offset + page.size});

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

          l.$first = this.pagingLink({after: ''});
          l.$last = this.pagingLink({before: ''});

          if (prev)
            l.$previous = this.pagingLink({before: JSON.stringify(this._data[0][page.field])});

          if (next)
            l.$next = this.pagingLink({after: JSON.stringify(this._data[this._data.length-1][page.field])});

          break;
      }

      this.meta({count, pageCount});
    }

    return this;
  }


  pagingLink(page, data) {
    let querystring = {page};

    if (this._querystring)
      _.defaults(querystring, this._querystring.qs);

    if (page)
      querystring.page.size = this._querystring.page().size;

    let str = qs.stringify(querystring);
    if (str) str = '?' + str;

    return this.url(this._type, data) + str;
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
          resource = resource.toJSON();
        }

        resource = _.cloneDeep(resource);
        this._includes.push(resource);
      }

      return this;
    }
  }


  toJSON() {
    let obj = {
      links: this._links
    };

    if (_.keys(this._meta).length) {
      obj.meta = this._meta;
    }

    if (this._attributes) {
      obj.attributes = this._attributes;
    }

    if (this._elements) {
      obj.elements = this._elements;
    }

    if (this._includes.length) {
      obj.includes = this._includes;
    }

    return obj;
  }
};


export function resourcify(data, keyBy, links={}) {
  links.$self = keyBy;
  links = compileLinks(links);

  if (Array.isArray(data)) {
    return {
      elements: _.map(data, _.partial(resourcifyElement, _, links))
    }

  } else {
    return resourcifyElement(data, links);
  }
};


const resourcifyElement = function (data, linksTemplate) {
  let obj = {attributes: data};

  if (linksTemplate) {
    obj.links = linksTemplate(data);
  }

  return obj;
};


export function compileLinks(links) {
  if (links && !_.isFunction(links)) {
    let template = _.mapValues(links, (x) => _.isFunction(x) ? x : _.template(x));
    return (x) => _.mapValues(template, (fn) => fn(x));
  }
};
