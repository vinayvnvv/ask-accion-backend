const dialogflow = require('dialogflow');
const gkeys = require('./../../keys/g-services.json');


class DailogFlow {
    async query(sessionId, msg) {
        // Create a new session
        let config = {
            credentials: {
                private_key: gkeys.private_key,
                client_email: gkeys.client_email
            },
            projectId: gkeys.project_id
        }
        const sessionClient = await new dialogflow.SessionsClient(config);
        const sessionPath = sessionClient.sessionPath(gkeys.project_id, sessionId);
        const request = {
            session: sessionPath,
                queryInput: {
                    text: {
                    // The query to send to the dialogflow agent
                    text: msg,
                    // The language used by the client (en-US)
                    languageCode: 'en-US',
                    },
                },
        };
        const responses = await sessionClient.detectIntent(request);
        console.log('Detected intent', JSON.stringify(responses[0].queryResult.parameters));
        const result = responses[0].queryResult;
        return result;
    }

    parseDailogFlowParams(params) {
        let out = {};
        const loop = (ob, out) => {
            Object.keys(ob).forEach(k => {
                if(ob[k]['kind'] !== 'structValue') {
                    out[k] = ob[k][ob[k]['kind']];
                } else {
                    out[k] = {};
                    loop(ob[k]['structValue']['fields'], out[k]);
                }
            })
        }
        loop(params['fields'] ? params['fields'] : params, out);
        console.log('parsed params ->>>>', out);
        return out;
    }
}
module.exports = new DailogFlow();