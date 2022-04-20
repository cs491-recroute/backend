import { NextFunction, Request, Response, Application, RequestHandler } from 'express';
import https from 'https';
import fs from 'fs-extra';

export function connectToDatabase(connectFunc: any, success: () => void, error: (err: string) => void) {
  const { DB_HOSTNAME, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
  return connectFunc(`mongodb://${DB_HOSTNAME}:${DB_PORT}`, {
    user: DB_USERNAME,
    pass: DB_PASSWORD,
    dbName: DB_NAME,
    authSource: 'admin',
  }).then(
    success,
    error
  );
}

export function mountExpress(app: Application, middlewares: Array<RequestHandler>) {
  const { HOST, PORT, SERVICE_NAME } = process.env;

  // Logger
  app.use((req, res, next) => {
    console.log(`${SERVICE_NAME}:${req.url}`);
    next();
  });

  app.use(middlewares);

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({ 'message': err.message });
    return;
  });

  if (HOST === "localhost") {
    httpServer(app, PORT, SERVICE_NAME);
  }
  else {
    httpsServer(app, PORT, SERVICE_NAME);
  }
}

export function httpServer(app: Application, PORT: any, SERVICE_NAME: any) {
  app.listen(PORT, () => {
    console.log(`(http) ${SERVICE_NAME} service is listening on port ${PORT}`);
  });
}

export function httpsServer(app: Application, PORT: any, SERVICE_NAME: any) {
  const https_options = {
    key: fs.readFileSync("/etc/ssl/recroute.co/generated-private-key.txt"),
    cert: fs.readFileSync("/etc/ssl/recroute.co/acef6459c969fd6c.crt"),
    ca: fs.readFileSync("/etc/ssl/recroute.co/gd_bundle-g2-g1.crt")
  };

  https.createServer(https_options, app).listen(PORT, () => {
    console.log(`(https) ${SERVICE_NAME} service is listening on port ${PORT}`);
  });
}

export function createMiddleware(callback: (req: Request, res: Response, next?: NextFunction) => Promise<Response<any, Record<string, any>> | void>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await callback(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export function getUserID(req: Request): string {
  return req.query?.userID?.toString() || '';
}

export function getBody<Type>(reqbody: any, keys: string[]): Type {
  const body = {} as any;

  for (let prop of Object.getOwnPropertyNames(reqbody)) {
    if (keys.includes(prop)) {
      if (reqbody[prop] !== null) {
        body[prop] = reqbody[prop];
      } else {
        body[prop] = undefined;
      }
    }
  }

  return body;
}