const ACTION = require('./constants').ACTIONS;
const services = require('./../../services');
const COMMON_CONSTANTS = require('./../../constants');
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const PARAMS_VALUES = require('./../constants').PARAMS_VALUES;
const moment = require('moment');
const { DailogFlowService, ResponseService, ZohoService, CommonService } = services;
const { DATE_FORMATS } = COMMON_CONSTANTS;
class AttendenceIntent {
    doAction(action, data, bucket, connectionType, empId, emailId, headers) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.data = data;
        this.empId = empId;
        this.headers = headers;
        this.emailId = emailId;
        console.log('inside AttendenceIntent with action: ', action);
        switch(action) {
            case ACTION.SHOW_ATTENDANCE: this.showAttendance();
        }
    }

    async showAttendance() {
        console.log('showAttendance', this.headers, this.data.parameters);
        const params = DailogFlowService.parseDailogFlowParams(this.data.parameters);
        console.log('params', params);
        let limit = 6;
        try {
            const _datePeriod = params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE_PERIOD];
            const _date = params[PARAMS_NAMES.DATE_OR_PERIOD][PARAMS_NAMES.DATE];
            const _rangeGap = params[PARAMS_NAMES.RANGE_GAP];
            if(params[PARAMS_NAMES.NUMBER]) {
                limit = params[PARAMS_NAMES.NUMBER];
            }
            const _todayDate = new Date();
            let msg;
            let textMsg = '';
            let _dateFrom, _dateTo;
            if(_date) {
                _dateFrom = _dateTo = moment(_date).format(DATE_FORMATS.ZOHO_DATE_FORMAT);
                textMsg = 'Here is your attendance status on ' + _dateFrom;
            } 
            else if(_datePeriod) {
                _dateFrom = moment(_datePeriod[PARAMS_NAMES.START_DATE]);
                _dateTo = moment(_datePeriod[PARAMS_NAMES.END_DATE]);
                if(_dateTo.isAfter(_todayDate)) {
                    _dateTo = moment(_todayDate);
                }
                const _dateDiff = (_dateTo.diff(_dateFrom, 'days') + 1);
                console.log("_dateDiff", _dateDiff);
                if(limit > _dateDiff) {
                    limit = _dateDiff;
                }
                console.log('limit', limit)
                if(_rangeGap && limit > 1) {
                    console.log('rageGap', _rangeGap, PARAMS_VALUES.RANGE_GAP.FIRST, PARAMS_VALUES.RANGE_GAP.LAST);
                    if(_rangeGap === PARAMS_VALUES.RANGE_GAP.FIRST) {
                        _dateTo = moment(_dateFrom.toDate()).add((limit-1), 'd');
                    }
                    if(_rangeGap === PARAMS_VALUES.RANGE_GAP.LAST) {
                        _dateFrom = moment(_dateTo.toDate()).subtract((limit-1), 'd');
                    }
                }
                _dateFrom = _dateFrom.format(DATE_FORMATS.ZOHO_DATE_FORMAT);
                _dateTo = _dateTo.format(DATE_FORMATS.ZOHO_DATE_FORMAT);
                textMsg = 'Here is your attendance status from ' + _dateFrom + ' to ' + _dateTo;
            } else {
                _dateFrom = moment(_todayDate).subtract((limit - 1), 'd').format(DATE_FORMATS.ZOHO_DATE_FORMAT);
                _dateTo = moment(_todayDate).format(DATE_FORMATS.ZOHO_DATE_FORMAT);
                textMsg = 'Here is your attendance status from ' + _dateFrom + ' to ' + _dateTo;
            }
            if(moment(_dateFrom).isAfter(new Date())) {
                msg = ResponseService.createTextResponse("Sorry, Attendance is Not Available for future dates, You can Try below..[[sug]]My Attendance Yesterday, Attendance of March 2019, My Last 10 Attendance list[[/sug]]");
            } else {
                console.log('_date', _date, _datePeriod);
                const res = await ZohoService.getAttendanceReport(this.emailId, _dateFrom, _dateTo);
                console.log('zoho -result', res.data);
                const data = res.data;
                const listView = [];
                Object.keys(data).forEach(k=>{
                    var val = data[k];
                    const isHoliday = val['Status'] === 'Weekend' ? true : false;
                    let desc, sections;
                    if(!isHoliday) {
                        desc = "Working Hours: " + val['WorkingHours'];
                        sections = moment(val['FirstIn']).format('LT') + " to " + moment(val['LastOut']).format('LT');
                    }
                    listView.push(CommonService.createListViewCard(
                        k + " - " + val['Status'],
                        desc,
                        sections,
                    ))
                })
                listView.sort((left, right) => {
                    let lDate = left.title.split(" - ");
                    let rDate = right.title.split(" - ");
                    return moment.utc(lDate[0]).diff(moment.utc(rDate[0]));
                })
                msg = ResponseService.createTextResponse(textMsg);
                msg.type = "listView";
                msg.listView = listView;
            }
            ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
        } catch(err) {
            console.log(err);
            const msg = ResponseService.createTextResponse("Sorry, Error in server while quering... Please try again..");
            ResponseService.sendMsgToClient(msg, this.bucket, this.connectionType);
        }
    }

}
module.exports = new AttendenceIntent();