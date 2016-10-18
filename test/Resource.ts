import QueryOptions from '../src/QueryOptions';
import Resource, * as SuperApi from '../src/Resource';
import SuperApiClient from '../src/superApiClient';
import test from 'ava';

const client = new SuperApiClient('http://test');

test('Resource with attributes', (t) => {
  let resource = new Resource(client, 'widgets');

  resource.set({
    attributes: {
      id: 1,
      name: 'frobble',
      size: 100
    }
  });

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: 'http://test/widgets/1',
      },
      attributes: {
        id: 1,
        name: 'frobble',
        size: 100
      }
    }
  );
});


test('Resource with attributes and links', (t) => {
  let resource = new Resource(client, 'widgets');

  resource.set({
    attributes: {
      id: 1,
      name: 'frobble',
      size: 100
    },
    links: {
      info: 'http://test/names?filter[name]="<%=name%>"'
    }
  });

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: 'http://test/widgets/1',
        info: 'http://test/names?filter[name]="frobble"'
      },
      attributes: {
        id: 1,
        name: 'frobble',
        size: 100
      }
    }
  );
});


test('Resource with attributes and relations', (t) => {
  let resource = new Resource(client, 'widgets');

  resource.set({
    attributes: {
      id: 1,
      name: 'frobble',
      size: 100
    },
    links: {
      info: new SuperApi.Relationship('name', 'name', 'names', false)
    }
  });

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: 'http://test/widgets/1',
        info: 'http://test/names?filter%5Bname%5D=%22frobble%22'
      },
      attributes: {
        id: 1,
        name: 'frobble',
        size: 100
      }
    }
  );
});


test('Resource with elements', (t) => {
  let resource = new Resource(client, 'widgets');

  resource.set({
    elements: [
      new Resource(client, 'widgets')
        .set({attributes: {id: 1, name: 'frobble'}}),
      
      new Resource(client, 'widgets')
        .set({attributes: {id: 2, name: 'wobble'}})
    ]
  });

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: 'http://test/widgets'
      },
      elements: [
        {
          links: {
            $self: 'http://test/widgets/1'
          },
          attributes: {
            id: 1,
            name: 'frobble'
          }
        },
        {
          links: {
            $self: 'http://test/widgets/2'
          },
          attributes: {
            id: 2,
            name: 'wobble'
          }
        }
      ]
    }
  );
});


test('ServerResource with elements and paging', (t) => {
  let resource = new Resource(client, 'widgets', new QueryOptions({page: {number: 2}}));

  resource.set({
    elements: [
      new Resource(client, 'widgets')
        .set({attributes: {id: 1, name: 'frobble'}}),
      
      new Resource(client, 'widgets')
        .set({attributes: {id: 2, name: 'wobble'}})
    ]
  }, {count: 500});

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: 'http://test/widgets?page%5Bnumber%5D=2',
        $first: 'http://test/widgets?page%5Bnumber%5D=1',
        $last: 'http://test/widgets?page%5Bnumber%5D=5',
        $previous: 'http://test/widgets?page%5Bnumber%5D=1',
        $next: 'http://test/widgets?page%5Bnumber%5D=3'
      },
      elements: [
        {
          links: {
            $self: 'http://test/widgets/1'
          },
          attributes: {
            id: 1,
            name: 'frobble'
          }
        },
        {
          links: {
            $self: 'http://test/widgets/2'
          },
          attributes: {
            id: 2,
            name: 'wobble'
          }
        }
      ],
      meta: {
        count: 500,
        page: {
          size: 100,
          count: 5,
          number: 2
        }
      }
    }
  );
});