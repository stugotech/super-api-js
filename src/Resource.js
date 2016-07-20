
import _ from 'lodash';
import Immutable from 'immutable-builder';
import qs from 'qs';
import QueryStringParser, {querystringify} from './QueryStringParser';

export default Resource;

function Resource(_type, _baseUrl, _idKey='id') {
  return Immutable.new({
    _attributes: null,
    _baseUrl,
    _elements: [],
    _links: {},
    _idKey,
    _includes: [],
    _meta: {},
    // relationship: {name: '', sourceKey: '', destKey: 'id', resource: ''}
    _relationships: [],
    _type,
    _querystring: null,
    _paging: null,
    _relatedResources: {},


    _urlGenerator(type, id) {
      let url = this._baseUrl + '/' + type;
      if (id) url += '/' + id;
      return url;
    },


    querystring(value) {
      if (arguments.length) {
        if (!(value instanceof QueryStringParser)) {
          throw new Error('querystring must be instance of QueryStringParser');

        } else {
          return this.new((_this) => _this._querystring = value);
        }

      } else {
        return this._querystring;
      }
    },


    paging(count, exists) {
      if (arguments.length) {
        return this.new((_this) => _this._paging = {count, exists});

      } else {
        return this._paging;
      }
    },


    relatedResources() {
      return this.new(function () {
        let relationships = this.relationships();

        if (relationships.length) {
          let attributes = this.attributes();
          let elements = this.elements();

          if (attributes) {
            this.processRelationships(relationships, {attributes, links: {}});
          }

          if (elements) {
            _.forEach(elements,
              (attributes) => this.processRelationships(relationships, {attributes, links: {}})
            );
          }
        }
      })._relatedResources;
    },


    toJSON() {
      let _this = this.new();
      let links = _this.links();
      let relationships = _this.relationships();
      let attributes = _this.attributes();
      let meta = _this.meta();
      let elements = _this.elements();
      let includes = _this.includes();
      let obj;

      links.$self = (resource) => _this._urlGenerator(_this._type, resource[_this._idKey]);
      let linksTemplate = compileLinks(links);

      if (attributes) {
        obj = _this.processAttributes(linksTemplate, attributes);

        if (relationships.length) {
          _this.processRelationships(relationships, obj);
        }

      } else {
        obj = {
          links: {
            $self: _this.pagingLink()
          }
        };
      }

      if (_.keys(meta).length) {
        obj.meta = meta;
      }

      if (elements.length) {
        obj.elements = _this.elements()
          .map(_this.processAttributes.bind(_this, linksTemplate))
          .map(_this.processRelationships.bind(_this, relationships));
      }

      if (includes.length) {
        obj.includes = includes.map((x) => x.toJSON ? x.toJSON() : x);
      }

      _this.createPagingLinks(obj);
      return obj;
    },


    createPagingLinks(obj) {
      let options = this.paging();
      let page = this._querystring && this._querystring.page();

      if (options && page) {
        let {count, exists} = options;
        let pageCount = Math.ceil(count / page.size);
        let l = obj.links;

        switch (page.method) {
          case 'number':
            l.$first = this.pagingLink({number: 1});
            l.$last = this.pagingLink({number: pageCount});

            if (page.number > 1) {
              l.$previous = this.pagingLink({number: page.number - 1});
            }

            if (page.number < pageCount) {
              l.$next = this.pagingLink({number: page.number + 1});
            }

            break;

          case 'offset':
            l.$first = this.pagingLink({offset: 0});
            l.$last = this.pagingLink({offset: (pageCount -  1) * page.size});

            if (page.offset > 0) {
              l.$previous = this.pagingLink({
                offset: Math.max(0, page.offset - page.size)
              });
            }

            if (page.offset < count - page.size) {
              l.$next = this.pagingLink({offset: page.offset + page.size});
            }

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

            if (prev) {
              l.$previous = this.pagingLink({
                before: JSON.stringify(this._elements[0][page.field])
              });
            }

            if (next) {
              l.$next = this.pagingLink({
                after: JSON.stringify(this._elements[this._elements.length-1][page.field])
              });
            }

            break;
        }

        if (!obj.meta)
          obj.meta = {};

        obj.meta.count = count;
        obj.meta.pageCount = pageCount;
      }
    },


    pagingLink(page, id) {
      let querystring = {page};

      if (this._querystring)
        _.defaults(querystring, this._querystring.qs);

      if (page)
        querystring.page.size = this._querystring.page().size;

      let str = qs.stringify(querystring);
      if (str) str = '?' + str;

      return this._urlGenerator(this._type, id) + str;
    },


    processAttributes(linksTemplate, attributes) {
      return {
        links: linksTemplate(attributes),
        attributes
      };
    },


    processRelationships(relationships, obj) {
      let attributes = obj.attributes;
      let keys = _.keys(attributes);

      for (let relationship of relationships) {
        if (_.includes(keys, relationship.sourceKey)) {
          let url;
          let operation;

          if (relationship.destKey === this._idKey || !relationship.destKey) {
            url = this._urlGenerator(relationship.resource, attributes[relationship.sourceKey]);
            operation = 'get';

          } else {
            let filter = {};
            filter[relationship.destKey] = attributes[relationship.sourceKey];

            url = this._urlGenerator(relationship.resource) + querystringify({filter});
            operation = 'list';
          }

          obj.links[relationship.name] = url;

          if (typeof relationship.discard === 'undefined') {
            relationship.discard = (relationship.destKey === this._idKey || !relationship.destKey);
          }

          this._relatedResources[url] = {
            resource: relationship.resource,
            name: relationship.name,
            key: attributes[relationship.sourceKey],
            operation
          };

          if (relationship.discard) {
            delete attributes[relationship.sourceKey];
          }
        }
      }

      return obj;
    }
  });
};


function compileLinks(links) {
  if (links && !_.isFunction(links)) {
    let template = _.mapValues(links, (x) => _.isFunction(x) ? x : _.template(x));
    return (x) => _.mapValues(template, (fn) => fn(x));
  }
}
