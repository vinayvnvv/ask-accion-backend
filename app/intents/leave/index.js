const ACTION = require('./constants').ACTIONS;
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const LEAVE_TYPES = require('./constants').LEAVE_TYPES_ID;
const ResponseService = require('./../../services/message-response');
const ENV = require('./../../../env.json');
const msgChannel = ENV.socket.msgchannel;
const DateService = require('./../../services/date.service');
const ZohoServive = require('./../../services/zoho-service');
class LeaveIntent {
    doAction(action, data, bucket, connectionType, empId) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.data = data;
        this.empId = empId;
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
        }
    }

    async applyLeave(isWorkingFromHome) {
        console.log('apply leave', this.dat, isWorkingFromHome);
        const params = this.data.result.parameters;
        const actionIncomplete = this.data.result.actionIncomplete;
        const fullfillmentMsg = this.data.result.fulfillment.speech;
        let msg = {};
        if(!actionIncomplete) {
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
            console.log("leaveType", leaveType, LEAVE_TYPES.WORK_FROM_HOME)
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
        const params = this.data.result.parameters;
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
}
module.exports = new LeaveIntent();