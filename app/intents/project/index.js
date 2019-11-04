const ACTION = require('./constants').ACTIONS;
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const LEAVE_TYPES = require('./constants').LEAVE_TYPES_ID;
const COMMON_CONSTANTS = require('./../../constants');
const { HEADERS } = COMMON_CONSTANTS;
const ResponseService = require('./../../services/message-response');
const DateService = require('./../../services/date.service');
const ZohoServive = require('./../../services/zoho-service');
const { NLPService } = require('./../../services');
const DailogFlowService = require('./../../services/dailogflow.service');
const CommonService = require('./../../services/common-service');
const moment = require('moment');

class ProjectIntent {
    doAction(action, data, bucket, connectionType, empId, headers) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.data = data;
        this.empId = empId;
        this.headers = headers;
        console.log('inside ProjectIntent with action: ', action);
        switch(action) {
            case ACTION.PROJECT_MEMBERS: 
                this.showProjectMembers();
                break;
        }
    }

    async showProjectMembers() {
        console.log('inside showProjectMembers');
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        const query = this.data.queryText;
        const meEntity = params[PARAMS_NAMES.ME_ENTITY];
        const tokenParsed = await NLPService.parseNLPforProjectMembers(query);
        let projectName = '';
        if(meEntity || tokenParsed.length === 0) {
            projectName = this.headers[COMMON_CONSTANTS.HEADERS.DEPARTMENT];
        }
        console.log('params-->', tokenParsed, params, meEntity, query, projectName);
    }
}
module.exports = new ProjectIntent();