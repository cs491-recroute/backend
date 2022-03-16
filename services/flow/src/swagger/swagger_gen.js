console.log('-FlowService Swagger Generator-');

const { PORT, HOST } = process.env;
const host = HOST + ":" + PORT;

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
            durationSpecified: true,
            startDate: new Date(Date.now()).toISOString(),
            endDate: new Date(Date.now()).toISOString()
        },
        Prop: {
            name: "title",
            value: null
        },
        Condition: {
            from: 'Stage ID 1',
            to: 'Stage ID 2',
            field: 'Field ID 1: Optional',
            operation: 'gte',
            value: '10'
        },
        ComponentWithValues: {
            type: "dropDown",
            required: true,
            title: "Select your city",
            placeholder: "Select.",
            options: ["Ankara", "Istanbul", "Izmir"]
        },
        ComponentWithOptions: {
            type: "dropDown",
            required: true,
            title: "Select your city",
            placeholder: "Select.",
            options: [{ key: 0, value: "Ankara" }]
        }
    }
};

const outputFile = './services/flow/src/swagger/swagger.json';
const endpointsFiles = [`${__dirname}/../routes/*.ts`];

swaggerAutogen(outputFile, endpointsFiles, doc);