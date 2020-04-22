const FILEDS = require('./constants').FIELDS;
const FIELDS_VALUES = require('./constants').FIELDS_VALUES;
const ACTIONS = require('./constants').ACTIONS;
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const COMMON_CONSTANTS = require('./../../constants');
const { FILTER_POEPLE_FIELDS } = COMMON_CONSTANTS;
const ResponseService = require('./../../services/message-response');
const ZohoService = require('./../../services/zoho-service');
const CommonService = require('./../../services/common-service');
const NLPService = require('./../../services/nlp-service');
const DailogFlow = require('./../../services/dailogflow.service');
class PeopleIntent {
    doAction(action, data, bucket, connectionType, empId, headers) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.headers = headers;
        this.data = data;
        this.empId = empId;
        let subAction;
        if(action === ACTIONS.GET_USER_INFO && (subAction = this.isSecureAccessForNormalEmp(headers, data))) {
            this.handleSecureAccessForNormalEmp(subAction);
            return;
        }
        if(action === ACTIONS.GET_USER_INFO && !this.canAccess(headers)) {
            const responseMsg = ResponseService.createTextResponse("Sorry!, You don't have access to view the people actions. Only Managers and Business HR's can view this actions.[[sug]]What else can you do?[[/sug]]");
            responseMsg.resetSession = true;
            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
            return;
        }
        console.log('inside PeopleIntent with action: ', action);
        switch (action) {
            case ACTIONS.GET_USER_INFO:
                this.getUserInfo();
                break;
            case ACTIONS.PEOPLE_BY_SKILL:
                this.getPeopleBySkill();
                break;
        }
    }

    isSecureAccessForNormalEmp(headers, data) {
        const params = DailogFlow.parseStructParams(this.data.parameters.fields);
        var FILTER = params[PARAMS_NAMES.USER_INFO_FILTER];
        if(FILTER.indexOf(FILEDS.CALL) !== -1 && FILTER.indexOf(FILEDS.HR) !== -1) return 'HR_CALL';
        if(FILTER.indexOf(FILEDS.CALL) !== -1 && FILTER.indexOf(FILEDS.MANAGER) !== -1) return 'MANAGER_CALL';
        console.log('isSecureAccessForNormalEmp', FILTER, FILEDS.CALL, FILEDS.HR);
        return false;
    }

    handleSecureAccessForNormalEmp(action) {
        switch(action) {
            case 'HR_CALL': 
                this.handleCallForNormalEmp('HR');
                break;
            case 'MANAGER_CALL': 
                this.handleCallForNormalEmp('MANAGER');
                break;
        }
    }

    async handleCallForNormalEmp(type) {
        let emp = type == 'HR' ? this.headers[COMMON_CONSTANTS.HEADERS.HR] : this.headers[COMMON_CONSTANTS.HEADERS.MANAGER];
        let empId = type == 'HR' ? emp.substring(0, 4) : emp.substring(emp.length - 4);
        let responseMsg;
        ZohoService.getEmpDataByParams('EmployeeID', empId, (err, data) => {
            console.log('sdfsfsdfds----------->', err, data);
            if(err) {
                responseMsg = ResponseService.createTextResponse("Err in server, please try again..");
            } else {
                if(data && data.length > 0) {
                    let emp = data[0];
                    responseMsg = ResponseService.createTextResponse("Calling to " + emp['FirstName'] + " " + emp['LastName'] + " ( " + emp['Mobile'] + " )");
                    responseMsg['isCall'] = true;
                    responseMsg['phoneNumber'] = [emp['Mobile']];
                } else {
                    responseMsg = ResponseService.createTextResponse("Sorry, failed in retrieving the phone number, This error is with the end-database");
                }
            }
            responseMsg.resetSession = true;
            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
        });
    }

    canAccess(headers) {
        if(!headers) return false;
        if(CommonService.getAccessType(headers[COMMON_CONSTANTS.HEADERS.ROLE], headers[COMMON_CONSTANTS.HEADERS.DEPARTMENT]) === COMMON_CONSTANTS.ROLES.ADMIN.VALUE) return true;
        return false;
    }

    async getUserInfo() {
        try {
            console.log('Get User Info Action--->', JSON.stringify(this.data.result));
            const params = DailogFlow.parseStructParams(this.data.parameters.fields);
            console.log('params', params);
            // const actionIncomplete = this.data.result.actionIncomplete;
            // const fullfillmentMsg = this.data.result.fulfillment.speech;
            var GIVEN_NAME = params[PARAMS_NAMES.GIVEN_NAME] || params[PARAMS_NAMES.LAST_NAME] || params[PARAMS_NAMES.ANY];
            const EMAIL = params[PARAMS_NAMES.EMAIL];
            var FILTER = params[PARAMS_NAMES.USER_INFO_FILTER];
            var NAME_FROM_NLP;
            if(!GIVEN_NAME && !params[PARAMS_NAMES.EMAIL]) { //check next level nlp if dailogflow nlp will not able recognize name
                NAME_FROM_NLP = await NLPService.extarctWordsFromSpeech(this.data.queryText);
            }
            console.log('NAME_FROM_NLP', NAME_FROM_NLP);
            if(NAME_FROM_NLP) {
                GIVEN_NAME = NLPService.getValidNameFromArray(NAME_FROM_NLP.rest);
                if(Array.isArray(GIVEN_NAME)) GIVEN_NAME = GIVEN_NAME[0];
                console.log('GIVEN_NAME From the nlp servivce', GIVEN_NAME);
            }
            if(FILTER instanceof Array) {
                FILTER = FILTER[0];
            }
            if (params[PARAMS_NAMES.EMAIL]) {
                ZohoService.getEmpDetails(FIELDS_VALUES.EMAIL[0], EMAIL, (data) => {
                    const peopleData = CommonService.createPeopleData(data.response.result)[0];
                    console.log("filter", FILTER);
                    console.log("peopleData", peopleData);
                    console.log('filed name', FIELDS_VALUES[PARAMS_NAMES.USER_INFO_FILTER]);
                    var value = "";
                    const fields = FIELDS_VALUES[FILTER];
                    console.log('other', fields);
                    let msg = '';
                    if(FILTER === FILEDS.FROFILE) {
                        msg = 'Here is the profile of ' +  peopleData['FirstName'] + ' ' + peopleData['LastName'];
                    } else {
                        if(fields && fields.length > 0) {
                            fields.forEach((key) => {
                                console.log('key', key, 'peopleData[key]', peopleData[key]);
                                if(peopleData[key]) value = peopleData[key];
                            })
                        }
                        if(FILTER && value) {
                            msg = FILTER + " : " + value;
                        } else {
                            msg = 'Here is the profile of ' +  peopleData['FirstName'] + ' ' + peopleData['LastName'];
                        }
                        
                    }
                    const responseMsg = ResponseService.createTextResponse(msg);
                    responseMsg.type = 'profileCard';
                    responseMsg.profileCard = (ZohoService.getSecureFieldsFromPeople([...[], peopleData], FILTER_POEPLE_FIELDS.INIT))[0];
                    // console.log('CONTEXTS', this.data.result.contexts);
                    if(FILTER === FILEDS.CALL) {
                        responseMsg.isCall = true;
                    }
                    ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
                });
            } else if (!GIVEN_NAME && !params[PARAMS_NAMES.EMAIL]) {
                const responseMsg = ResponseService.createTextResponse('specify atlease name or email id');
                responseMsg.resetSession = true;
                ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
            } else {
                ZohoService.getEmpDetails(FIELDS_VALUES.NAME_ALL, GIVEN_NAME, (data) => {
                    if (data) {
                        if (data.response.errors) {
                            console.log('errr', data.response.errors);
                            const responseMsg = ResponseService.createTextResponse(data.response.errors.message);
                            responseMsg.resetSession = true;
                            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
                        } else {
                            const peopleListCardsData = CommonService.createPeopleData(data.response.result);
                            var responseObj = ResponseService.createTextResponse('Which ' + GIVEN_NAME + ' you are looking for?');
                            responseObj.peopleList = ZohoService.getSecureFieldsFromPeople(peopleListCardsData, FILTER_POEPLE_FIELDS.PEOPLE_LIST);
                            responseObj.type = 'people-list';
                            ResponseService.sendMsgToClient(responseObj, this.bucket, this.connectionType);
                        }
                    } else {
                        console.log('err in server');
                        const responseMsg = ResponseService.createTextResponse('Error in server, Please Try Again!!!');
                        ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
                    }

                })
            }
        } catch(err) {
            console.log('err', err);
            const msg = 'Oops!!!, There something err in the server while retrieving, we will consider this query by sending to your Business HR.'
            const responseMsg = ResponseService.createTextResponse(msg);
            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
        }
        
    }

    getPeopleBySkill() {
        console.log('Get getPeopleBySkill Action--->', this.data);
        const params = DailogFlow.parseStructParams(this.data.parameters.fields);
        const SKILLS = params[PARAMS_NAMES.SKILLS];
        const pplCard = [];
        console.log('SKILLS', SKILLS);

        if(!SKILLS) {
            let responseMsg = ResponseService.createTextResponseWithNotUnderStanding();
            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
            return;
        }

        ZohoService.getEmpDataByParams('Expertise', SKILLS, (err, result) => {
            let responseMsg;
            if(err) {
                responseMsg = ResponseService.createTextResponse('Error in server, Please Try Again!!!');
            } 
            else if(!result || result.length === 0) {
                responseMsg = ResponseService.createTextResponse("No people's are found with the skill " + SKILLS);
            } else {
                let listView = [];
                result.forEach(emp => {
                    listView.push(
                        CommonService.createListViewCard(
                            emp['FirstName'] + " " + emp['LastName'],
                            emp['Work_location'],
                            emp['EmailID'] + (this.canAccess(this.headers) ? (" - " + emp["Mobile"]) : "")
                        )
                    );
                });
                responseMsg = ResponseService.createTextResponse("Here is the " + listView.length + " people's with " + SKILLS + ' skills.');
                responseMsg.type = 'listView';
                responseMsg.listView = listView;
            }
            ResponseService.sendMsgToClient(responseMsg, this.bucket, this.connectionType);
        });
    }
}
module.exports = new PeopleIntent();