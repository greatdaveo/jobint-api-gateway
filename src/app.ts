import express, { Express } from 'express';
import { GatewayServer } from '@gateway/server';

class Application {
  public initialize(): void {
    const app: Express = express();
    const server: GatewayServer = new GatewayServer(app);
    server.start();
  }
}

const application: Application = new Application();

application.initialize();
