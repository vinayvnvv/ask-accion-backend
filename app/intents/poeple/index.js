const FILEDS = require('./constants').FIELDS;
const FIELDS_VALUES = require('./constants').FIELDS_VALUES;
const ACTIONS = require('./constants').ACTIONS;
const PARAMS_NAMES = require('./../constants').PARAMS_NAMES;
const ENV = require('./../../../env.json');
const COMMON_CONSTANTS = require('./../../constants');
const { FILTER_POEPLE_FIELDS } = COMMON_CONSTANTS;
const ResponseService = require('./../../services/message-response');
const ZohoService = require('./../../services/zoho-service');
const CommonService = require('./../../services/common-service');
const NLPService = require('./../../services/nlp-service');
const AICService = require('./../../services/aic.service');
const DailogFlow = require('./../../services/dailogflow.service');
class PeopleIntent {
    doAction(action, data, bucket, connectionType, empId, headers) {
        this.bucket = bucket;
        this.connectionType = connectionType;
        this.headers = headers;
        this.data = data;
        this.empId = empId;
        if(action === ACTIONS.GET_USER_INFO && !this.canAccess(headers)) {
            const responseMsg = ResponseService.createTextResponse("Sorry!, You don't have access to view the people actions. Only Managers and Business HR's can view this actions.[[sug]]What else can you do?[[/sug]]");
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

    canAccess(headers) {
        if(!headers) return false;
        if(headers[COMMON_CONSTANTS.HEADERS.ROLE] === COMMON_CONSTANTS.ROLES.ADMIN.VALUE) return true;
        return false;
    }

    async getUserInfo() {
        console.log('Get User Info Action--->', this.data, JSON.stringify(this.data.parameters));
        const params = DailogFlow.parseStructParams(this.data.parameters.fields);
        console.log('params', params);
        // const actionIncomplete = this.data.result.actionIncomplete;
        // const fullfillmentMsg = this.data.result.fulfillment.speech;
        var GIVEN_NAME = params[PARAMS_NAMES.GIVEN_NAME] || params[PARAMS_NAMES.ANY];
        const EMAIL = params[PARAMS_NAMES.EMAIL];
        var FILTER = params[PARAMS_NAMES.USER_INFO_FILTER];
        var NAME_FROM_NLP;
        if(!GIVEN_NAME && !params[PARAMS_NAMES.EMAIL]) { //check next level nlp if dailogflow nlp will not able recognize name
            NAME_FROM_NLP = await NLPService.extarctWordsFromSpeech(this.data.result.resolvedQuery);
        }
        console.log('NAME_FROM_NLP', NAME_FROM_NLP);
        if(NAME_FROM_NLP) {
            GIVEN_NAME = NLPService.getValidNameFromArray(NAME_FROM_NLP.rest);
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
                if(fields && fields.length > 0) {
                    fields.forEach((key) => {
                        console.log('key', key, 'peopleData[key]', peopleData[key]);
                        if(peopleData[key]) value = peopleData[key];
                    })
                }
                const msg = FILTER + " : " + value;
                const responseMsg = ResponseService.createTextResponse(msg);
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
            ZohoService.getEmpDetails(FIELDS_VALUES.FIRST_NAME[0], GIVEN_NAME, (data) => {
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