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
        // var match = text.match(/\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*/g);
        var match = text.match(/(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d/g);
        if(match) {
            const res = [];
            match.forEach(m => {
                res.push(m.replace(/\s/g,''));
            });
            return res;
        }
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

    processCustomPayloadMessage(object) {
        let outputMessage = Array.isArray(object) ? [] : {};
        Object.entries(object).forEach(([key, value]) => {
            if (value.kind == 'structValue') {
            outputMessage[key] = this.processCustomPayloadMessage(value.structValue.fields);
            } else if (value.kind == 'listValue') {
            outputMessage[key] = this.processCustomPayloadMessage(value.listValue.values);
            } else if (value.kind == 'stringValue') {
            outputMessage[key] = value.stringValue;
            } else if (value.kind == 'boolValue') {
            outputMessage[key] = value.boolValue;
            } else {
            outputMessage[key] = value;
            }
        });
        return outputMessage;
    }

    parseCustomPayload(data) {
        if(!data || data.length === 0) {
            return false;
        }
        const custom = {};
        data.forEach((msg) => {
            if(msg.message === 'payload') {
                const { fields } = msg.payload;
                const payload = this.processCustomPayloadMessage(fields);
                console.log("payload", payload);    
                // if(fields['list']) {
                //     const {list} = fields;
                //     if(list) {
                //         const listValue = list[list['kind']]
                //         if(listValue) {
                //             const { values } = listValue;
                //             if(values && values.length > 0) {
                //                 custom['type'] = 'list';
                //                 custom['list'] = [];
                //                 values.forEach(v=>{
                //                     custom['list'].push(v[v['kind']]);
                //                 });
                //             }
                //         }
                //     }
                // }
                if(!custom.type && payload.type) {
                    custom['type'] = payload.type;
                    custom[payload.type] = payload[payload.type];
                }
            }
        });
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
    createTextResponseWithNotUnderStanding() {
        return this.createTextResponse(`I didn't get that. You can try below things..![[sug]]What can you do?[[/sug]]`);
    }
}

module.exports = new MessageResponse();