const swaggerGenerator = (host: String) => {
    const swaggerAutogen = require('swagger-autogen')();

    const doc = {
        info: {
            title: "Flow Management Service",
            description: "Manage operations related to a flow"
        },
        host: host
    };

    const outputFile = './services/flow/src/swagger/swagger.json';
    const endpointsFiles = [`${__dirname}/../routes/*.ts`];

    swaggerAutogen(outputFile, endpointsFiles, doc);
    console.log('done!');
}

export { swaggerGenerator as swaggerGenerator };