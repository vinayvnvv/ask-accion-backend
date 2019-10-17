const msgResponse = require('./services/message-response');
const HttpService = require('./services/http-service');
const env = require('./../env.json');
const initChannel = env.socket.initChannel;
const CommonService = require('./services/common-service');
const AttendenceIntent = require('./intents/attendence');
const LeaveIntent = require('./intents/leave');
const PeopleIntent = require('./intents/poeple');
const SHORT_INTENTS = require('./intents/constants').SHORT_INTENTS;
const INTENT_TYPES = require('./intents/constants').INTENT_TYPE;
const ZohoService = require('./services/zoho-service');
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

    doQuery(body, bucket, connectionType) {
            console.log('msg from user', body);
            this.emailId = body.emailId;
            this.empId = body.empId;
            this.bucket = bucket;
            this.headers = body.headers;
            this.connectionType = connectionType;
            HttpService.queryToDailogFlow(body.msg, body.uuid).then((response) => {
                // console.log(response.data.result.fulfillment);
                this.detectIntent(response.data);
            })
    }

    detectIntent(data) {
        const intent = data.result.metadata.intentName;
        console.log("intent:", intent)
        const intentType = intent.substring(0, intent.indexOf('-'));
        if(intentType === INTENT_TYPES.STATIC) this.handleStaticIntent(data, intent, intentType);
        if(intentType === INTENT_TYPES.DYNAMIC) this.handleDynamicIntent(data, intent, intentType);
    }

    handleStaticIntent(data, intent, intentType) {
        console.log('static intent handle', intent, intentType);
        var msg = msgResponse.createTextResponse(data.result.fulfillment.speech, data.result.fulfillment);
        msg.intent = intent;
        msg = CommonService.appendAutoSuggestion(msg);
        msgResponse.sendMsgToClient(msg, this.bucket, this.connectionType)
    }
    handleDynamicIntent(data, intent, intentType) {
        console.log('dynamic intent handle', intent, intentType);
        const intentDetails = CommonService.extractIntentDetails(intent);
        switch(intentDetails.intentShort) {
            case SHORT_INTENTS.ATTENDENCE: 
                AttendenceIntent.doAction(intentDetails.action);
                break;
            case SHORT_INTENTS.LEAVE: 
                LeaveIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId);
                break;
            case SHORT_INTENTS.WORKING_FROM_HOME: 
                LeaveIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId);
                break;
            case SHORT_INTENTS.PEOPLE:
                PeopleIntent.doAction(intentDetails.action, data, this.bucket, this.connectionType, this.empId);
                break;
        }
        
    }
}

module.exports = new App();