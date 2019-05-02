const env = require('./../../env.json');
const msgChannel = env.socket.msgchannel;
const connectionTypes = env.connectionTypes;
class MessageResponse {
    createTextResponse(text, fullfillment) {
        var parsedText = this.parseText(text);
        var parsedCustomPayload = this.parseCustomPayload(fullfillment);
        var model = {
            type: 'text',
            msg: parsedText.text,
            from: 'bot'
        }
        if(parsedText.suggestions) model.suggestions = parsedText.suggestions;
        if(parsedText.phoneNumber) model.phoneNumber = parsedText.phoneNumber;
        if(parsedCustomPayload) {
            model.type = parsedCustomPayload.type;
            model[parsedCustomPayload.type] = parsedCustomPayload[parsedCustomPayload.type];
        }
        return model;
    }

    parseText(text) {
        var obj = {};
        
        var sugParsed = this.parseAutoSuggestion(text);
        if(sugParsed.suggestions) obj.suggestions = sugParsed.suggestions;
        text = sugParsed.text;

        var phoneParsed = this.parsePhoneNumber(text);
        if(phoneParsed) obj.phoneNumber = phoneParsed;

        obj.text = text;
        return obj;
    }

    parsePhoneNumber(text) {
        var match = text.match(/\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*/g);
        if(match) return match;
        else return false;
    }

    parseAutoSuggestion(text) {
        var suggestions = null;
        var obj = {};
        text = text.replace(/\[\[sug\]\](.*)\[\[\/sug\]\]/, ($1, $2) => {
            suggestions = $2.split(',');
            return "";
        });
        if(suggestions && suggestions.length > 0) {
            obj.suggestions = suggestions;
        }
        obj.text = text;
        return obj;
    }

    parseCustomPayload(data) {
        if(!data) return false;
        var custom = {};
        const messages = data.messages;
        if(messages) {
            messages.forEach((msg) => {
                if(msg.type === 4 && msg.payload) {
                    const payload = msg.payload;
                    if(payload.type) {
                        custom.type = payload.type;
                        custom[payload.type] = payload[payload.type]
                    }
                }
            })
        }
        if(custom.type) return custom;
        else return false;
     }

    sendMsgToClient(data, bucket, connectionType, channel) {
        console.log('sending msg to client', data, channel, typeof bucket);
        if(!channel) channel = msgChannel;
        if(bucket && connectionType === connectionTypes.socket) {
            bucket.emit(channel, data);
        } else {
            bucket.send(data);
        }
    }
}

module.exports = new MessageResponse();