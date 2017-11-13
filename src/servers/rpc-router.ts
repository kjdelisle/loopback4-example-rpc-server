import {RPCServer} from './rpc-server';
import * as express from 'express';
import * as parser from 'body-parser';

export class RPCRouter {
  routing: express.Router;
  constructor(private server: RPCServer) {
    this.routing = express.Router();
    const jsonParser = parser.json();
    this.routing.post('*', jsonParser, this.routeRequest);
    if (this.server.expressServer) {
      this.server.expressServer.use(this.routing);
    }
  }

  async routeRequest(request: express.Request, response: express.Response) {
    const ctrl = request.body.controller;
    const method = request.body.method;
    const input = request.body.input;
    let controller;
    try {
      controller = await this.getController(ctrl);
      if (!controller[method]) {
        throw new Error(
          `No method was found on controller "${ctrl}" with name "${method}".`,
        );
      }
    } catch (err) {
      this.sendErrResponse(response, err, 400);
      return;
    }
    try {
      response.send(await controller[method](input));
    } catch (err) {
      this.sendErrResponse(response, err, 500);
    }
  }

  // tslint:disable-next-line:no-any
  sendErrResponse(resp: express.Response, send: any, statusCode: number) {
    resp.statusCode = statusCode;
    resp.send(send);
  }

  async getController(ctrl: string): Promise<Controller> {
    return (await this.server.get(`controllers.${ctrl}`)) as Controller;
  }
}

export type Controller = {
  [method: string]: Function;
};
