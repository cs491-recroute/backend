console.log('-FlowService Swagger Generator-');

const { PORT, HOST } = process.env;
const host = HOST + ":" + PORT;

const swaggerAutogen = require('swagger-autogen')();

const ComponentSubmission = {
    componentID: "62370430195640b4f300ceaa",
    value: ""
};

const doc = {
    info: {
        title: "Flow Management Service",
        description: "Manage operations related to a flow"
    },
    host: host,
    definitions: {
        Flow: {
            name: "Senior Java Developer - 1",
            active: false,
            startDate: new Date(Date.now()).toISOString(),
            endDate: new Date(Date.now()).toISOString()
        },
        Stage: {
            type: 'FORM',
            stageID: "Example: FormID",
            startDate: new Date(Date.now()).toISOString(),
            endDate: new Date(Date.now()).toISOString()
        },
        Interview: {
            name: 'Developer Interview - 1',
            interviewLenghtInMins: 60,
            breakLengthInMins: 15,
            startTime: new Date(Date.now()).toISOString(),
            interviewers: ["6223d54f9c27487fa395cc89"]
        },
        InterviewInstance: {
            interviewee: "6223aad1ff1298ffb1e1ecc8",
            interviewer: "6223d54f9c27487fa395cc89",
            startTime: new Date(Date.now()).toISOString(),
            lengthInMins: 60
        },
        Grade: {
            grade: 78
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
        Component: {
            type: "dropDown",
            required: true,
            title: "Select your city",
            placeholder: "Select.",
            options: ["Ankara", "Istanbul", "Izmir"],
            titles: [""],
            placeholders: [""],
        },
        FormSubmission: {
            componentSubmissions: [ComponentSubmission]
        },
        Question: {
            type: "coding",
            description: "Please answer",
            testCases: [{ input: 1, output: 2 }, { input: 'test', output: 'tset' }]
        }
    }
};

const outputFile = './services/flow/src/swagger/swagger.json';
const endpointsFiles = [`${__dirname}/../routes/*.ts`];

swaggerAutogen(outputFile, endpointsFiles, doc);