
# Super API JS

A JavaScript library for the [Super API Spec](https://github.com/stugotech/super-api#readme).

## Installation

    $ npm install --save super-api-js

## Documentation

The package exports a hash of classes:

```js
import {Resource} from 'super-api-js';
// or...
import * as SuperAPI from 'super-api-js'
```

Or in ES5:

```js
var Resource = require('super-api-js').Resource;
```

These classes are documented individually below.


### `Resource`

The resource class represents a Super API resource.

#### `constructor(type, urlFn)`

Constructor.

**Parameters**

  * `type` - the name of the resource, for generating links
  * `urlFn` - the function to use to generate links

    The function has the signature `function (type, resource)`, where `type` is the name of the resource to generate a URL for (as above) and `resource` is the POJO representing the resource.

#### `constructor(type, baseUrl, idField='id')`

Constructor.

**Parameters:**

  * `type` - the name of the resource, for generating links
  * `baseUrl` - the base URL of the API as a string
  * `idField` - the name of the ID field in resources

**Details**

This form of the constructor will automatically generate URLs for resources as `${baseUrl}/${type}` for resource collections or `${baseUrl}/${type}/${id}` for individual resources - the value for `id` will be taken from the field specified by `idField` on the resource the URL is being generated for.

#### `elements(data, links)`

Sets the element data.

**Parameters**

  * `data` - an array of POJOs to include in the collection
  * `links` - a hash of link templates to include on each resource in the collection

**Details**

The `links` parameter is a hash with keys named the same as the links you want on each element, and values as lodash templates.  This method also automatically sets the `$self` link to the collection URL for the resource type specified in the constructor.  If this isn't correct, you should set it yourself afterwards.

**Example**

Consider the following code:

```js
let data = [
  {id: 1, title: 'Post 1', content: 'This is the first post.', authorId: 1},
  {id: 2, title: 'Post 2', content: 'This is the second post.', authorId: 1}
];

let links = {
  author: 'https://blog/api/users/${authorId}'
};

let posts = new Resource('posts', 'https://blog/api');
posts.elements(data, links);
```

This creates the following resource object:

```json
{
  "links": {
    "$self": "https://blog/api/posts"
  },
  "elements": [
    {
      "links": {
        "$self": "https://blog/api/1",
        "author": "https://blog/api/users/1"
      },
      "attributes": {
        "id": 1,
        "title": "Post 1",
        "content": "This is the first post.",
        "authorId": 1
      }
    },
    {
      "links": {
        "$self": "https://blog/api/2",
        "author": "https://blog/api/users/1"
      },
      "attributes": {
        "id": 2,
        "title": "Post 2",
        "content": "This is the second post.",
        "authorId": 1
      }
    }
  ]
}
```

#### `elements()`

Gets the value of the `elements` property.


#### `attributes(data)`

Sets the attributes property.

**Parameters**

  * `data` - a POJO

**Details**

This method also sets the `$self` link to the the resource link for the data you supplied, using the resource type and URL function supplied in the constructor, if you supplied it.  If this isn't correct, you should set this URL yourself afterwards.


#### `attributes()`

Gets the value of the `attributes` property.


#### `links(links)`

Sets the `links` property.

**Parameters**

  * `links` - a hash of link templates

**Details**

The `links` parameter is a hash of link templates, where each key is a key to appear in the `links` property, and each value is a lodash template.  The templates are evaluated using the `attributes` property as a model.


#### `links()`

Gets the value of the `links` property.


#### `include(resource)`

Includes extraneous resources in this resource.

**Parameters**

  * `resource` - either an instance of `Resource`, the full structure of a Super API resource as a POJO, or an array of either

**Details**

The resources are included as part of this resource.


#### `include()`

Gets the resources included in this resource.


#### `querystring(qs)`

Sets the querystring object, an instance of `QueryStringParser`, to be used by the `paging(count, exists)` function.

**Parameters**

  * `qs` - the querystring object


#### `querystring()`

Gets the querystring object.


#### `paging(count, exists)`

Sets the paging links.

**Parameters**

  * `count` - the number of documents in total
  * `exists` - for `after` paging

**Details**

TODO



#### `toJSON()`

Gets the POJO representation of the whole resource (and included resources if applicable).  Note that this method is automatically called when you call `JSON.stringify(resource)`, where `resource` is an instance of `Resource`.


### `QueryStringParser`

Parses a querystring object to support the various querystring parameters supported by Super API.  Note that it works on an *object*, i.e., something that has already been parsed from the original string using querystring parsing library.

The getter methods all return `null` if the relevant information isn't supplied.


#### `constructor(qs, options)`

Constructor.

**Parameters**

  * `qs` - the querystring object to work on
  * `options` - an object with the following optional fields:
    * `defaultPageSize` - the default page size to use if none is specified
    * `maximumPageSize` - the upper bound on page sizes, i.e. if a value larger than this is specified in the querystring, the maximum will be used instead
    * `defaultPageMethod` - the default page method to use if none is specified


#### `sort()`

Gets the [sort details](https://github.com/stugotech/super-api#sorting), as a MongoDB-style object.

**Details**

It parses a `sort` parameter like `-name,age` and returns a hash of sort fields with either a `1` for ascending or `-1` for descending sort:

```js
{
  name: -1,
  age: 1
}
```

#### `filter()`

Gets the [filter details](https://github.com/stugotech/super-api#filtering).

**Details**

The `filter` parameter values are parsed as JSON fragments.  E.g., the querystring `?filter[title]='Title'&filter[authorId]=1,2,3` would be parsed by this method into:

```js
{
  title: ['Title'],
  authorId: [1,2,3]
}
```


#### `fields([name])`

Gets all [fieldsets](https://github.com/stugotech/super-api#sparse-fieldsets) specified, or if `name` is specified, gets only the fieldset for that key.

**Parameters**

  * `name` - the key to get the fieldset for (optional)

**Details**

For the querystring `?fields[$self]=a,b,d&fields[foo]=a,c`, calling `fields()` would return:

```js
{
  $self: ['a', 'b', 'd'],
  foo: ['a', 'c']
}
```

Calling `fields('foo')` would return just the fieldset for that key, i.e.:

```js
['a', 'c']
```


#### `page()`

Gets the [paging details](https://github.com/stugotech/super-api#paging).

**Details**

The method returns a hash with the `size`, `method` and one of `number`, `offset` or `after` fields, depending what was specified in the querystring.  If more than one is specified, the method throws a `BadRequestError`.

Even if `size` isn't specified in the querystring, it can get its value from `defaultPageSize` passed to the constructor.  It will be bounded by `maximumPageSize`: e.g., if the querystring specifies `page[size]=100` and `maximumPageSize` was supplied to the constructor as `50`, then the `size` field of the result will be `50`.

The `method` field states which one of `number`, `offset` or `after` fields was specified, for convenience.

If `defaultPageMethod` was given to the constructor, then the `method` field will equal this value if no paging method was specified in the querystring.  It will also calculate the following values automatically:

  * if the default method is `number`, the `number` field will default to `1`
  * if the default method is `offset`, the `offset` field will default to `0`
  * if the default method is `after`, the `after` field will default to `undefined`

Additionally, if the paging method is `after`, then the `field` field of the result will contain the major sort field if one is specified, and `direction` will be the direction of this sort.
