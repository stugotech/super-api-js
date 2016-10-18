
import QueryOptions, { SortSpec, PageSpec, QueryOptionSettings } from '../src/QueryOptions';
import test from 'ava';

test('sort returns null if not specified', (t) => {
  let options = new QueryOptions({});
  t.is(options.sort(), null);
});

test('sort returns obj if specified', (t) => {
  let options = new QueryOptions({sort: 'a,-b'});
  t.deepEqual<SortSpec>(options.sort(), {
    a: 1,
    b: -1
  });
});

test('filter returns null if not specified', (t) => {
  let options = new QueryOptions({});
  t.is(options.filter(), null);
});

test('filter returns obj if specified', (t) => {
  let options = new QueryOptions({filter: {a: '"foo"', b: '{"$in": [1,2]}'}}, {parseAsJson: true});
  t.deepEqual(options.filter(), {
    a: "foo",
    b: {$in: [1, 2]}
  });
});

test('fields returns null if not specified', (t) => {
  let options = new QueryOptions({});
  t.is(options.fields(), null);
});

test('fields returns obj if specified', (t) => {
  let options = new QueryOptions({fields: {foo: 'a,b', bar: 'a,c'}});
  t.deepEqual(options.fields(), {
    foo: ['a', 'b'],
    bar: ['a', 'c']
  });
});

test('fieldsFor returns null if not specified', (t) => {
  let options = new QueryOptions({});
  t.is(options.fieldsFor('foo'), null);
});

test('fieldsFor returns null if not specified', (t) => {
  let options = new QueryOptions({fields: {foo: 'a,b', bar: 'a,c'}});
  t.is(options.fieldsFor('baz'), null);
});

test('fieldsFor returns obj if specified', (t) => {
  let options = new QueryOptions({fields: {foo: 'a,b', bar: 'a,c'}});
  t.deepEqual(options.fieldsFor('foo'), ['a', 'b']);
});

test('page returns defaults if not specified', (t) => {
  let options = new QueryOptions({});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'number',
    size: 100,
    number: 1
  });
});

test('page throws if more than one page method in use', (t) => {
  let options = new QueryOptions({page: {number: 2, offset: 0}});
  t.throws(() => options.page());
});

test('page works for number paging', (t) => {
  let options = new QueryOptions({page: {number: '1', size: '10'}}, {parseAsJson: true});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'number',
    number: 1,
    size: 10
  });
});

test('page works for offset paging', (t) => {
  let options = new QueryOptions({page: {offset: '1', size: '10'}}, {parseAsJson: true});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'offset',
    offset: 1,
    size: 10
  });
});

test('page works for after paging', (t) => {
  let options = new QueryOptions({page: {after: '"foo"', size: '10'}}, {parseAsJson: true});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'after',
    after: "foo",
    size: 10,
    before: null,
    field: 'id',
    reverse: false,
    direction: 1
  });
});

test('page works for before paging', (t) => {
  let options = new QueryOptions({page: {before: '"foo"', size: '10'}}, {parseAsJson: true});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'after',
    after: "foo",
    size: 10,
    before: null,
    field: 'id',
    reverse: true,
    direction: -1
  });
});

test('page works for after paging with sort', (t) => {
  let options = new QueryOptions({
    page: {after: '"foo"', size: '10'},
    sort: '-thing'
  }, {parseAsJson: true});

  t.deepEqual<PageSpec>(options.page(), {
    method: 'after',
    after: "foo",
    size: 10,
    before: null,
    field: 'thing',
    reverse: false,
    direction: -1
  });
});

test('page works for before paging with sort', (t) => {
  let options = new QueryOptions({
    page: {before: '"foo"', size: '10'},
    sort: '-thing'
  }, {parseAsJson: true});

  t.deepEqual<PageSpec>(options.page(), {
    method: 'after',
    after: "foo",
    size: 10,
    before: null,
    field: 'thing',
    reverse: true,
    direction: 1
  });
});

test('page allows blanks', (t) => {
  let options = new QueryOptions({page: {after: '', size: '10'}}, {parseAsJson: true});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'after',
    after: undefined,
    size: 10,
    before: null,
    field: 'id',
    reverse: false,
    direction: 1
  });
});

test('page should limit the page size', (t) => {
  let options = new QueryOptions({page: {size: 100}}, <QueryOptionSettings>{maximumPageSize: 20});
  t.deepEqual<PageSpec>(options.page(), {
    method: 'number',
    size: 20,
    number: 1
  });
});

test('include should return null if not specified', (t) => {
  let options = new QueryOptions({});
  t.is(options.include(), null);
});

test('include should return obj if specified', (t) => {
  let options = new QueryOptions({include: 'foo,bar'});
  t.deepEqual(options.include(), ['foo', 'bar']);
});