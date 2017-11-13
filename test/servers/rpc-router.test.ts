import 'mocha';
import * as express from 'express';
import * as sinon from 'sinon';
import {RPCRouter, RPCServer} from '../../src/servers';
import {expect} from '@loopback/testlab';

describe('rpc-router', () => {
  let router: RPCRouter;
  let request: express.Request;
  let response: express.Response;
  // tslint:disable-next-line:no-any
  let controller: any;

  beforeEach(setupFakes);
  it('routes to existing controller and method', async () => {
    await router.routeRequest(request, response);
    const stub = response.send as sinon.SinonStub;
    expect(stub.called);
    const result = stub.firstCall.args[0];
    expect(result).to.match(/Hello, World!/);
  });

  it('returns error if controller does not exist', async () => {
    request = getRequest({
      body: {
        controller: 'NotAController',
      },
    });
    controller.rejects(new Error('Does not exist!'));
    await router.routeRequest(request, response);
    const stub = response.send as sinon.SinonStub;
    expect(stub.called);
    expect(response.statusCode).to.equal(400);
    const result = stub.firstCall.args[0];
    expect(result).to.match(/Does not exist!/);
  });

  it('returns error if method does not exist', async () => {
    request = getRequest({
      body: {
        controller: 'FakeController',
        method: 'notReal',
        input: {
          name: 'World',
        },
      },
    });
    await router.routeRequest(request, response);
    const stub = response.send as sinon.SinonStub;
    expect(stub.called);
    expect(response.statusCode).to.equal(400);
    const result = stub.firstCall.args[0];
    expect(result).to.match(/No method was found on controller/);
  });

  function getRouter() {
    const server = sinon.createStubInstance(RPCServer);
    return new RPCRouter(server);
  }

  function getController(rtr: RPCRouter) {
    const stub = sinon.stub(rtr, 'getController');
    stub.resolves(new FakeController());
    return stub;
  }

  function getRequest(req?: Partial<express.Request>) {
    const reqt = Object.assign(
      <express.Request>{
        body: {
          controller: 'FakeController',
          method: 'getFoo',
          input: {
            name: 'World',
          },
        },
      },
      req,
    );
    return reqt;
  }

  function getResponse(res?: Partial<express.Response>) {
    const resp = <express.Response>{};
    resp.send = sinon.stub();
    return resp;
  }

  function setupFakes() {
    router = getRouter();
    request = getRequest();
    response = getResponse();
    controller = getController(router);
  }

  class FakeController {
    // tslint:disable-next-line:no-any
    getFoo(input: any) {
      return `Hello, ${input.name}!`;
    }
  }
});
