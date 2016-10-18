/// <reference path="./http-status-errors.d.ts" />
import {BadRequestError} from 'http-status-errors';
import * as _ from 'lodash';
import * as qs from 'qs';

export type SortAsc = 1
export type SortDesc = -1;
export type SortDirection = SortAsc | SortDesc;
export type SortSpec = {[id: string]: SortDirection};

export type FilterSpec = {[id: string]: any};

export type FieldSpec = {[id: string]: string[]};

export type NumberPageMethod = 'number';
export type OffsetPageMethod = 'offset';
export type AfterPageMethod = 'after';
export type BeforePageMethod = 'before';
export type PageMethod = NumberPageMethod | OffsetPageMethod | AfterPageMethod;

export interface NumberPageSpec {
  method: NumberPageMethod,
  number: number,
  size: number
};

export interface OffsetPageSpec {
  method: OffsetPageMethod,
  offset: number,
  size: number
};

export interface AfterPageSpec {
  method: AfterPageMethod,
  after: any,
  before: any,
  size: number,
  field: string,
  direction: SortDirection,
  reverse: boolean
};

export type PageSpec =
  NumberPageSpec | OffsetPageSpec | AfterPageSpec;


export interface QueryOptionSettings {
  defaultPageSize?: number;
  defaultPageMethod?: PageMethod;
  maximumPageSize?: number;
  idKey?: string;
  parseAsJson?: boolean;
};

export var defaultOptions: QueryOptionSettings = {
  defaultPageSize: 100,
  defaultPageMethod: 'number',
  maximumPageSize: Number.POSITIVE_INFINITY,
  idKey: 'id',
  parseAsJson: false
};


export default class QueryOptions {
  public options: QueryOptionSettings;
  private _sort: SortSpec;
  private _filter: FilterSpec;
  private _fields: FieldSpec;
  private _page: PageSpec;
  private _include: string[];


  constructor(public qs: any, options?: QueryOptionSettings) {
    this.options = Object.assign({}, defaultOptions, options);
  }


  sort() {
    if (typeof this._sort === 'undefined') {
      let page = this.page();

      let dir: SortDirection
        = (page && page.method === 'after' && page.reverse) ? -1 : 1;

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
        if (this.options.parseAsJson) {
          this._filter = mapValuesDeep(this.qs.filter,
            (value) => JSON.parse(value));

        } else {
          this._filter = this.qs.filter;
        }

      } else {
        this._filter = null;
      }
    }

    return this._filter;
  }

  
  fields() {
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

    return this._fields;
  }


  fieldsFor(name: string) {
    let fields = this.fields();

    if (fields) {
      return fields[name] || null;
    } else {
      return null;
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

        if (this.options.parseAsJson) {
          this._page = _.mapValues(this.qs.page, (x) => x !== '' ? JSON.parse(x) : void 0);
        } else {
          this._page = this.qs.page;
        }

        this._page.method = <PageMethod> method[0] || this.options.defaultPageMethod;
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
              this._page.before = null;
              this._page.direction = <SortDirection> -this._page.direction;
              this._page.reverse = true;
            } else {
              this._page.reverse = false;
              this._page.before = null;
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


  toString() {
    let query = _.pickBy(this.qs, (x) => x != null);

    let obj = Object.assign(
      {},
      query,
      mapValuesDeep(_.pick(query, 'filter', 'page'), JSON.stringify)
    );

    if (obj.page && obj.page.method) {
      delete obj.page.method;
    }

    let url = qs.stringify(obj);

    if (url.length) {
      return '?' + url;
    } else {
      return '';
    }
  }
};


function mapValuesDeep(obj, fn: (value: any) => any) {
  return _.mapValues(obj, (v) => _.isPlainObject(v) ? mapValuesDeep(v, fn) : fn(v));
}