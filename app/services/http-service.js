const env = require('./../../env.json');
const axios = require('axios');
class HttpService {
    queryToDailogFlow(query, uuid) {
        const httpConfig = {
            method: 'post',
            url: env.dialogflow.host + env.dialogflow.path.query + "?v=" + env.dialogflow.version,
            headers: {
                "content-type": "application/json",
                "Authorization": "Bearer 09b51dd64a7c4e34a63af3a3cf85ad0d"
            },
            data: {
                "lang": "en",
                "query": query,
                "sessionId": uuid
              }
        }
        return axios(httpConfig);
    }
}
module.exports = new HttpService();
