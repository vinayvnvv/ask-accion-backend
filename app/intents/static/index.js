const { CommonService, ResponseService, DailogFlowService } = require('./../../services');
const { PARAMS_NAMES } = require('./../constants');
const { LINK_ACTIONS } = require('./../../constants');
const { ACTIONS } = require('./constants');
class StaticIntent {
    handle(intent, data, bucket, connectionType, empId, emailId, headers) {
        this.intent = intent;
        this.data = data;
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.empId = empId;
        this.emailId = emailId;
        this.headers = headers;

        const intentDetails = CommonService.extractIntentDetails(intent);
        console.log('intentDetails', intentDetails);

        switch(intentDetails.action) {
            case ACTIONS.GET_OFFICE_DIRECTION:
                this.handleOfficeDirection();
                break;
            case ACTIONS.GET_CONTACT_OFFICE_NUMBERS:
                this.handleOfficeContact();
                break;
            default:
                this.handleDefaultAction();
                break;
        }
    }
    handleDefaultAction() {
        const text = this.data.fulfillmentText;
        var msg = ResponseService.createTextResponse(text, this.data.fulfillmentMessages);
        msg.intent = this.intent;
        msg = CommonService.appendAutoSuggestion(msg);
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }
    handleOfficeDirection() {
        const text = this.data.fulfillmentText;
        const allRequiredParamsPresent = this.data.allRequiredParamsPresent;
        let msg = {};
        if(allRequiredParamsPresent) {
            const fulfillmentMessages = this.data.fulfillmentMessages;
            if(fulfillmentMessages && fulfillmentMessages.length > 1 && fulfillmentMessages[1].payload) {
                const parsedCustomPayload = DailogFlowService.parseStructParams(this.data.fulfillmentMessages[1].payload.fields);
                const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
                console.log('office loc->', parsedCustomPayload, params, parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]]);
                msg = ResponseService.createTextResponse(text + ' - ' + parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]]);
                msg = CommonService.addLinkAction(msg, LINK_ACTIONS.URL, parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]])
            } else {
                msg = ResponseService.createTextResponse('Sorry, Problem in getting location. Try after sometime.');
            }
        } else {
            msg = ResponseService.createTextResponse(text, this.data.fulfillmentMessages);
        }
        msg.intent = this.intent;
        msg = CommonService.appendAutoSuggestion(msg);
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }
    handleOfficeContact() {
        const text = this.data.fulfillmentText;
        const allRequiredParamsPresent = this.data.allRequiredParamsPresent;
        let msg = {};
        if(allRequiredParamsPresent) {
            const fulfillmentMessages = this.data.fulfillmentMessages;
            if(fulfillmentMessages && fulfillmentMessages.length > 1 && fulfillmentMessages[1].payload) {
                const parsedCustomPayload = DailogFlowService.parseStructParams(this.data.fulfillmentMessages[1].payload.fields);
                const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
                console.log('contatc num->', parsedCustomPayload, params, parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]]);
                msg = ResponseService.createTextResponse(text + ' = ' + parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]]);
                // msg = CommonService.addLinkAction(msg, LINK_ACTIONS.URL, parsedCustomPayload[params[PARAMS_NAMES.OFFICE_LOCATION]])
            } else {
                msg = ResponseService.createTextResponse('Sorry, Problem in getting the contact numbers. Try after sometime.');
            }
        } else {
            msg = ResponseService.createTextResponse(text, this.data.fulfillmentMessages);
        }
        msg.intent = this.intent;
        msg = CommonService.appendAutoSuggestion(msg);
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }
}
module.exports = new StaticIntent();