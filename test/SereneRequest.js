
import {expect} from 'chai';
import Resource from '../src/Resource';
import Serene from 'serene';
import SereneRequest from '../src/SereneRequest';


describe('SereneRequest', function () {
  describe('includes', function () {
    it('should work for simple relationships', async function () {
      let serene = new Serene(SereneRequest);
      let request = serene.request('get', 'widgets', null, null, 1);

      request.resource = {
        relationships: [
          {name: 'author', sourceKey: 'authorId', resource: 'users'}
        ]
      };

      request.query = {include: 'author'};

      serene.use(function (request, response) {
        response.result = response.result
          .attributes({
            id: 1,
            authorId: 2,
            resourceName: request.resourceName
          });
      });

      let response = await request.dispatch();
      let json = response.result.toJSON();
      expect(json.attributes.resourceName).to.equal('widgets');
      expect(json.includes).to.have.length(1);
      expect(json.includes[0].attributes.resourceName).to.equal('users');
    });
  });
});
