
import _ from 'lodash';
import {BadRequestError} from 'http-status-errors';
import qs from 'qs';


export default class QueryStringParser {
  constructor(qs, options) {
    this.qs = qs;
    this.options = {};
    _.defaults(this.options, options, {maximumPageSize: Number.POSITIVE_INFINITY, idKey: 'id'});
  }


  sort() {
    if (typeof this._sort === 'undefined') {
      let page = this.page();
      let dir = page && page.reverse ? -1 : 1;

      if (this.qs.sort) {
        let sort = {};

        for (let field of this.qs.sort.split(',')) {
          if (field[0] === '-') {
            sort[field.substring(1)] = -dir;
          } else {
            sort[field] = dir;
          }
        }

        this._sort = sort;

      } else if (page && page.method === 'after') {
        this._sort = {};
        this._sort[this.options.idKey] = dir;

      } else {
        this._sort = null;
      }
    }

    return this._sort;
  }


  filter() {
    if (typeof this._filter === 'undefined') {
      if (this.qs.filter) {
        let filter = {};

        for (let k in this.qs.filter) {
          filter[k] = JSON.parse('[' + this.qs.filter[k] + ']');
        }

        this._filter = filter;

      } else {
        this._filter = null;
      }
    }

    return this._filter;
  }


  fields(name) {
    if (typeof this._fields === 'undefined') {
      if (this.qs.fields) {
        let fields = {};

        for (var k in this.qs.fields) {
          fields[k] = this.qs.fields[k].split(',');
        }

        this._fields = fields;

      } else {
        this._fields = null;
      }
    }

    if (this._fields && name) {
      return this._fields[name];
    } else {
      return this._fields;
    }
  }


  page() {
    if (typeof this._page === 'undefined') {
      if (this.qs.page || this.options.defaultPageSize || this.options.defaultPageMethod) {
        this.qs.page = this.qs.page || {};
        let method = _.intersection(_.keys(this.qs.page), ['number', 'offset', 'after', 'before']);

        if (method.length > 1) {
          throw new BadRequestError('more than one method of paging specified');
        }

        if (method[0] === 'before') {
          method[0] = 'after';
        }

        this._page = _.mapValues(this.qs.page, (x) => x !== '' ? JSON.parse(x) : void 0);
        this._page.method = method[0] || this.options.defaultPageMethod;
        this._page.size = Math.min(this._page.size || this.options.defaultPageSize, this.options.maximumPageSize);

        switch (this._page.method) {
          case 'number':
            this._page.number = this._page.number || 1;
            break;

          case 'offset':
            this._page.offset = this._page.offset || 0;
            break;

          case 'after':
            if (this.qs.sort) {
              this._page.field = this.qs.sort.match(/^-?([^,]+)/)[1];
              this._page.direction = this.qs.sort[0] === '-' ? -1 : 1;
            } else {
              this._page.field = this.options.idKey;
              this._page.direction = 1;
            }

            if (typeof this.qs.page.before !== 'undefined') {
              this._page.after = this._page.before;
              delete this._page.before;
              this._page.direction = -this._page.direction;
              this._page.reverse = true;
            } else {
              this._page.reverse = false;
            }

            break;
        }

      } else {
        this._page = null;
      }
    }

    return this._page;
  }


  include() {
    if (typeof this._include === 'undefined') {
      if (this.qs.include) {
        this._include = this.qs.include.split(',');

      } else {
        this._include = null;
      }
    }

    return this._include;
  }
};



function mapValuesDeep(obj, fn) {
  return _.mapValues(obj, (v) => _.isPlainObject(v) ? mapValuesDeep(v, fn) : fn(v));
}

export function querystringify(query) {
  if (!query) {
    return '';

  } else {
    let obj = mapValuesDeep(query, JSON.stringify);
    return '?' + qs.stringify(obj);
  }
}
