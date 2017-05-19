import QueryOptions from '../lib/QueryOptions';
import Resource, * as SuperApi from '../lib/Resource';
import test from 'ava';


test('Resource with attributes', (t) => {
  let resource = new Resource('/widgets/1', {
    id: 1,
    name: 'frobble',
    size: 100
  });

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: '/widgets/1',
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
  let resource = new Resource('/widgets/1', {
    id: 1,
    name: 'frobble',
    size: 100
  });

  resource.addLink('info', '/names?filter[name]="<%=name%>"');

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: '/widgets/1',
        info: '/names?filter[name]="frobble"'
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
  let resource = new Resource('/widgets', [
    new Resource('/widgets/<%=id%>', {
      id: 1, 
      name: 'frobble'
    }),

    new Resource('/widgets/<%=id%>', {
      id: 2, 
      name: 'wobble'
    })
  ]);


  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: '/widgets'
      },
      elements: [
        {
          links: {
            $self: '/widgets/1'
          },
          attributes: {
            id: 1,
            name: 'frobble'
          }
        },
        {
          links: {
            $self: '/widgets/2'
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


test('flatten', (t) => {
  let resource = new Resource('/widgets', [
    new Resource('/widgets/<%=id%>', {
      id: 1,
      userId: 5,
      user: {
        id: 5,
        name: 'Bob'
      }
    })
    .addLink('user', '/users/5')
  ]);

  resource.flatten();

  t.deepEqual<any>(
    resource.toJSON(),
    {
      links: {
        $self: '/widgets'
      },
      elements: [
        {
          links: {
            $self: '/widgets/1',
            user: '/users/5'
          },
          attributes: {
            id: 1,
            userId: 5
          }
        }
      ],
      includes: [
        {
          links: {
            $self: '/users/5'
          },
          attributes: {
            id: 5,
            name: 'Bob'
          }
        }
      ]
    }
  )
});


test('toObject with existing includes', async (t) => {
  let resource = new Resource('/widgets/<%=id%>', {
    id: 1,
    userId: 5,
    user: {
      id: 5,
      name: 'Bob'
    }
  }).addLink('user', '/users/5');

  const fetcher: SuperApi.ResourceFetcher = {
    fetch(url: string) {
      t.fail('should not have called fetch');
      return null;
    }
  };

  let obj = await resource
    .flatten()
    .toObject<any>(['user'], fetcher);

  t.deepEqual(obj, {
    id: 1,
    userId: 5,
    user: {
      id: 5,
      name: 'Bob'
    }
  });
});


test('toObject with error', async (t) => {
  const resource = new Resource({
    error: {
      name: 'TestError',
      message: 'test message',
      status: 500
    }
  });

  const fetcher: SuperApi.ResourceFetcher = {
    fetch(url: string) {
      t.fail('should not have called fetch');
      return null;
    }
  };

  t.throws(resource.toObject([], fetcher), 'test message');
});


