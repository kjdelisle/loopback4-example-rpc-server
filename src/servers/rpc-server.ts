import {inject, Context} from '@loopback/context';
import {Server, Application, CoreBindings} from '@loopback/core';
import {RPCRouter} from './rpc-router';
import * as express from 'express';
import * as http from 'http';
import * as pEvent from 'p-event';

export class RPCServer extends Context implements Server {
  _server: http.Server;
  expressServer: express.Application;
  router: RPCRouter;
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application,
    @inject('rpcServer.config') public config?: RPCServerConfig,
  ) {
    super(app);
    this.config = config || {};
  }

  async start(): Promise<void> {
    this.expressServer = express();
    this.router = new RPCRouter(this);
    this._server = this.expressServer.listen(
      (this.config && this.config.port) || 3000,
    );
    return await pEvent(this._server, 'listening');
  }
  async stop(): Promise<void> {
    this._server.close();
    return await pEvent(this._server, 'close');
  }
}

export type RPCServerConfig = {
  port?: number;
  // tslint:disable-next-line:no-any
  [key: string]: any;
};
