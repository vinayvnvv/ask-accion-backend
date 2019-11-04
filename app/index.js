const msgResponse = require('./services/message-response');
const env = require('./../env.json');
const initChannel = env.socket.initChannel;
const CommonService = require('./services/common-service');
const AttendenceIntent = require('./intents/attendence');
const LeaveIntent = require('./intents/leave');
const PeopleIntent = require('./intents/poeple');
const ProjectIntent = require('./intents/project');
const SHORT_INTENTS = require('./intents/constants').SHORT_INTENTS;
const INTENT_TYPES = require('./intents/constants').INTENT_TYPE;
const ZohoService = require('./services/zoho-service');
const DailogFlowService = require('./services/dailogflow.service');
class App {
    
    doConnect(bucket, connectionType) {
        var msg = msgResponse.createTextResponse('Welcome to Accion Assistance!');
        msg.intent = 'init';
        msg = CommonService.appendAutoSuggestion(msg);
        msgResponse.sendMsgToClient(msg, bucket, connectionType);
    }

    doInit(body, bucket, connectionType) {
        ZohoService.getEmpId(body.emailId, (obj) => {
            console.log('emp id:', obj.empId);
            msgResponse.sendMsgToClient(obj, bucket, connectionType, initChannel);
        });
    }

    async doQuery(body, bucket, connectionType) {
            console.log('msg from user', body);
            this.emailId = body.emailId;
            this.empId = body.empId;
            this.bucket = bucket;
            this.headers = body.headers;
            this.connectionType = connectionType;
            // HttpService.queryToDailogFlow(body.msg, body.uuid).then((response) => {
            //     console.log('HttpService', JSON.stringify(response.data.result));
            //     this.detectIntent(response.data);
            // });
            const result = await DailogFlowService.query(body.uuid, body.msg);
            this.detectIntent(result);
            console.log('result-->', JSON.stringify(result));

    }

    detectIntent(data) {
        const intent = data.intent.displayName;
        console.log("intent:", intent)
        const intentType = intent.substring(0, intent.indexOf('-'));
        if(intentType === INTENT_TYPES.STATIC) this.handleStaticIntent(data, intent, intentType);
        if(intentType === INTENT_TYPES.DYNAMIC) this.handleDynamicIntent(data, intent, intentType);
    }

    handleStaticIntent(data, intent, intentType) {
        console.log('static intent handle', intent, intentType);
        var msg = msgResponse.createTextResponse(data.fulfillmentText, data.fulfillmentMessages);
        msg.intent = intent;
        msg = CommonService.appendAutoSuggestion(msg);
        msgResponse.sendMsgToClient(msg, this.bucket, this.connectionType)
    }
    handleDynamicIntent(data, intent, intentType) {
        console.log('dynamic intent handle', intent, intentType);
        const intentDetails = CommonService.extractIntentDetails(intent);
        switch(intentDetails.intentShort) {
            case SHORT_INTENTS.ATTENDANCE: 
                AttendenceIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId, this.emailId, this.headers);
                break;
            case SHORT_INTENTS.LEAVE: 
                LeaveIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId, this.headers);
                break;
            case SHORT_INTENTS.WORKING_FROM_HOME: 
                LeaveIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId, this.headers);
                break;
            case SHORT_INTENTS.PEOPLE:
                PeopleIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId, this.headers);
                break;
            case SHORT_INTENTS.PROJECT:
                ProjectIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId, this.headers);
                break;
        }
        
    }
}

module.exports = new App();