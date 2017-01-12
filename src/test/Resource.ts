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

