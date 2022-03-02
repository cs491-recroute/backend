const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: "Flow Management Service",
        description: "Manage operations related to a flow"
    },
    host: "localhost:3501"
};

const outputFile = './swagger.json';
const endpointsFiles = [`${__dirname}/../routes/*.ts`];

swaggerAutogen(outputFile, endpointsFiles, doc);