
import _ from 'lodash/fp';
import BadRequestError from './errors/BadRequestError';


export default class QueryStringParser {
  constructor(qs, defaultPageSize, maximumPageSize=Number.POSITIVE_INFINITY, defaultPageMethod) {
    this.qs = qs;
    this.defaultPageSize = defaultPageSize;
    this.maximumPageSize = maximumPageSize;
    this.defaultPageMethod = defaultPageMethod;
  }


  sort() {
    if (typeof this._sort === 'undefined') {
      if (this.qs.sort) {
        let sort = {};

        for (let field of this.qs.sort.split(',')) {
          if (field[0] === '-') {
            sort[field.substring(1)] = -1;
          } else {
            sort[field] = 1;
          }
        }

        this._sort = sort;

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
      if (this.qs.page || this.defaultPageSize || this.defaultPageMethod) {
        this.qs.page = this.qs.page || {};
        let method = _.intersection(_.keys(this.qs.page), ['number', 'offset', 'after']);

        if (method.length > 1) {
          throw new BadRequestError('more than one method of paging specified');
        }

        this._page = _.mapValues(JSON.parse, this.qs.page);
        this._page.method = method[0] || this.defaultPageMethod;
        this._page.size = Math.min(this._page.size || this.defaultPageSize, this.maximumPageSize);

        switch (this._page.method) {
          case 'number':
            this._page.number = this._page.number || 1;
            break;

          case 'offset':
            this._page.offset = this._page.offset || 0;
            break;

          case 'after':
            this._page.after = this._page.after || null;
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
