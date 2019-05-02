const ACTION = require('./constants').ACTIONS;
const ZohoServive = require('./../../services/zoho-service');
class AttendenceIntent {
    doAction(action) {
        console.log('inside AttendenceIntent with action: ', action);
        switch(action) {
            case ACTION.CHECK_IN_ACTION: this.checkInAction();
            case ACTION.CHECK_IN_DETAILS: this.checkInDetails();
        }
    }

    checkInAction() {
        console.log('check in action');
    }

    checkInDetails() {
        console.log('check in details');
        ZohoServive.getUserReport();
    }
}
module.exports = new AttendenceIntent();