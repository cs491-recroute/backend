console.log('-FlowService Swagger Generator-');

const { PORT, HOST } = process.env;
const host = HOST + ":" + PORT;

const swaggerAutogen = require('swagger-autogen')();

const ComponentSubmission = {
    componentID: "62370430195640b4f300ceaa",
    value: ""
};

const QuestionSubmission = {
    questionID: "62370430195640b4f300ceaa",
    value: ""
};

const doc = {
    info: {
        title: "Flow Management Service",
        description: "Manage operations related to a flow"
    },
    host: host,
    schemes: ['http', 'https'],
    definitions: {
        Flow: {
            name: "Senior Java Developer - 1",
            active: false,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
        },
        Stage: {
            type: 'FORM',
            stageID: "Example: FormID",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
        },
        Interview: {
            name: 'Developer Interview - 1',
            interviewLengthInMins: 60,
            breakLengthInMins: 15,
            startTime: new Date().toISOString(),
            interviewers: ["6223d54f9c27487fa395cc89"]
        },
        InterviewInstance: {
            interviewee: "6223aad1ff1298ffb1e1ecc8",
            interviewer: "6223d54f9c27487fa395cc89",
            startTime: new Date().toISOString(),
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
            name: "City",
            type: "dropDown",
            required: true,
            title: "Select your city",
            placeholder: "Select.",
            options: ["Ankara", "Istanbul", "Izmir"],
            titles: [""],
            placeholders: [""],
        },
        ComponentWithOptions: {
            name: "City",
            type: "dropDown",
            required: true,
            title: "Select your city",
            placeholder: "Select.",
            options: [{
                description: "Ankara",
                _id: "6223aad1ff1298ffb1e1ecc8"
            }],
            titles: [""],
            placeholders: [""],
        },
        FormSubmission: {
            formData: { componentSubmissions: { "62370430195640b4f300ceaa": ComponentSubmission } }
        },
        TestSubmission: {
            questionSubmissions: { "62370430195640b4f300ceaa": QuestionSubmission }
        },
        Question: {
            name: "PalindromicSubsequence",
            type: "coding",
            description: "Please answer",
            testCases: [{ input: 1, output: 2 }, { input: 'test', output: 'tset' }]
        },
        QuestionTemplate: {
            name: "PalindromicSubsequence",
            type: "coding",
            description: "Please answer",
            testCases: [{ input: 1, output: 2 }, { input: 'test', output: 'tset' }],
            categoryID: "625182833db70cfc30aaf2b7"
        },
        QuestionCategory: {
            name: "Algorithm"
        },
        PaginateOptions: {
            select: "_id stageSubmissions",
            sort: { "stageIndex": 1 },
            page: 2,
            limit: 2
        },
        TimeSlotInfo: {
            interviewerID: "625182833db70cfc30aaf2b7",
            timeSlotID: "625182833db70cfc30aaf2b7"
        },
        SubmissionQueries: {
            stageIndex: 1,
            stageCompleted: true,
            sort_by: 'email',
            order_by: 'asc',
            page: 1,
            limit: 10,
            filters: {
                email: 'a'
            }
        },
        InterviewSubmission: {
            notes: "",
            grade: 85
        }
    }
};

const outputFile = './services/flow/src/swagger/swagger.json';
const endpointsFiles = [`${__dirname}/../routes/*.ts`];

swaggerAutogen(outputFile, endpointsFiles, doc);