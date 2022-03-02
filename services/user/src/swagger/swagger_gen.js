const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: "User Management Service",
        description: "Manage operations related to a user"
    },
    host: "localhost:3500",
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

const outputFile = './swagger.json';
const endpointsFiles = [`${__dirname}/../routes/*.ts`];

swaggerAutogen(outputFile, endpointsFiles, doc);