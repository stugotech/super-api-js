
import {expect} from 'chai';
import QueryStringParser from '../src/QueryStringParser';


describe('QueryStringParser', function () {
  describe('sort', function () {
    it('should return null if not specified', function () {
      expect(new QueryStringParser({}).sort()).to.be.null;
    });

    it('should return sort object if specified', function () {
      expect(new QueryStringParser({sort: 'a,-b'}).sort())
        .to.eql({
          a: 1, b: -1
        });
    });
  });


  describe('filter', function () {
    it('should return null if not specified', function () {
      expect(new QueryStringParser({}).filter()).to.be.null;
    });

    it('should return filter object if specified', function () {
      expect(new QueryStringParser({filter: {a: '"foo"', b: '1,2'}}).filter())
        .to.eql({
          a: ["foo"],
          b: [1, 2]
        });
    });
  });


  describe('fields', function () {
    it('should return null if not specified', function () {
      expect(new QueryStringParser({}).fields()).to.be.null;
    });

    it('should return the field list if specified', function () {
      expect(new QueryStringParser({fields: {foo: 'a,b', bar: 'a,c'}}).fields())
        .to.eql({
          foo: ['a', 'b'],
          bar: ['a', 'c']
        });
    });

    it('should return the named field list if given', function () {
      expect(new QueryStringParser({fields: {foo: 'a,b', bar: 'a,c'}}).fields('foo'))
        .to.eql(
          ['a', 'b']
        );
    });
  });


  describe('page', function () {
    it('should return null if not specified', function () {
      expect(new QueryStringParser({}).page()).to.be.null;
    });

    it('should not return null if there is a default page size', function () {
      expect(new QueryStringParser({}, {defaultPageSize: 10}).page())
        .to.eql({
          method: undefined,
          size: 10
        });
    });

    it('should throw if more than one page method is used', function () {
      expect(() => new QueryStringParser({page: {number: '1', offset: '0'}}).page())
        .to.throw(Error);
    });

    it('should work for number paging', function () {
      expect(new QueryStringParser({page: {number: '1', size: '10'}}).page())
        .to.eql({
          number: 1,
          size: 10,
          method: 'number'
        });
    });

    it('should work for offset paging', function () {
      expect(new QueryStringParser({page: {offset: '15', size: '10'}}).page())
        .to.eql({
          offset: 15,
          size: 10,
          method: 'offset'
        });
    });

    it('should work for after paging', function () {
      let qs = new QueryStringParser({page: {after: '"hello"', size: '10'}});

      expect(qs.page()).to.eql({
        after: 'hello',
        size: 10,
        method: 'after',
        field: 'id',
        direction: 1,
        reverse: false
      });

      expect(qs.sort()).to.eql({id: 1});
    });

    it('should work for before paging', function () {
      let qs = new QueryStringParser({page: {before: '"hello"', size: '10'}});

      expect(qs.page()).to.eql({
        after: 'hello',
        size: 10,
        method: 'after',
        field: 'id',
        direction: -1,
        reverse: true
      });

      expect(qs.sort()).to.eql({id: -1});
    });

    it('should work for after paging with sort', function () {
      expect(new QueryStringParser({page: {after: '"hello"', size: '10'}, sort: '-foo'}).page())
        .to.eql({
          after: 'hello',
          size: 10,
          method: 'after',
          field: 'foo',
          direction: -1,
          reverse: false
        });
    });

    it('should work for before paging with sort', function () {
      let qs = new QueryStringParser({page: {before: '"hello"', size: '10'}, sort: '-foo'});

      expect(qs.page()).to.eql({
        after: 'hello',
        size: 10,
        method: 'after',
        field: 'foo',
        direction: 1,
        reverse: true
      });

      expect(qs.sort()).to.eql({foo: 1});
    });

    it('should allow blanks', function () {
      expect(new QueryStringParser({page: {after: '', size: '10'}}).page())
        .to.eql({
          after: undefined,
          size: 10,
          method: 'after',
          field: 'id',
          direction: 1,
          reverse: false
        });
    });

    it('should limit the page size', function () {
      expect(new QueryStringParser({page: {number: '1', size: '100'}},
          {maximumPageSize: 20}).page())
        .to.eql({
          number: 1,
          size: 20,
          method: 'number'
        });
    });

    it('should return appropriate defaults for number paging', function () {
      expect(new QueryStringParser({}, {defaultPageSize: 10, defaultPageMethod: 'number'}).page())
        .to.eql({
          number: 1,
          size: 10,
          method: 'number'
        });
    });

    it('should return appropriate defaults for offset paging', function () {
      expect(new QueryStringParser({}, {defaultPageSize: 10, defaultPageMethod: 'offset'}).page())
        .to.eql({
          offset: 0,
          size: 10,
          method: 'offset'
        });
    });

    it('should return appropriate defaults for after paging', function () {
      expect(new QueryStringParser({}, {defaultPageSize: 10, defaultPageMethod: 'after'}).page())
        .to.eql({
          size: 10,
          method: 'after',
          field: 'id',
          direction: 1,
          reverse: false
        });
    });
  });


  describe('include', function () {
    it('should return null if not specified', function () {
      expect(new QueryStringParser({}).include()).to.be.null;
    });

    it('should return the include list if specified', function () {
      expect(new QueryStringParser({include: 'a,b,c'}).include())
        .to.eql(['a', 'b', 'c']);
    });
  });
});
