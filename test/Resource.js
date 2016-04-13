
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
      expect(resource.url('sprockets', {id: 5})).to.equal('http://api/sprockets/5');
    });

    it('should use baseUrl and idField when provided', function () {
      resource = new Resource('widgets', 'http://api', 'foo');
      expect(resource.url('sprockets', {foo: 5})).to.equal('http://api/sprockets/5');
    });

    it('should use a custom function when provided', function () {
      resource = new Resource('widgets', (type, resource) => type + ':' + resource);
      expect(resource.url('sprockets', 'resource')).to.equal('sprockets:resource');
    });
  });


  describe('elements', function () {
    it('should set the elements property and $self link', function () {
      resource.elements([
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

    it('should throw if given a non-array', function () {
      expect(() => resource.elements({foo: 1})).to.throw(Error);
    })

    it('should return the value if no arguments supplied', function () {
      resource.elements([
        {id: 1, name: 'Fred'},
        {id: 2, name: 'Wilma'}
      ]);

      expect(resource.elements()).to.eql([
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
      ]);
    });

    it('should allow links to be specified for all elements', function () {
      resource.elements([
        {id: 1, name: 'Fred'},
        {id: 2, name: 'Wilma'}
      ], {
        posts: 'http://api/user/${id}/posts'
      });

      expect(resource.elements()).to.eql([
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


  describe('attributes', function () {
    it('should set the attributes property and $self link', function () {
      resource.attributes({id: 1, name: 'Fred'});

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

    it('should throw if given an array', function () {
      expect(() => resource.attributes([{id: 1}])).to.throw(Error);
    });

    it('should return the attributes value if no arguments supplied', function () {
      resource.attributes({id: 1, name: 'Fred'});
      expect(resource.attributes()).to.eql({id: 1, name: 'Fred'});
    });
  });


  describe('links', function () {
    it('should add the specified links, using attributes as template data', function () {
      resource
        .attributes({id: 1, name: 'Fred'})
        .links({
          related: 'http://api/users?filter[name]=${name}'
        });

      expect(resource.links()).to.eql({
        $self: 'http://api/widgets/1',
        related: 'http://api/users?filter[name]=Fred'
      });
    });
  });


  describe('querystring', function () {
    it('should alter the $self link', function () {
      let qs = new QueryStringParser({page: {number: 1}, sort: 'foo'});

      resource
        .querystring(qs)
        .elements([{id: 1}]);

      expect(resource.links().$self).to.eql('http://api/widgets?page%5Bnumber%5D=1&sort=foo');
    });

    it('should not add an empty query', function () {
      let qs = new QueryStringParser({});

      resource
        .querystring(qs)
        .elements([{id: 1}]);

      expect(resource.links().$self).to.eql('http://api/widgets');
    });
  });


  describe('paging', function () {
    it('should work for number paging', function () {
      let qs = new QueryStringParser({page: {number: 2, size: 2}, sort: 'foo'});
      let count = 5;

      resource
        .querystring(qs)
        .elements([{id: 1}])
        .paging(count);

      expect(resource.links()).to.eql({
        $self: 'http://api/widgets?page%5Bnumber%5D=2&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Bnumber%5D=1&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Bnumber%5D=1&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Bnumber%5D=3&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Bnumber%5D=3&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.meta()).to.eql({
        count: 5,
        pageCount: 3
      });
    });


    it('should work for offset paging', function () {
      let qs = new QueryStringParser({page: {offset: 2, size: 2}, sort: 'foo'});
      let count = 5;

      resource
        .querystring(qs)
        .elements([{id: 1}])
        .paging(count);

      expect(resource.links()).to.eql({
        $self: 'http://api/widgets?page%5Boffset%5D=2&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Boffset%5D=0&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Boffset%5D=0&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Boffset%5D=4&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Boffset%5D=4&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.meta()).to.eql({
        count: 5,
        pageCount: 3
      });
    });


    it('should work for after paging', function () {
      let qs = new QueryStringParser({page: {after: 1, size: 2}, sort: 'foo'});
      let count = 5;

      resource
        .querystring(qs)
        .elements([{foo: 2}, {foo: 3}])
        .paging(count, true);

      expect(resource.links()).to.eql({
        $self: 'http://api/widgets?page%5Bafter%5D=1&page%5Bsize%5D=2&sort=foo',
        $first: 'http://api/widgets?page%5Bafter%5D=&page%5Bsize%5D=2&sort=foo',
        $previous: 'http://api/widgets?page%5Bbefore%5D=2&page%5Bsize%5D=2&sort=foo',
        $next: 'http://api/widgets?page%5Bafter%5D=3&page%5Bsize%5D=2&sort=foo',
        $last: 'http://api/widgets?page%5Bbefore%5D=&page%5Bsize%5D=2&sort=foo'
      });

      expect(resource.meta()).to.eql({
        count: 5,
        pageCount: 3
      });
    });
  });


  describe('meta', function () {
    it('should set the meta data', function () {
      resource.meta({foo: 1});
      expect(resource.meta()).to.eql({foo: 1});
    });

    it('should merge with existing meta data', function () {
      resource.meta({foo: 1}).meta({bar: 2});
      expect(resource.meta()).to.eql({foo: 1, bar: 2});
    });
  });


  describe('include', function () {
    it('should work with a single resource', function () {
      resource
        .attributes({id: 1})
        .include({links: {$self: 'http://api/sprockets/2'}, attributes: {id: 2}});

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
          }
        ]
      });
    });

    it('should work with a single resource instance', function () {
      resource
        .attributes({id: 1})
        .include(new Resource('sprockets', 'http://api').attributes({id: 2}));

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
          }
        ]
      });
    });

    it('should work with an array of resources', function () {
      resource
        .attributes({id: 1})
        .include([
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
      resource
        .attributes({id: 1})
        .include([
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
});
