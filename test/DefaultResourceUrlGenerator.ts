import test from 'ava';
import { DefaultResourceUrlGenerator } from '../src/ResourceUrlGenerator';
import QueryOptions from '../src/QueryOptions';

test('generateUrl basic use', (t) => {
  let generator = new DefaultResourceUrlGenerator('http://test');
  t.is(generator.generateUrl('widgets'), 'http://test/widgets');
});

test('generateUrl use with ID', (t) => {
  let generator = new DefaultResourceUrlGenerator('http://test');
  t.is(generator.generateUrl('widgets', null, {id: 5}), 'http://test/widgets/5');
});

test('generateUrl use with other named ID field', (t) => {
  let generator = new DefaultResourceUrlGenerator('http://test', 'foo');
  t.is(generator.generateUrl('widgets', null, {foo: 'bar'}), 'http://test/widgets/bar');
});

test('generateUrl use with filter ID field', (t) => {
  let generator = new DefaultResourceUrlGenerator('http://test');
  t.is(generator.generateUrl('widgets', new QueryOptions({filter: {id: 5}})), 'http://test/widgets/5');
});

test('generateUrl with paging', (t) => {
  let generator = new DefaultResourceUrlGenerator('http://test');
  t.is(generator.generateUrl('widgets', new QueryOptions({page: {number: 5}})), 'http://test/widgets?page%5Bnumber%5D=5')
});