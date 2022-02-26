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