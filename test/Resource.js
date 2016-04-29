
import {expect} from 'chai';
import Resource from '../src/Resource';
import QueryStringParser from '../src/QueryStringParser';


describe('Resource', function () {
  let resource;

  beforeEach(function () {
    resource = new Resource('widgets', 'http://api');
  });


  describe('url generation', function () {
    it('should use baseUrl when provided', function () {
      resource = new Resource('widgets', 'http://api');
      expect(resource._urlGenerator('sprockets', 5)).to.equal('http://api/sprockets/5');
    });

    it('should use baseUrl and idField when provided', function () {
      resource = new Resource('widgets', 'http://api', 'foo');
      expect(resource._urlGenerator('sprockets', 5)).to.equal('http://api/sprockets/5');
    });

    it('should use a custom function when provided', function () {
      resource = new Resource('widgets')
        .urlGenerator((type, id) => type + ':' + id);

      expect(resource._urlGenerator('sprockets', 5)).to.equal('sprockets:5');
    });
  });


  describe('elements', function () {
    it('should set the elements property and $self link', function () {
      resource = resource.elements([
        {id: 1, name: 'Fred'},
        {id: 2, name: 'Wilma'}
      ]);

      expect(resource.toJSON()).to.eql({
        links: {
          $self: 'http://api/widgets'
        },
        elements: [
          {
            links: {
              $self: 'http://api/widgets/1'
            },
            attributes: {
              id: 1,
              name: 'Fred'
            }
          },
          {
            links: {
              $self: 'http://api/widgets/2'
            },
            attributes: {
              id: 2,
              name: 'Wilma'
            }
          }
        ]
      })
    });

    it('should return the value if no arguments supplied', function () {
      resource = resource.elements([
        {id: 1, name: 'Fred'},
        {id: 2, name: 'Wilma'}
      ]);

      expect(resource.elements()).to.eql([
        {id: 1, name: 'Fred'},
        {id: 2, name: 'Wilma'}
      ]);
    });
  });


  describe('attributes', function () {
    it('should set the attributes property and $self link', function () {
      resource = resource.attributes({id: 1, name: 'Fred'});

      expect(resource.toJSON()).to.eql({
        links: {
          $self: 'http://api/widgets/1'
        },
        attributes: {
          id: 1,
          name: 'Fred'
        }
      })
    });

    it('should return the attributes value if no arguments supplied', function () {
      resource = resource.attributes({id: 1, name: 'Fred'});
      expect(resource.attributes()).to.eql({id: 1, name: 'Fred'});
    });
  });


  describe('links', function () {
    it('should add the specified links, using attributes as template data', function () {
      resource = resource
        .attributes({id: 1, name: 'Fred'})
        .links({
          related: 'http://api/users?filter[name]=${name}'
        });

      expect(resource.toJSON().links).to.eql({
        $self: 'http://api/widgets/1',
        related: 'http://api/users?filter[name]=Fred'
      });
    });

    it('should add the specified links, using elements as template data', function () {
      resource = resource
        .elements([
          {id: 1, name: 'Fred'},
          {id: 2, name: 'Wilma'}
        ])
        .links({
          posts: 'http://api/user/${id}/posts'
        });

      expect(resource.toJSON().elements).to.eql([
        {
          links: {
            $self: 'http://api/widgets/1',
            posts: 'http://api/user/1/posts'
          },
          attributes: {
            id: 1,
            name: 'Fred'
          }
        },

        {
          links: {
            $self: 'http://api/widgets/2',
            posts: 'http://api/user/2/posts'
          },
          attributes: {
            id: 2,
            name: 'Wilma'
          }
        }
      ]);
    });
  });


  describe('querystring', function () {
    it('should alter the $self link', function () {
      let qs = new QueryStringParser({page: {number: 1}, sort: 'foo'});

      resource = resource
        .querystring(qs)
        .elements([{id: 1}]);

      expect(resource.toJSON().links.$self)
        .to.equal('http://api/widgets?page%5Bnumber%5D=1&sort=foo');
    });

    it('should not add an empty query', function () {
      let qs = new QueryStringParser({});

      resource = resource
        .querystring(qs)
        .elements([{id: 1}]);

      expect(resource.toJSON().links.$self)
        .to.eql('http://api/widgets');
    });
  });


  describe('paging', function () {
    it('should work for number paging', function () {
      let qs = new QueryStringParser({page: {number: 2, size: 2}, sort: 'foo'});
      let count = 5;

      resource = resource
        .querystring(qs)
        .elements([{id: 1}])
        .paging(count);

      expect(resource.toJSON().links).to.eql({
        $self: 'http://api/widgets?page%5Bnumber%5D=2&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Bnumber%5D=1&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Bnumber%5D=1&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Bnumber%5D=3&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Bnumber%5D=3&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.toJSON().meta).to.eql({
        count: 5,
        pageCount: 3
      });
    });


    it('should work for offset paging', function () {
      let qs = new QueryStringParser({page: {offset: 2, size: 2}, sort: 'foo'});
      let count = 5;

      resource = resource
        .querystring(qs)
        .elements([{id: 1}])
        .paging(count);

      expect(resource.toJSON().links).to.eql({
        $self: 'http://api/widgets?page%5Boffset%5D=2&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Boffset%5D=0&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Boffset%5D=0&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Boffset%5D=4&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Boffset%5D=4&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.toJSON().meta).to.eql({
        count: 5,
        pageCount: 3
      });
    });


    it('should work for after paging', function () {
      let qs = new QueryStringParser({page: {after: 1, size: 2}, sort: 'foo'});
      let count = 5;

      resource = resource
        .querystring(qs)
        .elements([{foo: 2}, {foo: 3}])
        .paging(count, true);

      expect(resource.toJSON().links).to.eql({
        $self: 'http://api/widgets?page%5Bafter%5D=1&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Bafter%5D=&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Bbefore%5D=2&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Bafter%5D=3&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Bbefore%5D=&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.toJSON().meta).to.eql({
        count: 5,
        pageCount: 3
      });
    });
  });


  describe('meta', function () {
    it('should set the meta data', function () {
      resource = resource.meta({foo: 1});
      expect(resource.meta()).to.eql({foo: 1});
    });

    it('should merge with existing meta data', function () {
      resource = resource.meta({foo: 1}).meta({bar: 2});
      expect(resource.meta()).to.eql({foo: 1, bar: 2});
    });
  });


  describe('includes', function () {
    it('should work with an array of resources', function () {
      resource = resource
        .attributes({id: 1})
        .includes([
          {links: {$self: 'http://api/sprockets/2'}, attributes: {id: 2}},
          {links: {$self: 'http://api/sprockets/3'}, attributes: {id: 3}}
        ]);

      expect(resource.toJSON()).to.eql({
        links: {
          $self: 'http://api/widgets/1'
        },
        attributes: {
          id: 1
        },
        includes: [
          {
            links: {
              $self: 'http://api/sprockets/2'
            },
            attributes: {
              id: 2
            }
          },
          {
            links: {
              $self: 'http://api/sprockets/3'
            },
            attributes: {
              id: 3
            }
          }
        ]
      });
    });

    it('should work with an array of resource instances', function () {
      resource = resource
        .attributes({id: 1})
        .includes([
          new Resource('sprockets', 'http://api').attributes({id: 2}),
          new Resource('sprockets', 'http://api').attributes({id: 3})
        ]);

      expect(resource.toJSON()).to.eql({
        links: {
          $self: 'http://api/widgets/1'
        },
        attributes: {
          id: 1
        },
        includes: [
          {
            links: {
              $self: 'http://api/sprockets/2'
            },
            attributes: {
              id: 2
            }
          },
          {
            links: {
              $self: 'http://api/sprockets/3'
            },
            attributes: {
              id: 3
            }
          }
        ]
      });
    });
  });


  describe('relationships', function () {
    it('should work for simple relationships', function () {
      resource = resource
        .attributes({
          id: 1,
          authorId: 2
        })
        .relationships([
          {name: 'author', sourceKey: 'authorId', resource: 'users'}
        ]);

      let json = resource.toJSON();
      expect(json.attributes).to.eql({id: 1});
      expect(json.links.author).to.equal('http://api/users/2');
      expect(resource.relatedResources()).to.eql({
        'http://api/users/2': {resource: 'users', name: 'author'}
      });
    });


    it('should work for complex relationships', function () {
      resource = resource
        .attributes({
          id: 1
        })
        .relationships([
          {name: 'author', sourceKey: 'id', destKey: 'postId', resource: 'users'}
        ]);

      let json = resource.toJSON();
      expect(json.attributes).to.eql({id: 1});
      expect(json.links.author).to.equal('http://api/users?filter%5BpostId%5D=1');
      expect(resource.relatedResources()).to.eql({
        'http://api/users?filter%5BpostId%5D=1': {resource: 'users', name: 'author'}
      });
    });
  });
});
