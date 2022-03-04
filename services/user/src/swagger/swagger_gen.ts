const swaggerGenerator = (host: String) => {
    const swaggerAutogen = require('swagger-autogen')();

    const doc = {
        info: {
            title: "User Management Service",
            description: "Manage operations related to a user"
        },
        host: host,
        definitions: {
            Company: {
                name: "Google",
                domain: "google.com",
                users: [{
                    $ref: '#/definitions/User'
                }]
            },
            User: {
                name: "Aybars",
                email: "aybars.altinisik@gmail.com"
            }
        }
    };

    const outputFile = './services/user/src/swagger/swagger.json';
    const endpointsFiles = [`${__dirname}/../routes/*.ts`];

    swaggerAutogen(outputFile, endpointsFiles, doc);
}

export { swaggerGenerator as swaggerGenerator };