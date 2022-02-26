import { NextFunction, Request, Response, Application, RequestHandler, ErrorRequestHandler } from 'express';

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

  app.use((req, res, next) => {
    console.log(req.url);
    next();
  });
  
  app.use(middlewares);
  
  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({'message': err.message});
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