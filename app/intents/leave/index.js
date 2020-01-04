const ACTION = require('./constants').ACTIONS;
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const LEAVE_TYPES = require('./constants').LEAVE_TYPES_ID;
const COMMON_CONSTANTS = require('./../../constants');
const { HEADERS, DATE_FORMATS } = COMMON_CONSTANTS;
const ResponseService = require('./../../services/message-response');
const DateService = require('./../../services/date.service');
const ZohoServive = require('./../../services/zoho-service');
const DailogFlowService = require('./../../services/dailogflow.service');
const CommonService = require('./../../services/common-service');
const moment = require('moment');

class LeaveIntent {
    doAction(action, data, bucket, connectionType, empId, emailId, headers) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.data = data;
        this.empId = empId;
        this.emailId = emailId;
        this.headers = headers;
        console.log('inside LeaveIntent with action: ', action);
        switch(action) {
            case ACTION.APPLY_LEAVE: 
                this.applyLeave();
                break;
            case ACTION.WORKING_FROM_HOME: 
                this.applyLeave(true);
                break;
            case ACTION.LEAVE_BALANCE_INFO:
                this.getLeaveInfo();
                break;
            case ACTION.APPLIED_LEAVES_INFO:
                this.getAppliedLeavesInfo();
                break;
            case ACTION.GET_HOLIDAYS:
                this.getHolidays();
                break;
        }
    }

    async applyLeave(isWorkingFromHome) {
        console.log('apply leave', this.data, isWorkingFromHome);
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        const allRequiredParamsPresent = this.data.allRequiredParamsPresent;
        console.log('allRequiredParamsCollected', allRequiredParamsPresent)
        const fullfillmentMsg = this.data.fulfillmentText;
        let msg = {};
        if(allRequiredParamsPresent) {
            var fromDate = '';
            var toDate = '';
            console.log(params);
            if(params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE_PERIOD]) {
                const datesInterval = params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE_PERIOD].split('/');
                fromDate = DateService.getApplyLeaveDateFormat(datesInterval[0]);
                toDate = DateService.getApplyLeaveDateFormat(datesInterval[1]);
            } else {
                fromDate = toDate = DateService.getApplyLeaveDateFormat(params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE]);
            }
            const leaveType = (isWorkingFromHome ? LEAVE_TYPES.WORK_FROM_HOME : LEAVE_TYPES[params[PARAMS_NAMES.LEAVE_TYPE]]);
            console.log("leaveType", leaveType, LEAVE_TYPES.WORK_FROM_HOME, fromDate)
            const response = await ZohoServive.applyLeave(this.empId, fromDate, toDate, leaveType);
            console.log("response", response);
            msg = ResponseService.createTextResponse(response);
        } else {
            msg = ResponseService.createTextResponse(fullfillmentMsg);
            console.log('not full filled');
        }
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }

    async getLeaveInfo() {
        console.log('inside leave balance action');
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        var msg;
        ZohoServive.getLeaveTypeDetails(this.empId, (err, res) => {
            console.log(err, res);
            if(err) {
                msg = ResponseService.createTextResponse('Error in server please try again');
            }
            else if(res.response.errors) {
                msg = ResponseService.createTextResponse(res.response.errors.message);
            } else {
                const leaves = res.response.result;
                if(params[PARAMS_NAMES.LEAVE_TYPE]) { // send filtered queries
                    const leaveId = LEAVE_TYPES[params[PARAMS_NAMES.LEAVE_TYPE]];
                    console.log('leave id:', leaveId);
                    const filteredLeave = (leaves.filter((i) => {return i.Id === leaveId}))[0];
                    console.log('filtered leAVE', filteredLeave);
                    msg = ResponseService.createTextResponse("You have " + filteredLeave.BalanceCount + " out of " + filteredLeave.PermittedCount + ' ' + params[PARAMS_NAMES.LEAVE_TYPE] + " LEAVE.");
                } else { // send list of leaves
                    const obj = [];
                    leaves.forEach((item) => {
                        if(item.PermittedCount > 0) {
                           obj.push({
                                title: item.Name,
                                desc: item.BalanceCount + " out of " + item.PermittedCount,
                                disableClick: true
                            });
                        };
                    })
                    msg = ResponseService.createTextResponse("Here is your leave balances:");
                    msg.type = 'listView';
                    msg.listView = obj;
                    console.log('Leave lIst for list-view', obj);
                }
            }
            ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
        })
    }

    async getAppliedLeavesInfo() {
        console.log('getAppliedLeavesInfo', this.headers, this.data.parameters);
        const role = this.headers[HEADERS.EMP_ID];
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        console.log('params', params);
        let limit = 6;
        try {
            const _date = params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE_PERIOD];
            const res = await ZohoServive.getAppliedLeavesInfo(role, (_date ? -1 : limit));
            if(res.data && res.data[0] && res.data[0].errorcode) {
                msg = ResponseService.createTextResponse(res.data[0].message + ' [Zoho Error]');
            } else {
                let {data} = res;
                let msg;
                if(_date) {
                    data = data.filter(i=>moment(i.From).isBetween(_date[PARAMS_NAMES.START_DATE], _date[PARAMS_NAMES.END_DATE]));
                }
                if(params[PARAMS_NAMES.NUMBER]) {
                    limit = params[PARAMS_NAMES.NUMBER];
                }
                if(limit < data.length) data = data.slice(0, limit);
                
                if(data.length === 0) {
                    msg = ResponseService.createTextResponse('No Leaves are Applied');
                } else {
                    msg = ResponseService.createTextResponse('Here is the list of leaves you have applied')
                    const listView = [];
                    data.forEach(leave=>{
                        listView.push(CommonService.createListViewCard(
                            'Leave Type: ' + leave['Leave Type'],
                            'Applied ' + (leave.From === leave.To ? ('on ' + leave.From) : (' from ' + leave.From + ' to ' + leave.To)) + '(' + leave['Days Taken'] + ' days)',
                            'Approval Status: ' + leave['ApprovalStatus']
                        ))
                    });
                    msg.type = 'listView';
                    msg['listView'] = listView;

                }
                ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
            }
            
        } catch(err) {
            console.log(err);
            const msg = ResponseService.createTextResponse("Sorry, Error in server while quering... Please try again..");
            ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
        }
    }


    async getHolidays() {
        console.log('getHolidays', this.headers, this.data.parameters);
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        console.log('params', params);
        let msg;
        const date_period = params[PARAMS_NAMES.DATE_OR_PERIOD];
        const _date = params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE_PERIOD];
        try {
            let holidays = await ZohoServive.getHolidaysList(this.emailId);
            if(date_period) {
                holidays = holidays.filter(i=>moment(i.fromDate).isBetween(_date[PARAMS_NAMES.START_DATE], _date[PARAMS_NAMES.END_DATE]));
                msg = ResponseService.createTextResponse('Here is the holidays from ' + 
                        moment(_date[PARAMS_NAMES.START_DATE]).format(DATE_FORMATS.ZOHO_DATE_FORMAT) + ' to ' + 
                        moment(_date[PARAMS_NAMES.END_DATE]).format(DATE_FORMATS.ZOHO_DATE_FORMAT)
                      );
                const listView = [];
                holidays.forEach(day=>{
                    listView.push(CommonService.createListViewCard(
                        day['Name'],
                        'Date: ' + day['fromDate'],
                        'Locations: ' + day['LocationName']
                    ));
                });
                msg.type = 'listView';
                msg['listView'] = listView;
            } else {
                msg = ResponseService.createTextResponse('Here is the holidays list of this year.');
            }
            console.log(holidays);
            if(holidays.length === 0) {
                msg = ResponseService.createTextResponse('There is no holidays from ' + 
                        moment(_date[PARAMS_NAMES.START_DATE]).format(DATE_FORMATS.ZOHO_DATE_FORMAT) + ' to ' + 
                        moment(_date[PARAMS_NAMES.END_DATE]).format(DATE_FORMATS.ZOHO_DATE_FORMAT)
                    );
            }
        } catch(err) {
            msg = ResponseService.createTextResponse(err);
        }
        ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
    }
}
module.exports = new LeaveIntent();