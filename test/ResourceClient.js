
import {expect} from 'chai';
import ResourceClient from '../src/ResourceClient';


describe('ResourceClient', function () {
  describe('value', function () {
    it('should return the attributes', function () {
      let resource = new ResourceClient({
        attributes: {
          foo: 1,
          bar: 2
        }
      });

      expect(resource.value()).to.eql({
        foo: 1,
        bar: 2
      });
    });

    it('should include included resources', function () {
      let resource = new ResourceClient({
        links: {
          baz: 'http://api/baz'
        },
        attributes: {
          foo: 1,
          bar: 2
        },
        includes: [
          {
            links: {
              $self: 'http://api/baz'
            },
            attributes: {
              bat: 3
            }
          }
        ]
      });

      expect(resource.value()).to.eql({
        foo: 1,
        bar: 2,
        baz: {
          bat: 3
        }
      });
    });
  });


  describe('toArray', function () {
    it('should return the attributes of the elements', function () {
      let resource = new ResourceClient({
        elements: [
          {
            attributes: {
              foo: 1,
              bar: 2
            }
          },
          {
            attributes: {
              foo: 3,
              bar: 4
            }
          }
        ]
      });

      expect(resource.toArray()).to.eql([
        {
          foo: 1,
          bar: 2
        },
        {
          foo: 3,
          bar: 4
        }
      ]);
    });

    it('should include included resources', function () {
      let resource = new ResourceClient({
        elements: [
          {
            links: {
              baz: 'http://api/baz/1'
            },
            attributes: {
              foo: 1,
              bar: 2
            }
          },
          {
            links: {
              baz: 'http://api/baz/2'
            },
            attributes: {
              foo: 3,
              bar: 4
            }
          }
        ],
        includes: [
          {
            links: {
              $self: 'http://api/baz/1'
            },
            attributes: {
              bat: 3
            }
          },
          {
            links: {
              $self: 'http://api/baz/2'
            },
            attributes: {
              bat: 5
            }
          }
        ]
      });

      expect(resource.toArray()).to.eql([
        {
          foo: 1,
          bar: 2,
          baz: {bat: 3}
        },
        {
          foo: 3,
          bar: 4,
          baz: {bat: 5}
        }
      ]);
    });
  });
});
