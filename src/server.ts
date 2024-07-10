import { CustomError, IErrorResponse, winstonLogger } from '@greatdaveo/jobint-shared';
import { Application, json, urlencoded, NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';
import cookieSession from 'cookie-session';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';
import http from 'http';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger('http://localhost:9200', 'apiGatewayServer', 'debug');

export class GatewayServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.startElasticsearch();
    this.errorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.set('trust_proxy', 1);
    app.use(
      cookieSession({
        name: 'jobint-session',
        keys: [],
        maxAge: 24 * 7 * 3600000, // For 7 days
        secure: false // To be updated with value from config
        // sameSite: none,
      })
    );
    // Security modules
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: '',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  //   Middleware with the compress json encoded
  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '200mb' }));
    app.use(urlencoded({ extended: true, limit: '200mb' }));
  }

  private routesMiddleware(_app: Application): void {}

  private startElasticsearch(): void {}

  private errorHandler(app: Application): void {
    // if an unknown endpoint is used, it will throw an error here
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      log.log('error', `${fullUrl} endpoint does not exist!`);
      res.status(StatusCodes.NOT_FOUND).json({ message: 'The endpoint called does not exist!' });

      next();
    });

    // To check for custom error in the shared library
    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.log('error', `GatewayService ${error.comingFrom}: `, error);
      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      }

      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer);
    } catch (error) {
      log.log('error', 'GatewayService startServer() error method', error);
    }
  }

  private async startHttpServer(httpserver: http.Server): Promise<void> {
    try {
      log.info(`Gateway server has started with process id: ${process.pid}`);
      httpserver.listen(SERVER_PORT, () => {
        log.info(`Gateway server running on port: ${SERVER_PORT}`);
      });
    } catch (error) {
      log.log('error', 'GatewayService startHttpServer() error method', error);
    }
  }
}
