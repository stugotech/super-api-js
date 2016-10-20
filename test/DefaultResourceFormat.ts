import test from 'ava';
import { DefaultResourceFormat } from '../src/ResourceFormat';
import QueryOptions from '../src/QueryOptions';

test('getUrl basic use', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.is(format.getUrl('widgets'), 'http://test/widgets');
});

test('getUrl use with ID', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.is(format.getUrl('widgets', null, {id: 5}), 'http://test/widgets/5');
});

test('getUrl use with other named ID field', (t) => {
  let format = new DefaultResourceFormat('http://test', 'foo');
  t.is(format.getUrl('widgets', null, {foo: 'bar'}), 'http://test/widgets/bar');
});

test('getUrl use with filter ID field', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.is(format.getUrl('widgets', new QueryOptions({filter: {id: 5}})), 'http://test/widgets/5');
});

test('getUrl with paging', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.is(format.getUrl('widgets', new QueryOptions({page: {number: 5}})), 'http://test/widgets?page%5Bnumber%5D=5')
});

test('getResourceKey with type', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.deepEqual(format.getResourceKey('http://test/widgets'), {type: 'widgets'});
});

test('getResourceKey with type and ID', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.deepEqual(format.getResourceKey('http://test/widgets/5'), {type: 'widgets', id: '5'});
});

test('getResourceKey with invalid URL', (t) => {
  let format = new DefaultResourceFormat('http://test');
  t.throws(() => format.getResourceKey('frobble'));
});