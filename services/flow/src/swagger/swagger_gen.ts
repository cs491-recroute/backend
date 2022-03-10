const swaggerGenerator = (host: String) => {
    const swaggerAutogen = require('swagger-autogen')();

    const doc = {
        info: {
            title: "Flow Management Service",
            description: "Manage operations related to a flow"
        },
        host: host,
        definitions: {
            Flow: {
                name: "Senior Java Developer - 1"
            },
            Stage: {
                type: 'FORM',
                stageID: "Example: FormID",
                startDate: new Date(Date.now()).toISOString(),
                endDate: new Date(Date.now()).toISOString()
            }
        }
    };

    const outputFile = './services/flow/src/swagger/swagger.json';
    const endpointsFiles = [`${__dirname}/../routes/*.ts`];

    swaggerAutogen(outputFile, endpointsFiles, doc);
    console.log('done!');
}

export { swaggerGenerator as swaggerGenerator };