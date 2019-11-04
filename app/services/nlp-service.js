const WordPOS = require('wordpos'),
      wordpos = new WordPOS();

class NLPClass {
    constructor() {
        this.replaceTokens = ['', ' ', '.'];
    }
    replaceDeepTokens(words, tokens) {
        console.log('tokens', tokens);
        tokens.forEach(token=> {
            const index = words.indexOf(token);
            if(index !== -1) {
            words.splice(index, 1);
            }
        });
        return words;
    }
    extarctWordsFromSpeech(str) {
        return wordpos.getPOS(str);
    }
    getValidNameFromArray(arr) {
        for(var i=0;i<arr.length;i++) {
            if(arr[i] && arr[i] !== '' && arr[i] !== ' ') return arr[i];
        }
        return false;
    }
    async parseNLPforProjectMembers(str) {
        const res = await wordpos.getPOS(str);
        const customReplaceTokens = ['member', 'members', 'team', 'teams', 'people', 'poeples', 'teamates'];
        let words = res.rest;
        console.log(words);
        words = this.replaceDeepTokens(words, this.replaceTokens.concat(customReplaceTokens));
        console.log(words);
        return words;
    }
}
module.exports = new NLPClass();