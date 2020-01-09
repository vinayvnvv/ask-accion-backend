const intents = require('./../../intents.json');
class CommonService {
    appendAutoSuggestion(msg) {
        if(msg.intent === intents.welcome || msg.intent === 'init') {
            msg.suggestions = ["What can you do?", 'Apply leave', "Show Holidays", "Skills with flutter", 'find my payslip', "My Applied leaves", "My Attendance", "Manager of vinay", 'Working from home today', "when i will recieve salary?", 'what is the dress code?', "what if one rude to me?", "where is e-card?"];
        }
        return msg;
    }

    extractIntentDetails(intentName) {
        const action = intentName.substring(intentName.indexOf('-') + 1, intentName.lastIndexOf('-'));
        const intentShort = intentName.substring(intentName.lastIndexOf('-') + 1, intentName.length);
        return {action, intentShort};
    }

    createPeopleData(peoples) {
        var card = [];
        peoples.forEach((empIds) => {
            Object.keys(empIds).map((key) => {
                var people = empIds[key][0];
                people.zohoId = key;
                card.push(people);
            });
        });
        return card;
    }

    createPoepleCardList(name, email, photo, desc, onClickText) {
        return {
            name, email, photo, desc, onClickText
        }
    }

    createListViewCard(title, desc, ...sections) {
        const obj = {};
        if(title) obj['title'] = title;
        if(desc) obj['desc'] = desc;
        if(sections && sections.length>0 && sections[0]) {
            obj['sections'] = sections;
        }
        return obj;
    }

    getAccessType(empRole, department) {
        let role = 'normal';
        if(department == 'Management' || 
            department == 'Human Resource' || 
            empRole == 'Admin' ||
            empRole == 'Manager' ||
            department == 'Leadership') role = 'Admin';
        return role;
    }
    isAdminAccess(empRole, department) {
        let role = this.getAccessType(empRole, department);
        if(role === 'Admin') return true;
        return false;
    }

    addLinkAction(msg, linkType, linkUrl) {
        return {
            ...msg,
            action: {
                type: 'link',
                linkType, linkUrl
            }
        }
    }
}
module.exports = new CommonService();