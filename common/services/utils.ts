import { NextFunction, Request, Response, Application, RequestHandler } from 'express';

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
  const { PORT, SERVICE_NAME } = process.env;

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

  app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} service is listening on port ${PORT}`);
  })
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

export function getBody<Type>(req: Request, keys: string[]): Type {
  const body = {} as any;

  for (let prop of Object.getOwnPropertyNames(req.body)) {
    if (keys.includes(prop)) {
      if (req.body[prop] !== null) {
        body[prop] = req.body[prop];
      } else {
        body[prop] = undefined;
      }
    }
  }

  return body;
}