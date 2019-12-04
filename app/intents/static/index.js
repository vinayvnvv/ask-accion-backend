const { CommonService, ResponseService } = require('./../../services');
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



        const text = this.data.fulfillmentText;
        var msg = ResponseService.createTextResponse(text, this.data.fulfillmentMessages);
        msg.intent = intent;
        msg = CommonService.appendAutoSuggestion(msg);
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }
}
module.exports = new StaticIntent();